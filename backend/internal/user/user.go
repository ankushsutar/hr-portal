package user

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID        string   `json:"id"`
	Email     string   `json:"email"`
	IsActive  bool     `json:"is_active"`
	LastLogin *string  `json:"last_login"`
	Roles     []string `json:"roles"`
}

type CreateUserRequest struct {
	Email      string   `json:"email"`
	Password   string   `json:"password"` // If empty, we send an invite
	Role       string   `json:"role"`
	EmployeeID *string  `json:"employee_id,omitempty"` // Link to an employee if provided
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/", s.HandleListUsers)
	r.Post("/", s.HandleCreateUser)
	r.Post("/{id}/suspend", s.HandleSuspendUser)
	r.Post("/{id}/activate", s.HandleActivateUser)
}

func (s *Service) HandleListUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(r.Context(), `
		SELECT u.id, u.email, u.is_active, u.last_login, 
		       COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') as roles
		FROM users u
		LEFT JOIN user_roles ur ON u.id = ur.user_id
		LEFT JOIN roles r ON ur.role_id = r.id
		GROUP BY u.id
	`)
	
	if err != nil {
		http.Error(w, "failed to query users", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Email, &u.IsActive, &u.LastLogin, &u.Roles); err != nil {
			http.Error(w, "failed to scan user", http.StatusInternalServerError)
			return
		}
		users = append(users, u)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    users,
	})
}

func (s *Service) HandleCreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Role == "" {
		http.Error(w, "email and role are required", http.StatusBadRequest)
		return
	}

	// Begin Transaction
	tx, err := s.db.Begin(r.Context())
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(context.Background())

	// 1. Resolve role ID
	var roleID string
	err = tx.QueryRow(r.Context(), "SELECT id FROM roles WHERE name = $1", req.Role).Scan(&roleID)
	if err != nil {
		http.Error(w, "invalid role", http.StatusBadRequest)
		return
	}

	// 2. Generate initial password if empty (invitation flow)
	var passwordHash string
	isInvitation := false
	if req.Password == "" {
		isInvitation = true
		b := make([]byte, 16)
		rand.Read(b)
		req.Password = hex.EncodeToString(b) // Temporary password
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "failed to hash password", http.StatusInternalServerError)
		return
	}
	passwordHash = string(hash)

	// 3. Create user
	var userID string
	err = tx.QueryRow(r.Context(), `
		INSERT INTO users (email, password_hash, is_active)
		VALUES ($1, $2, $3)
		RETURNING id
	`, req.Email, passwordHash, !isInvitation).Scan(&userID)
	
	if err != nil {
		http.Error(w, "email already exists or creation failed", http.StatusConflict)
		return
	}

	// 4. Assign role
	_, err = tx.Exec(r.Context(), "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)", userID, roleID)
	if err != nil {
		http.Error(w, "failed to assign role", http.StatusInternalServerError)
		return
	}

	// 5. Link to employee if provided
	if req.EmployeeID != nil && *req.EmployeeID != "" {
		// Strict 1:1 check - ensure employee exists and doesn't already have a user
		res, err := tx.Exec(r.Context(), "UPDATE employees SET user_id = $1 WHERE id = $2 AND user_id IS NULL", userID, *req.EmployeeID)
		if err != nil || res.RowsAffected() == 0 {
			http.Error(w, "employee not found or already linked to a user", http.StatusBadRequest)
			return
		}
	}

	if err := tx.Commit(context.Background()); err != nil {
		http.Error(w, "failed to commit transaction", http.StatusInternalServerError)
		return
	}

	// Return appropriate response
	resp := map[string]interface{}{
		"success": true,
		"user_id": userID,
	}

	if isInvitation {
		// In a real system, send email here. For now, return the token/password.
		resp["message"] = "User created. Invitation sent."
		resp["temporary_password"] = req.Password
	} else {
		resp["message"] = "User created successfully."
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

func (s *Service) HandleSuspendUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := s.db.Exec(r.Context(), "UPDATE users SET is_active = false WHERE id = $1", id)
	if err != nil {
		http.Error(w, "failed to suspend user", http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "User suspended"})
}

func (s *Service) HandleActivateUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := s.db.Exec(r.Context(), "UPDATE users SET is_active = true WHERE id = $1", id)
	if err != nil {
		http.Error(w, "failed to activate user", http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "User activated"})
}
