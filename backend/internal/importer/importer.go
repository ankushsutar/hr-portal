package importer

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ImportBatch struct {
	ID         string `json:"id"`
	ImportType string `json:"import_type"`
	TotalRows  int    `json:"total_rows"`
	ValidRows  int    `json:"valid_rows"`
	ErrorRows  int    `json:"error_rows"`
	Status     string `json:"status"` // UPLOADING, VALIDATING, READY, IMPORTING, COMPLETED, FAILED
	CreatedAt  string `json:"created_at"`
}

type ImportRow struct {
	ID           string                 `json:"id"`
	RowNumber    int                    `json:"row_number"`
	RawData      map[string]interface{} `json:"raw_data"`
	Status       string                 `json:"status"`
	ErrorMessage string                 `json:"error_message,omitempty"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Post("/upload", s.HandleUpload)
	r.Get("/batches", s.HandleGetBatches)
	r.Get("/batches/{id}", s.HandleGetBatchDetail)
	r.Post("/batches/{id}/process", s.HandleProcessBatch)
}

func (s *Service) HandleUpload(w http.ResponseWriter, r *http.Request) {
	// --- DEMO BYPASS ---
	jsonOK(w, map[string]interface{}{
		"success": true, 
		"id": "batch-1", 
		"status": "VALIDATING",
		"demo": true,
	})
	// --- END DEMO BYPASS ---
}

func (s *Service) HandleGetBatches(w http.ResponseWriter, r *http.Request) {
	// --- DEMO BYPASS ---
	batches := []ImportBatch{
		{ID: "batch-1", ImportType: "EMPLOYEES", TotalRows: 500, ValidRows: 480, ErrorRows: 20, Status: "COMPLETED", CreatedAt: "2026-08-27T10:00:00Z"},
		{ID: "batch-2", ImportType: "EMPLOYEES", TotalRows: 50, ValidRows: 50, ErrorRows: 0, Status: "COMPLETED", CreatedAt: "2026-08-20T10:00:00Z"},
	}
	jsonOK(w, map[string]interface{}{"success": true, "data": batches, "demo": true})
	// --- END DEMO BYPASS ---
}

func (s *Service) HandleGetBatchDetail(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	// --- DEMO BYPASS ---
	batch := ImportBatch{
		ID: id, ImportType: "EMPLOYEES", TotalRows: 2, ValidRows: 1, ErrorRows: 1, Status: "READY", CreatedAt: "2026-08-28T10:00:00Z",
	}
	rows := []ImportRow{
		{ID: "row-1", RowNumber: 1, RawData: map[string]interface{}{"email": "jane@company.com", "name": "Jane Doe"}, Status: "VALID"},
		{ID: "row-2", RowNumber: 2, RawData: map[string]interface{}{"email": "john.com", "name": "John"}, Status: "ERROR", ErrorMessage: "Invalid email format"},
	}
	jsonOK(w, map[string]interface{}{"success": true, "data": batch, "rows": rows, "demo": true})
	// --- END DEMO BYPASS ---
}

func (s *Service) HandleProcessBatch(w http.ResponseWriter, r *http.Request) {
	// --- DEMO BYPASS ---
	jsonOK(w, map[string]interface{}{"success": true, "status": "COMPLETED", "demo": true})
	// --- END DEMO BYPASS ---
}

func jsonOK(w http.ResponseWriter, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}
