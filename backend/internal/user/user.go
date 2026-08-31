package user

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/company/hrms-backend/internal/common"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID          string   `json:"id"`
	Email       string   `json:"email"`
	IsActive    bool     `json:"is_active"`
	LastLogin   *string  `json:"last_login"`
	InvitedAt   *string  `json:"invited_at,omitempty"`
	Roles       []string `json:"roles"`
	EmployeeID  *string  `json:"employee_id,omitempty"`
}

type CreateUserRequest struct {
	Email      string  `json:"email"`
	Password   string  `json:"password"`
	Role       string  `json:"role"`
	EmployeeID *string `json:"employee_id,omitempty"`
}

type InviteUserRequest struct {
	Email      string  `json:"email"`
	Role       string  `json:"role"`
	EmployeeID *string `json:"employee_id,omitempty"`
}

type UpdateRoleRequest struct {
	Role string `json:"role"`
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
	r.Post("/invite", s.HandleInviteUser)
	r.Get("/roles", s.HandleListRoles)
	r.Post("/{id}/suspend", s.HandleSuspendUser)
	r.Post("/{id}/activate", s.HandleActivateUser)
	r.Patch("/{id}/role", s.HandleUpdateRole)
	r.Delete("/{id}", s.HandleDeleteUser)
}

func (s *Service) HandleListUsers(w http.ResponseWriter, r *http.Request) {
	pg := common.ParsePaginationParams(r)
	role := r.URL.Query().Get("role")

	conditions := []string{"1=1"}
	args := []interface{}{}
	i := 1

	if pg.Search != "" {
		conditions = append(conditions, fmt.Sprintf("(u.email ILIKE $%d)", i))
		args = append(args, "%"+pg.Search+"%")
		i++
	}
	if role != "" {
		conditions = append(conditions, fmt.Sprintf("ro.name = $%d", i))
		args = append(args, role)
		i++
	}

	where := "WHERE " + strings.Join(conditions, " AND ")

	countQuery := fmt.Sprintf(`
		SELECT COUNT(DISTINCT u.id)
		FROM users u
		LEFT JOIN user_roles ur ON u.id = ur.user_id
		LEFT JOIN roles ro ON ur.role_id = ro.id
		%s
	`, where)

	var total int
	_ = s.db.QueryRow(r.Context(), countQuery, args...).Scan(&total)

	dataArgs := append(args, pg.Limit, pg.Offset)
	query := fmt.Sprintf(`
		SELECT 
			u.id, u.email, u.is_active, 
			to_char(u.last_login, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as last_login,
			to_char(u.invited_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as invited_at,
			COALESCE(array_agg(ro.name) FILTER (WHERE ro.name IS NOT NULL), '{}') as roles,
			e.id as employee_id
		FROM users u
		LEFT JOIN user_roles ur ON u.id = ur.user_id
		LEFT JOIN roles ro ON ur.role_id = ro.id
		LEFT JOIN employees e ON e.user_id = u.id
		%s
		GROUP BY u.id, e.id
		ORDER BY u.created_at DESC
		LIMIT $%d OFFSET $%d
	`, where, i, i+1)

	rows, err := s.db.Query(r.Context(), query, dataArgs...)
	if err != nil {
		jsonError(w, "failed to query users: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Email, &u.IsActive, &u.LastLogin, &u.InvitedAt, &u.Roles, &u.EmployeeID); err != nil {
			jsonError(w, "failed to scan user: "+err.Error(), http.StatusInternalServerError)
			return
		}
		users = append(users, u)
	}
	if users == nil {
		users = []User{}
	}

	meta := common.BuildPaginationMeta(total, pg.Page, pg.Limit)
	jsonOK(w, map[string]interface{}{"success": true, "data": users, "total": total, "pagination": meta})
}

func (s *Service) HandleCreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}
	if req.Email == "" || req.Role == "" || req.Password == "" {
		jsonError(w, "email, role, and password are required", http.StatusBadRequest)
		return
	}

	userID, err := s.createUserTx(r.Context(), req.Email, req.Password, req.Role, req.EmployeeID, false)
	if err != nil {
		jsonError(w, err.Error(), http.StatusConflict)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "user_id": userID, "message": "User created successfully."})
}

func (s *Service) HandleInviteUser(w http.ResponseWriter, r *http.Request) {
	var req InviteUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}
	if req.Email == "" || req.Role == "" {
		jsonError(w, "email and role are required", http.StatusBadRequest)
		return
	}

	// Generate secure invitation token
	rawToken, _ := generateSecureToken()
	tokenHash := hashToken(rawToken)
	tempPassword, _ := generateSecureToken()
	expires := time.Now().Add(48 * time.Hour)

	tx, err := s.db.Begin(r.Context())
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(context.Background())

	var roleID string
	if err := tx.QueryRow(r.Context(), "SELECT id FROM roles WHERE name = $1", req.Role).Scan(&roleID); err != nil {
		jsonError(w, "invalid role", http.StatusBadRequest)
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(tempPassword), bcrypt.DefaultCost)
	var userID string
	err = tx.QueryRow(r.Context(), `
		INSERT INTO users (email, password_hash, is_active, invitation_token, invitation_expires_at, invited_at)
		VALUES ($1, $2, false, $3, $4, NOW())
		RETURNING id
	`, req.Email, string(hash), tokenHash, expires).Scan(&userID)
	if err != nil {
		jsonError(w, "email already exists", http.StatusConflict)
		return
	}

	tx.Exec(r.Context(), "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)", userID, roleID)

	if req.EmployeeID != nil && *req.EmployeeID != "" {
		res, err := tx.Exec(r.Context(),
			"UPDATE employees SET user_id = $1 WHERE id = $2 AND user_id IS NULL", userID, *req.EmployeeID)
		if err != nil || res.RowsAffected() == 0 {
			jsonError(w, "employee not found or already linked", http.StatusBadRequest)
			return
		}
	}

	if err := tx.Commit(context.Background()); err != nil {
		jsonError(w, "failed to commit", http.StatusInternalServerError)
		return
	}

	// In production: send email with invitation link containing rawToken
	// For demo: return token so UI can display it
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":          true,
		"user_id":          userID,
		"message":          "Invitation sent. User must set their password before first login.",
		"invitation_token": rawToken, // Remove in production; send via email only
		"expires_at":       expires,
	})
}

func (s *Service) HandleListRoles(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(r.Context(), "SELECT id, name, description FROM roles ORDER BY name")
	if err != nil {
		jsonError(w, "failed to query roles", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type Role struct {
		ID          string  `json:"id"`
		Name        string  `json:"name"`
		Description *string `json:"description"`
	}
	var roles []Role
	for rows.Next() {
		var ro Role
		if err := rows.Scan(&ro.ID, &ro.Name, &ro.Description); err == nil {
			roles = append(roles, ro)
		}
	}
	if roles == nil {
		roles = []Role{}
	}
	jsonOK(w, map[string]interface{}{"success": true, "data": roles})
}

func (s *Service) HandleUpdateRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	var roleID string
	if err := s.db.QueryRow(r.Context(), "SELECT id FROM roles WHERE name = $1", req.Role).Scan(&roleID); err != nil {
		jsonError(w, "invalid role", http.StatusBadRequest)
		return
	}

	tx, _ := s.db.Begin(r.Context())
	defer tx.Rollback(context.Background())
	tx.Exec(r.Context(), "DELETE FROM user_roles WHERE user_id = $1", id)
	tx.Exec(r.Context(), "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)", id, roleID)
	tx.Commit(context.Background())

	jsonOK(w, map[string]interface{}{"success": true, "message": "Role updated"})
}

func (s *Service) HandleSuspendUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	s.db.Exec(r.Context(), "UPDATE users SET is_active = false WHERE id = $1", id)
	jsonOK(w, map[string]interface{}{"success": true, "message": "User suspended"})
}

func (s *Service) HandleActivateUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	s.db.Exec(r.Context(), "UPDATE users SET is_active = true WHERE id = $1", id)
	jsonOK(w, map[string]interface{}{"success": true, "message": "User activated"})
}

func (s *Service) HandleDeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	s.db.Exec(r.Context(), "UPDATE employees SET user_id = NULL WHERE user_id = $1", id)
	s.db.Exec(r.Context(), "DELETE FROM users WHERE id = $1", id)
	jsonOK(w, map[string]interface{}{"success": true, "message": "User deleted"})
}

// createUserTx is a reusable transactional user creation helper
func (s *Service) createUserTx(ctx context.Context, email, password, role string, employeeID *string, isInvitation bool) (string, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(context.Background())

	var roleID string
	if err := tx.QueryRow(ctx, "SELECT id FROM roles WHERE name = $1", role).Scan(&roleID); err != nil {
		return "", errors.New("invalid role: " + role)
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	var userID string
	err = tx.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, is_active)
		VALUES ($1, $2, $3)
		RETURNING id
	`, email, string(hash), !isInvitation).Scan(&userID)
	if err != nil {
		return "", errors.New("email already exists or creation failed")
	}

	tx.Exec(ctx, "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)", userID, roleID)

	if employeeID != nil && *employeeID != "" {
		res, err := tx.Exec(ctx,
			"UPDATE employees SET user_id = $1 WHERE id = $2 AND user_id IS NULL", userID, *employeeID)
		if err != nil || res.RowsAffected() == 0 {
			return "", errors.New("employee not found or already linked to a user")
		}
	}

	return userID, tx.Commit(context.Background())
}

func jsonError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func jsonOK(w http.ResponseWriter, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
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
