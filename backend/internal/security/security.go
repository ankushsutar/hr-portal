package security

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/company/hrms-backend/internal/auth"
	"github.com/company/hrms-backend/internal/authz"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DataAccessLog struct {
	ID         string `json:"id"`
	UserID     string `json:"user_id"`
	UserEmail  string `json:"user_email,omitempty"`
	UserRole   string `json:"user_role,omitempty"`
	Module     string `json:"module"`
	Action     string `json:"action"`
	ResourceID string `json:"resource_id,omitempty"`
	IPAddress  string `json:"ip_address,omitempty"`
	UserAgent  string `json:"user_agent,omitempty"`
	AccessedAt string `json:"accessed_at"`
}

type RbacScopePolicy struct {
	Role             string   `json:"role"`
	Module           string   `json:"module"`
	Scope            string   `json:"scope"` // ALL, DEPARTMENT, DIRECT_REPORTS, SELF
	CanReadSensitive bool     `json:"can_read_sensitive"`
	CanExport        bool     `json:"can_export"`
	AllowedActions   []string `json:"allowed_actions"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

// EvaluateDataScope calculates permission boundary for a role
func EvaluateDataScope(role string) string {
	upper := strings.ToUpper(strings.TrimSpace(role))
	switch upper {
	case "SUPER_ADMIN", "HR_ADMIN", "ADMIN":
		return "ALL"
	case "MANAGER", "LEAD":
		return "DEPARTMENT"
	case "EMPLOYEE", "USER":
		return "SELF"
	default:
		return "SELF"
	}
}

// MaskSensitiveField masks PII or confidential values according to field type
func MaskSensitiveField(value string, fieldType string) string {
	val := strings.TrimSpace(value)
	if val == "" {
		return ""
	}

	switch strings.ToUpper(fieldType) {
	case "BANK_ACCOUNT":
		if len(val) <= 4 {
			return "****"
		}
		return strings.Repeat("*", len(val)-4) + val[len(val)-4:]

	case "TAX_ID", "SSN", "PAN":
		if len(val) <= 4 {
			return "****"
		}
		return val[:2] + strings.Repeat("*", len(val)-4) + val[len(val)-2:]

	case "SALARY":
		return "[RESTRICTED - ADMIN ONLY]"

	case "EMAIL":
		parts := strings.Split(val, "@")
		if len(parts) != 2 || len(parts[0]) <= 2 {
			return "***@***.com"
		}
		return parts[0][:2] + "***@" + parts[1]

	default:
		return val
	}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/access-logs", s.HandleGetAccessLogs)
	r.Post("/log-access", s.HandleLogAccess)
	r.Get("/rbac-matrix", s.HandleGetRbacMatrix)
}

func (s *Service) HandleGetAccessLogs(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN") {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only Security Admins can view access audit logs.")
		return
	}

	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	query := `
		SELECT l.id::text, l.user_id::text, u.email as user_email, 'ADMIN' as user_role,
		       l.module, l.action, COALESCE(l.resource_id, ''), COALESCE(l.ip_address, ''), COALESCE(l.user_agent, ''),
		       to_char(l.accessed_at, 'YYYY-MM-DD HH24:MI:SS') as accessed_at
		FROM data_access_logs l
		JOIN users u ON l.user_id = u.id
		ORDER BY l.accessed_at DESC
		LIMIT 100
	`

	rows, err := s.db.Query(r.Context(), query)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	var logs []DataAccessLog
	for rows.Next() {
		var l DataAccessLog
		if err := rows.Scan(&l.ID, &l.UserID, &l.UserEmail, &l.UserRole, &l.Module, &l.Action, &l.ResourceID, &l.IPAddress, &l.UserAgent, &l.AccessedAt); err == nil {
			logs = append(logs, l)
		}
	}
	if logs == nil {
		logs = []DataAccessLog{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": logs})
}

func (s *Service) HandleLogAccess(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Module     string `json:"module"`
		Action     string `json:"action"`
		ResourceID string `json:"resource_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Module == "" || req.Action == "" {
		http.Error(w, "invalid log payload", http.StatusBadRequest)
		return
	}

	ip := r.RemoteAddr
	ua := r.UserAgent()

	if s.db != nil {
		_, _ = s.db.Exec(r.Context(), `
			INSERT INTO data_access_logs (user_id, module, action, resource_id, ip_address, user_agent)
			VALUES ($1::uuid, $2, $3, $4, $5, $6)
		`, claims.UserID, req.Module, req.Action, req.ResourceID, ip, ua)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Data access logged.",
	})
}

func (s *Service) HandleGetRbacMatrix(w http.ResponseWriter, r *http.Request) {
	matrix := []RbacScopePolicy{
		{
			Role:             "SUPER_ADMIN",
			Module:           "ALL_MODULES",
			Scope:            "ALL",
			CanReadSensitive: true,
			CanExport:        true,
			AllowedActions:   []string{"CREATE", "READ", "UPDATE", "DELETE", "EXPORT", "AUDIT"},
		},
		{
			Role:             "HR_ADMIN",
			Module:           "EMPLOYEES_AND_PAYROLL",
			Scope:            "ALL",
			CanReadSensitive: true,
			CanExport:        true,
			AllowedActions:   []string{"CREATE", "READ", "UPDATE", "EXPORT"},
		},
		{
			Role:             "MANAGER",
			Module:           "ATTENDANCE_LEAVE_PERFORMANCE",
			Scope:            "DEPARTMENT",
			CanReadSensitive: false,
			CanExport:        false,
			AllowedActions:   []string{"READ", "APPROVE", "REJECT"},
		},
		{
			Role:             "EMPLOYEE",
			Module:           "ESS_AND_MY_PROFILE",
			Scope:            "SELF",
			CanReadSensitive: false,
			CanExport:        false,
			AllowedActions:   []string{"READ_SELF", "SUBMIT_REQUEST"},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    matrix,
	})
}
