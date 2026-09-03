package importer

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
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
		jsonError(w, http.StatusInternalServerError, "database connection unavailable")
		return
	}

	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		jsonError(w, http.StatusBadRequest, "file size too large or invalid")
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		jsonError(w, http.StatusBadRequest, "file missing")
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil || len(records) < 2 {
		jsonError(w, http.StatusBadRequest, "invalid csv format or empty file")
		return
	}

	headers := records[0]
	emailIdx, firstNameIdx, lastNameIdx := -1, -1, -1
	for i, h := range headers {
		switch strings.ToLower(h) {
		case "email":
			emailIdx = i
		case "first_name":
			firstNameIdx = i
		case "last_name":
			lastNameIdx = i
		}
	}

	tx, err := s.db.Begin(r.Context())
	if err != nil {
		jsonError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer tx.Rollback(r.Context())

	var batchID string
	err = tx.QueryRow(r.Context(), `
		INSERT INTO import_batches (organization_id, user_id, import_type, total_rows, valid_rows, error_rows, status)
		VALUES ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM users LIMIT 1), 'EMPLOYEE_MASTER', $1, 0, 0, 'VALIDATING')
		RETURNING id::text
	`, len(records)-1).Scan(&batchID)

	if err != nil {
		jsonError(w, http.StatusInternalServerError, err.Error())
		return
	}

	validRows := 0
	errorRows := 0

	for idx, row := range records[1:] {
		status := "VALID"
		errMsg := ""

		if emailIdx == -1 || row[emailIdx] == "" {
			status = "ERROR"
			errMsg = "email is required"
		} else if firstNameIdx == -1 || row[firstNameIdx] == "" {
			status = "ERROR"
			errMsg = "first_name is required"
		} else if lastNameIdx == -1 || row[lastNameIdx] == "" {
			status = "ERROR"
			errMsg = "last_name is required"
		} else if len(row) != len(headers) {
			status = "ERROR"
			errMsg = "column count mismatch"
		}

		if status == "VALID" {
			validRows++
		} else {
			errorRows++
		}

		rowMap := make(map[string]interface{})
		for i, h := range headers {
			if i < len(row) {
				rowMap[h] = row[i]
			}
		}

		rowJSON, _ := json.Marshal(rowMap)

		_, err = tx.Exec(r.Context(), `
			INSERT INTO import_rows (batch_id, row_number, raw_data, status, error_message)
			VALUES ($1, $2, $3, $4, $5)
		`, batchID, idx+1, rowJSON, status, errMsg)
		if err != nil {
			jsonError(w, http.StatusInternalServerError, err.Error())
			return
		}
	}

	_, err = tx.Exec(r.Context(), `
		UPDATE import_batches SET valid_rows = $1, error_rows = $2, status = 'READY'
		WHERE id::text = $3
	`, validRows, errorRows, batchID)
	if err != nil {
		jsonError(w, http.StatusInternalServerError, err.Error())
		return
	}

	err = tx.Commit(r.Context())
	if err != nil {
		jsonError(w, http.StatusInternalServerError, err.Error())
		return
	}

	jsonOK(w, map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"batch_id": batchID,
		},
	})
}

func (s *Service) HandleGetBatches(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		jsonError(w, http.StatusInternalServerError, "database connection unavailable")
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
		jsonError(w, http.StatusInternalServerError, "database connection unavailable")
		return
	}

	var batch ImportBatch
	err := s.db.QueryRow(r.Context(), `
		SELECT id::text, import_type, total_rows, valid_rows, error_rows, status, to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		FROM import_batches WHERE id::text = $1
	`, id).Scan(&batch.ID, &batch.ImportType, &batch.TotalRows, &batch.ValidRows, &batch.ErrorRows, &batch.Status, &batch.CreatedAt)

	if err != nil {
		jsonError(w, http.StatusNotFound, "batch not found: "+err.Error())
		return
	}

	errorRows := []ImportRow{}
	rows, err := s.db.Query(r.Context(), `
		SELECT id::text, row_number, raw_data, status, error_message
		FROM import_rows WHERE batch_id::text = $1 AND status = 'ERROR'
	`, id)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var ir ImportRow
			var rawDataStr []byte
			if err := rows.Scan(&ir.ID, &ir.RowNumber, &rawDataStr, &ir.Status, &ir.ErrorMessage); err == nil {
				json.Unmarshal(rawDataStr, &ir.RawData)
				errorRows = append(errorRows, ir)
			}
		}
	}

	jsonOK(w, map[string]interface{}{"success": true, "data": batch, "errors": errorRows})
}

func (s *Service) HandleProcessBatch(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if s.db == nil {
		jsonError(w, http.StatusInternalServerError, "database connection unavailable")
		return
	}

	// Fetch valid rows
	rows, err := s.db.Query(r.Context(), `SELECT id::text, raw_data FROM import_rows WHERE batch_id::text = $1 AND status = 'VALID'`, id)
	if err != nil {
		jsonError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	type processRow struct {
		ID      string
		RawData map[string]interface{}
	}
	var validRows []processRow
	for rows.Next() {
		var pr processRow
		var raw []byte
		if err := rows.Scan(&pr.ID, &raw); err == nil {
			json.Unmarshal(raw, &pr.RawData)
			validRows = append(validRows, pr)
		}
	}
	rows.Close()

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	joinDate := time.Now().Format("2006-01-02")

	for i, vr := range validRows {
		email := vr.RawData["email"].(string)
		firstName := vr.RawData["first_name"].(string)
		lastName := vr.RawData["last_name"].(string)
		
		jd, ok := vr.RawData["join_date"].(string)
		if ok && jd != "" {
			joinDate = jd
		}

		empID := fmt.Sprintf("EMP-%d-%d", time.Now().Unix(), i)

		// Create user
		var userID string
		err = s.db.QueryRow(r.Context(), `
			INSERT INTO users (email, password_hash, is_active)
			VALUES ($1, $2, true)
			RETURNING id::text
		`, email, string(hashedPassword)).Scan(&userID)
		
		if err != nil {
			// Skip if email exists or fails
			s.db.Exec(r.Context(), `UPDATE import_rows SET status = 'ERROR', error_message = $1 WHERE id::text = $2`, "user creation failed: " + err.Error(), vr.ID)
			continue
		}

		// Create employee
		var employeeID string
		err = s.db.QueryRow(r.Context(), `
			INSERT INTO employees (user_id, employee_id, first_name, last_name, joining_date, status)
			VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
			RETURNING id::text
		`, userID, empID, firstName, lastName, joinDate).Scan(&employeeID)

		if err != nil {
			s.db.Exec(r.Context(), `UPDATE import_rows SET status = 'ERROR', error_message = $1 WHERE id::text = $2`, "employee creation failed: " + err.Error(), vr.ID)
			continue
		}

		// Update row to COMPLETED
		s.db.Exec(r.Context(), `UPDATE import_rows SET status = 'COMPLETED', created_employee_id = $1 WHERE id::text = $2`, employeeID, vr.ID)
	}

	_, err = s.db.Exec(r.Context(), `UPDATE import_batches SET status = 'COMPLETED' WHERE id::text = $1`, id)
	if err != nil {
		jsonError(w, http.StatusInternalServerError, err.Error())
		return
	}

	jsonOK(w, map[string]interface{}{"success": true, "status": "COMPLETED"})
}

func jsonOK(w http.ResponseWriter, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}

func jsonError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": msg})
}
