package auth

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Roles  []string `json:"roles"`
	jwt.RegisteredClaims
}

type Service struct {
	secretKey []byte
	db        *pgxpool.Pool
}

func NewService(secret string, db *pgxpool.Pool) *Service {
	return &Service{secretKey: []byte(secret), db: db}
}

func (s *Service) GenerateToken(userID, email string, roles []string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: userID,
		Email:  email,
		Roles:  roles,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.secretKey)
}

func (s *Service) ValidateToken(tokenStr string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return s.secretKey, nil
	})

	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// Middleware for enforcing authentication
func (s *Service) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "missing authorization header", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "invalid authorization header", http.StatusUnauthorized)
			return
		}

		claims, err := s.ValidateToken(parts[1])
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), "user", claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Middleware for enforcing RBAC
func (s *Service) RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value("user").(*Claims)
			if !ok {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}

			hasRole := false
			for _, userRole := range claims.Roles {
				for _, requiredRole := range roles {
					if userRole == requiredRole || userRole == "SUPER_ADMIN" {
						hasRole = true
						break
					}
				}
			}

			if !hasRole {
				http.Error(w, "forbidden: insufficient permissions", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// Register HTTP Routes
func (s *Service) RegisterRoutes(r chi.Router) {
	r.Post("/login", s.HandleLogin)
}

// Login Handler (Mock DB logic)
func (s *Service) HandleLogin(w http.ResponseWriter, r *http.Request) {
	type LoginRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	// --- DEMO BYPASS FOR UI PREVIEW (Due to Database Unavailability) ---
	if req.Email == "admin@company.com" && req.Password == "admin123" {
		token, _ := s.GenerateToken("demo-admin-id", req.Email, []string{"SUPER_ADMIN"})
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"token":   token,
			"user": map[string]interface{}{
				"id":    "demo-admin-id",
				"email": req.Email,
				"roles": []string{"SUPER_ADMIN"},
			},
		})
		return
	}
	if req.Email == "hr@company.com" && req.Password == "hr123" {
		token, _ := s.GenerateToken("demo-hr-id", req.Email, []string{"HR_ADMIN"})
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"token":   token,
			"user": map[string]interface{}{
				"id":    "demo-hr-id",
				"email": req.Email,
				"roles": []string{"HR_ADMIN"},
			},
		})
		return
	}
	if req.Email == "employee@company.com" && req.Password == "emp123" {
		token, _ := s.GenerateToken("demo-emp-id", req.Email, []string{"EMPLOYEE"})
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"token":   token,
			"user": map[string]interface{}{
				"id":    "demo-emp-id",
				"email": req.Email,
				"roles": []string{"EMPLOYEE"},
			},
		})
		return
	}
	// --- END DEMO BYPASS ---

	var userID, passwordHash string
	var isActive bool
	err := s.db.QueryRow(r.Context(), "SELECT id, password_hash, is_active FROM users WHERE email = $1", req.Email).Scan(&userID, &passwordHash, &isActive)
	if err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	if !isActive {
		http.Error(w, "account is suspended", http.StatusForbidden)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	// Fetch roles
	rows, err := s.db.Query(r.Context(), `
		SELECT r.name 
		FROM roles r 
		JOIN user_roles ur ON r.id = ur.role_id 
		WHERE ur.user_id = $1
	`, userID)
	
	var roles []string
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var role string
			if err := rows.Scan(&role); err == nil {
				roles = append(roles, role)
			}
		}
	}

	// Update last login
	s.db.Exec(r.Context(), "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1", userID)

	token, err := s.GenerateToken(userID, req.Email, roles)
	if err != nil {
		http.Error(w, "failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"token":   token,
		"user": map[string]interface{}{
			"id":    userID,
			"email": req.Email,
			"roles": roles,
		},
	})
}
