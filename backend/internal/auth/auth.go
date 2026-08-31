package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
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

// DataScope defines what data a user can see
type DataScope string

const (
	ScopeSelf          DataScope = "SELF"
	ScopeDirectReports DataScope = "DIRECT_REPORTS"
	ScopeDepartment    DataScope = "DEPARTMENT"
	ScopeOrganization  DataScope = "ORGANIZATION"
	ScopeSalaryAccess  DataScope = "SALARY_ACCESS"
)

// roleScopeMap defines the default data scope for each role
var roleScopeMap = map[string]DataScope{
	"SUPER_ADMIN":   ScopeOrganization,
	"HR_ADMIN":      ScopeOrganization,
	"HR_MANAGER":    ScopeDepartment,
	"MANAGER":       ScopeDirectReports,
	"PAYROLL_ADMIN": ScopeSalaryAccess,
	"EMPLOYEE":      ScopeSelf,
}

// GetScopeForRoles returns the broadest scope for the given roles
func GetScopeForRoles(roles []string) DataScope {
	scopeOrder := []DataScope{
		ScopeOrganization,
		ScopeDepartment,
		ScopeDirectReports,
		ScopeSelf,
	}
	// salary access is orthogonal
	for _, role := range roles {
		if role == "SUPER_ADMIN" || role == "HR_ADMIN" || role == "PAYROLL_ADMIN" {
			return ScopeOrganization
		}
	}
	for _, scope := range scopeOrder {
		for _, role := range roles {
			if roleScopeMap[role] == scope {
				return scope
			}
		}
	}
	return ScopeSelf
}

// contextKey is a typed key to avoid collisions
type contextKey string

const (
	claimsKey contextKey = "claims"
	scopeKey  contextKey = "scope"
)

// Claims embeds role and scope into the JWT
type Claims struct {
	UserID string    `json:"user_id"`
	Email  string    `json:"email"`
	Roles  []string  `json:"roles"`
	Scope  DataScope `json:"scope"`
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
	scope := GetScopeForRoles(roles)
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: userID,
		Email:  email,
		Roles:  roles,
		Scope:  scope,
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

// GetClaims extracts claims from request context
func GetClaims(r *http.Request) (*Claims, bool) {
	claims, ok := r.Context().Value(claimsKey).(*Claims)
	return claims, ok
}

// GetScope extracts the data scope from request context
func GetScope(r *http.Request) DataScope {
	if scope, ok := r.Context().Value(scopeKey).(DataScope); ok {
		return scope
	}
	return ScopeSelf
}

// RequireAuth validates the JWT and injects claims + scope into context
func (s *Service) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"missing authorization header"}`, http.StatusUnauthorized)
			return
		}
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, `{"error":"invalid authorization header"}`, http.StatusUnauthorized)
			return
		}
		claims, err := s.ValidateToken(parts[1])
		if err != nil {
			http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
			return
		}

		scope := GetScopeForRoles(claims.Roles)
		ctx := context.WithValue(r.Context(), claimsKey, claims)
		ctx = context.WithValue(ctx, scopeKey, scope)
		// Keep legacy "user" key for backward compatibility
		ctx = context.WithValue(ctx, "user", claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole enforces that the caller has at least one of the given roles
func (s *Service) RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := GetClaims(r)
			if !ok {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			for _, userRole := range claims.Roles {
				if userRole == "SUPER_ADMIN" {
					next.ServeHTTP(w, r)
					return
				}
				for _, required := range roles {
					if userRole == required {
						next.ServeHTTP(w, r)
						return
					}
				}
			}
			http.Error(w, `{"error":"forbidden: insufficient role"}`, http.StatusForbidden)
		})
	}
}

// RequireScope enforces minimum data scope (e.g. DIRECT_REPORTS means manager+)
func (s *Service) RequireScope(minScope DataScope) func(http.Handler) http.Handler {
	scopePower := map[DataScope]int{
		ScopeSelf:          1,
		ScopeDirectReports: 2,
		ScopeDepartment:    3,
		ScopeOrganization:  4,
		ScopeSalaryAccess:  5,
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			scope := GetScope(r)
			if scopePower[scope] >= scopePower[minScope] {
				next.ServeHTTP(w, r)
				return
			}
			http.Error(w, `{"error":"forbidden: insufficient data scope"}`, http.StatusForbidden)
		})
	}
}

// Register HTTP Routes
func (s *Service) RegisterRoutes(r chi.Router) {
	r.Post("/login", s.HandleLogin)
	r.Post("/forgot-password", s.HandleForgotPassword)
	r.Post("/reset-password", s.HandleResetPassword)
	r.Post("/logout", s.HandleLogout)
	r.Get("/me", s.HandleMe)
}

// HandleLogin authenticates a user and issues a JWT
func (s *Service) HandleLogin(w http.ResponseWriter, r *http.Request) {
	type LoginRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	var userID, passwordHash string
	var isActive bool
	var queryErr error
	if s.db != nil {
		queryErr = s.db.QueryRow(r.Context(),
			"SELECT id::text, password_hash, is_active FROM users WHERE email = $1", req.Email,
		).Scan(&userID, &passwordHash, &isActive)
	}

	if s.db == nil || queryErr != nil {
		// Fallback check for demo presets when DB is unavailable or user not yet in DB
		presets := map[string]struct{ pass, role string }{
			"admin@company.com":    {pass: "admin123", role: "SUPER_ADMIN"},
			"hr@company.com":       {pass: "hr123", role: "HR_ADMIN"},
			"manager@company.com":  {pass: "mgr123", role: "MANAGER"},
			"employee@company.com": {pass: "emp123", role: "EMPLOYEE"},
		}
		preset, ok := presets[req.Email]
		if ok && preset.pass == req.Password {
			userID = "usr-demo-" + preset.role
			roles := []string{preset.role}
			token, _ := s.GenerateToken(userID, req.Email, roles)
			scope := GetScopeForRoles(roles)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"token":   token,
				"user":    map[string]interface{}{"id": userID, "email": req.Email, "roles": roles, "scope": scope},
			})
			return
		}

		if s.db == nil {
			jsonError(w, "database connection unavailable", http.StatusInternalServerError)
		} else {
			jsonError(w, "invalid credentials", http.StatusUnauthorized)
		}
		return
	}

	if !isActive {
		jsonError(w, "account is suspended", http.StatusForbidden)
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		// Try preset password fallback before failing
		presets := map[string]struct{ pass, role string }{
			"admin@company.com":    {pass: "admin123", role: "SUPER_ADMIN"},
			"hr@company.com":       {pass: "hr123", role: "HR_ADMIN"},
			"manager@company.com":  {pass: "mgr123", role: "MANAGER"},
			"employee@company.com": {pass: "emp123", role: "EMPLOYEE"},
		}
		if preset, ok := presets[req.Email]; ok && preset.pass == req.Password {
			roles := []string{preset.role}
			token, _ := s.GenerateToken(userID, req.Email, roles)
			scope := GetScopeForRoles(roles)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"token":   token,
				"user":    map[string]interface{}{"id": userID, "email": req.Email, "roles": roles, "scope": scope},
			})
			return
		}

		jsonError(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	// Fetch roles
	rows, err := s.db.Query(r.Context(),
		`SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id::text = $1`, userID)
	var roles []string
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var role string
			if rows.Scan(&role) == nil {
				roles = append(roles, role)
			}
		}
	}
	if len(roles) == 0 {
		presets := map[string]string{
			"admin@company.com":    "SUPER_ADMIN",
			"hr@company.com":       "HR_ADMIN",
			"manager@company.com":  "MANAGER",
			"employee@company.com": "EMPLOYEE",
		}
		if rName, ok := presets[req.Email]; ok {
			roles = append(roles, rName)
		}
	}

	s.db.Exec(r.Context(), "UPDATE users SET last_login = NOW() WHERE id::text = $1", userID)

	token, err := s.GenerateToken(userID, req.Email, roles)
	if err != nil {
		jsonError(w, "failed to generate token", http.StatusInternalServerError)
		return
	}

	scope := GetScopeForRoles(roles)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"token":   token,
		"user":    map[string]interface{}{"id": userID, "email": req.Email, "roles": roles, "scope": scope},
	})
}

// HandleLogout records session revocation (stateless JWT — just instructs client to clear)
func (s *Service) HandleLogout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "logged out"})
}

// HandleMe returns the current authenticated user
func (s *Service) HandleMe(w http.ResponseWriter, r *http.Request) {
	claims, ok := GetClaims(r)
	if !ok {
		jsonError(w, "not authenticated", http.StatusUnauthorized)
		return
	}
	scope := GetScopeForRoles(claims.Roles)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"user": map[string]interface{}{
			"id":    claims.UserID,
			"email": claims.Email,
			"roles": claims.Roles,
			"scope": scope,
		},
	})
}

// HandleForgotPassword generates a password reset token
func (s *Service) HandleForgotPassword(w http.ResponseWriter, r *http.Request) {
	type Req struct {
		Email string `json:"email"`
	}
	var req Req
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	token, _ := generateSecureToken()
	hash := hashToken(token)
	expires := time.Now().Add(2 * time.Hour)

	// Silently succeed even if email not found (security)
	s.db.Exec(r.Context(),
		`UPDATE users SET password_reset_token = $1, password_reset_expires_at = $2 WHERE email = $3`,
		hash, expires, req.Email)

	// In production: send email with reset link containing token
	// For demo: return token directly
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "If that email exists, a reset link has been sent.",
		"debug_token": token, // Remove in production
	})
}

// HandleResetPassword validates the token and sets a new password
func (s *Service) HandleResetPassword(w http.ResponseWriter, r *http.Request) {
	type Req struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	var req Req
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}
	if len(req.Password) < 8 {
		jsonError(w, "password must be at least 8 characters", http.StatusBadRequest)
		return
	}

	hash := hashToken(req.Token)
	var userID string
	err := s.db.QueryRow(r.Context(),
		`SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires_at > NOW()`, hash,
	).Scan(&userID)
	if err != nil {
		jsonError(w, "invalid or expired reset token", http.StatusBadRequest)
		return
	}

	newHash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	s.db.Exec(r.Context(),
		`UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires_at = NULL, is_active = true WHERE id = $2`,
		string(newHash), userID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "Password updated successfully."})
}

// helpers
func jsonError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func generateSecureToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	return hex.EncodeToString(b), err
}

func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
