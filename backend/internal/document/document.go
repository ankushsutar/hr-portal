package document

import (
	"encoding/json"
	"net/http"

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
	rows, err := s.db.Query(r.Context(), "SELECT id, name, is_mandatory, has_expiry, requires_verification, access_scope FROM document_types")
	if err != nil {
		// --- DEMO BYPASS ---
		types := []DocumentType{
			{ID: "dt-1", Name: "Aadhaar Card", IsMandatory: true, HasExpiry: false, RequiresVerification: true, AccessScope: "HR"},
			{ID: "dt-2", Name: "PAN Card", IsMandatory: true, HasExpiry: false, RequiresVerification: true, AccessScope: "PAYROLL"},
			{ID: "dt-3", Name: "Offer Letter", IsMandatory: true, HasExpiry: false, RequiresVerification: false, AccessScope: "ALL"},
			{ID: "dt-4", Name: "Passport", IsMandatory: false, HasExpiry: true, RequiresVerification: true, AccessScope: "HR"},
		}
		jsonOK(w, map[string]interface{}{"success": true, "data": types, "demo": true})
		return
		// --- END DEMO BYPASS ---
	}
	defer rows.Close()

	var types []DocumentType
	for rows.Next() {
		var t DocumentType
		rows.Scan(&t.ID, &t.Name, &t.IsMandatory, &t.HasExpiry, &t.RequiresVerification, &t.AccessScope)
		types = append(types, t)
	}
	jsonOK(w, map[string]interface{}{"success": true, "data": types})
}

func (s *Service) HandleCreateType(w http.ResponseWriter, r *http.Request) {
	var req DocumentType
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	// --- DEMO BYPASS ---
	jsonOK(w, map[string]interface{}{"success": true, "id": "dt-new", "demo": true})
	// --- END DEMO BYPASS ---
}

func (s *Service) HandleGetEmployeeDocuments(w http.ResponseWriter, r *http.Request) {
	// --- DEMO BYPASS ---
	docs := []EmployeeDocument{
		{ID: "doc-1", DocumentTypeID: "dt-1", DocumentTypeName: "Aadhaar Card", FileURL: "#", FileName: "aadhaar_john.pdf", Status: "APPROVED", UploadedAt: "2026-08-20"},
		{ID: "doc-2", DocumentTypeID: "dt-2", DocumentTypeName: "PAN Card", FileURL: "#", FileName: "pan_card_v2.pdf", Status: "SUBMITTED", UploadedAt: "2026-08-25"},
		{ID: "doc-3", DocumentTypeID: "dt-4", DocumentTypeName: "Passport", FileURL: "#", FileName: "passport_scan.jpg", Status: "REJECTED", RejectionReason: func() *string { s := "Blurry image. Please re-upload."; return &s }(), UploadedAt: "2026-08-26"},
	}
	jsonOK(w, map[string]interface{}{"success": true, "data": docs, "demo": true})
	// --- END DEMO BYPASS ---
}

func (s *Service) HandleVerifyDocument(w http.ResponseWriter, r *http.Request) {
	// --- DEMO BYPASS ---
	jsonOK(w, map[string]interface{}{"success": true, "demo": true})
	// --- END DEMO BYPASS ---
}

func jsonOK(w http.ResponseWriter, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}
