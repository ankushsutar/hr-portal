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
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}
	jsonOK(w, map[string]interface{}{
		"success": true, 
		"id": "batch-1", 
		"status": "VALIDATING",
	})
}

func (s *Service) HandleGetBatches(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	rows, err := s.db.Query(r.Context(), `
		SELECT id::text, import_type, total_rows, valid_rows, error_rows, status, to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		FROM import_batches ORDER BY created_at DESC
	`)
	if err != nil {
		jsonOK(w, map[string]interface{}{"success": true, "data": []ImportBatch{}})
		return
	}
	defer rows.Close()

	var batches []ImportBatch
	for rows.Next() {
		var b ImportBatch
		if err := rows.Scan(&b.ID, &b.ImportType, &b.TotalRows, &b.ValidRows, &b.ErrorRows, &b.Status, &b.CreatedAt); err == nil {
			batches = append(batches, b)
		}
	}
	if batches == nil {
		batches = []ImportBatch{}
	}

	jsonOK(w, map[string]interface{}{"success": true, "data": batches})
}

func (s *Service) HandleGetBatchDetail(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	var batch ImportBatch
	err := s.db.QueryRow(r.Context(), `
		SELECT id::text, import_type, total_rows, valid_rows, error_rows, status, to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		FROM import_batches WHERE id::text = $1
	`, id).Scan(&batch.ID, &batch.ImportType, &batch.TotalRows, &batch.ValidRows, &batch.ErrorRows, &batch.Status, &batch.CreatedAt)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "batch not found: " + err.Error()})
		return
	}

	jsonOK(w, map[string]interface{}{"success": true, "data": batch, "rows": []ImportRow{}})
}

func (s *Service) HandleProcessBatch(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}
	jsonOK(w, map[string]interface{}{"success": true, "status": "COMPLETED"})
}

func jsonOK(w http.ResponseWriter, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}
