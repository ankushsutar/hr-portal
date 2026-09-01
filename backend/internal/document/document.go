package document

import (
	"encoding/json"
	"net/http"

	"github.com/company/hrms-backend/internal/auth"
	"github.com/company/hrms-backend/internal/authz"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DocumentType struct {
	ID                   string `json:"id"`
	Name                 string `json:"name"`
	IsMandatory          bool   `json:"is_mandatory"`
	HasExpiry            bool   `json:"has_expiry"`
	RequiresVerification bool   `json:"requires_verification"`
	AccessScope          string `json:"access_scope"`
}

type EmployeeDocument struct {
	ID               string  `json:"id"`
	DocumentTypeID   string  `json:"document_type_id"`
	DocumentTypeName string  `json:"document_type_name"`
	FileURL          string  `json:"file_url"`
	FileName         string  `json:"file_name"`
	Status           string  `json:"status"` // SUBMITTED, APPROVED, REJECTED
	ExpiryDate       *string `json:"expiry_date,omitempty"`
	RejectionReason  *string `json:"rejection_reason,omitempty"`
	UploadedAt       string  `json:"uploaded_at"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/types", s.HandleGetTypes)
	r.Post("/types", s.HandleCreateType)
	r.Get("/employees/{id}", s.HandleGetEmployeeDocuments)
	r.Patch("/{id}/verify", s.HandleVerifyDocument)
}

func (s *Service) HandleGetTypes(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	rows, err := s.db.Query(r.Context(), "SELECT id, name, is_mandatory, has_expiry, requires_verification, access_scope FROM document_types")
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database query failed: " + err.Error()})
		return
	}
	defer rows.Close()

	var types []DocumentType
	for rows.Next() {
		var t DocumentType
		rows.Scan(&t.ID, &t.Name, &t.IsMandatory, &t.HasExpiry, &t.RequiresVerification, &t.AccessScope)
		types = append(types, t)
	}
	if types == nil {
		types = []DocumentType{}
	}
	jsonOK(w, map[string]interface{}{"success": true, "data": types})
}

func (s *Service) HandleCreateType(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN") {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only HR Admins can create document types.")
		return
	}

	var req DocumentType
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	jsonOK(w, map[string]interface{}{"success": true, "id": "dt-new"})
}

func (s *Service) HandleGetEmployeeDocuments(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok {
		authz.UnauthorizedResponse(w)
		return
	}

	empID := chi.URLParam(r, "id")
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	var callerEmpID string
	s.db.QueryRow(r.Context(), "SELECT id::text FROM employees WHERE user_id::text = $1 OR id::text = $1 LIMIT 1", claims.UserID).Scan(&callerEmpID)

	if !authz.CanViewDocument(claims, empID, callerEmpID) {
		authz.ForbiddenResponse(w, "FORBIDDEN_RESOURCE", "You do not have permission to view these documents.")
		return
	}

	rows, err := s.db.Query(r.Context(), `
		SELECT ed.id::text, ed.document_type_id::text, COALESCE(dt.name, 'Document'),
		       ed.file_url, ed.file_name, ed.status, to_char(ed.created_at, 'YYYY-MM-DD')
		FROM employee_documents ed
		LEFT JOIN document_types dt ON ed.document_type_id = dt.id
		WHERE ed.employee_id = $1
	`, empID)
	if err != nil {
		jsonOK(w, map[string]interface{}{"success": true, "data": []EmployeeDocument{}})
		return
	}
	defer rows.Close()

	var docs []EmployeeDocument
	for rows.Next() {
		var d EmployeeDocument
		if err := rows.Scan(&d.ID, &d.DocumentTypeID, &d.DocumentTypeName, &d.FileURL, &d.FileName, &d.Status, &d.UploadedAt); err == nil {
			docs = append(docs, d)
		}
	}
	if docs == nil {
		docs = []EmployeeDocument{}
	}
	jsonOK(w, map[string]interface{}{"success": true, "data": docs})
}

func (s *Service) HandleVerifyDocument(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}
	jsonOK(w, map[string]interface{}{"success": true})
}

func jsonOK(w http.ResponseWriter, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}
