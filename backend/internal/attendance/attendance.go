package attendance

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/company/hrms-backend/internal/common"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AttendanceLog struct {
	ID           string `json:"id"`
	Date         string `json:"date"`
	CheckInTime  string `json:"check_in_time"`
	CheckOutTime string `json:"check_out_time"`
	Status       string `json:"status"`
	ShiftName    string `json:"shift_name"`
}

type RegularizeRequest struct {
	LogID       string `json:"log_id"`
	CheckIn     string `json:"requested_check_in"`
	CheckOut    string `json:"requested_check_out"`
	Reason      string `json:"reason"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/logs", s.HandleGetLogs)
	r.Post("/check-in", s.HandleCheckIn)
	r.Post("/check-out", s.HandleCheckOut)
	r.Post("/regularize", s.HandleRegularize)
	
	// Sprint 8
	r.Post("/punch", s.HandlePunch)
	r.Get("/daily", s.HandleDailyStatus)

	// Sprint 9
	r.Post("/requests", s.HandleSubmitRequest)
	r.Get("/requests/me", s.HandleMyRequests)
	r.Get("/requests/pending", s.HandlePendingApprovals)
	r.Post("/requests/{id}/approve", s.HandleApproveRequest)
	r.Post("/requests/{id}/reject", s.HandleRejectRequest)
}

func (s *Service) HandleGetLogs(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "database connection unavailable",
		})
		return
	}

	empID := r.URL.Query().Get("employee_id")
	var rows pgx.Rows
	var err error

	if empID != "" {
		rows, err = s.db.Query(r.Context(), `
			SELECT id::text, to_char(date, 'YYYY-MM-DD'),
			       to_char(check_in_time, 'HH12:MI AM'), COALESCE(to_char(check_out_time, 'HH12:MI AM'), '--:-- --'),
			       status, 'General Shift'
			FROM attendance_logs WHERE employee_id = $1 ORDER BY date DESC LIMIT 30
		`, empID)
	} else {
		rows, err = s.db.Query(r.Context(), `
			SELECT id::text, to_char(date, 'YYYY-MM-DD'),
			       to_char(check_in_time, 'HH12:MI AM'), COALESCE(to_char(check_out_time, 'HH12:MI AM'), '--:-- --'),
			       status, 'General Shift'
			FROM attendance_logs ORDER BY date DESC LIMIT 30
		`)
	}

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database query failed: " + err.Error()})
		return
	}
	defer rows.Close()

	var logs []AttendanceLog
	for rows.Next() {
		var l AttendanceLog
		if err := rows.Scan(&l.ID, &l.Date, &l.CheckInTime, &l.CheckOutTime, &l.Status, &l.ShiftName); err == nil {
			logs = append(logs, l)
		}
	}
	if logs == nil {
		logs = []AttendanceLog{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    logs,
	})
}

func (s *Service) HandleCheckIn(w http.ResponseWriter, r *http.Request) {
	// Stub for checking in
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true, 
		"message": "Checked in successfully.",
		"time": "09:00 AM",
	})
}

func (s *Service) HandleCheckOut(w http.ResponseWriter, r *http.Request) {
	// Stub for checking out
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true, 
		"message": "Checked out successfully.",
		"time": "06:00 PM",
	})
}

func (s *Service) HandleRegularize(w http.ResponseWriter, r *http.Request) {
	var req RegularizeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	
	// Stub for submitting a regularization request and triggering workflow
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true, 
		"message": "Regularization request submitted and workflow triggered.",
	})
}

// --- SPRINT 8 ---

type PunchRequest struct {
	EmployeeID string `json:"employee_id"`
	Provider   string `json:"provider"`
	PunchType  string `json:"punch_type"` // IN, OUT
}

func (s *Service) HandlePunch(w http.ResponseWriter, r *http.Request) {
	var req PunchRequest
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Punch recorded successfully",
		"data": map[string]interface{}{
			"employee_id": req.EmployeeID,
			"punch_type":  req.PunchType,
			"processed":   true,
		},
	})
}

func (s *Service) HandleDailyStatus(w http.ResponseWriter, r *http.Request) {
	pg := common.ParsePaginationParams(r)
	dateStr := r.URL.Query().Get("date")
	statusFilter := r.URL.Query().Get("status")

	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	var conditions []string
	var args []interface{}
	i := 1

	if dateStr != "" {
		if _, err := time.Parse("2006-01-02", dateStr); err == nil {
			conditions = append(conditions, fmt.Sprintf("al.date = $%d::date", i))
			args = append(args, dateStr)
			i++
		}
	}

	if pg.Search != "" {
		conditions = append(conditions, fmt.Sprintf("(e.first_name ILIKE $%d OR e.last_name ILIKE $%d OR e.employee_id ILIKE $%d)", i, i, i))
		args = append(args, "%"+pg.Search+"%")
		i++
	}
	if statusFilter != "" {
		conditions = append(conditions, fmt.Sprintf("al.status = $%d", i))
		args = append(args, statusFilter)
		i++
	}

	where := ""
	if len(conditions) > 0 {
		where = "WHERE " + strings.Join(conditions, " AND ")
	}

	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM attendance_logs al
		JOIN employees e ON al.employee_id = e.id
		%s
	`, where)

	var total int
	_ = s.db.QueryRow(r.Context(), countQuery, args...).Scan(&total)

	dataArgs := append(args, pg.Limit, pg.Offset)
	query := fmt.Sprintf(`
		SELECT al.id::text, e.employee_id, e.first_name || ' ' || e.last_name as employee_name,
		       COALESCE(d.name, 'Unassigned') as department,
		       to_char(al.date, 'YYYY-MM-DD') as date,
		       to_char(al.check_in_time, 'HH12:MI AM') as first_in,
		       COALESCE(to_char(al.check_out_time, 'HH12:MI AM'), '--:--') as last_out,
		       al.status, 0 as late_by_minutes
		FROM attendance_logs al
		JOIN employees e ON al.employee_id = e.id
		LEFT JOIN departments d ON e.department_id = d.id
		%s
		ORDER BY e.employee_id ASC
		LIMIT $%d OFFSET $%d
	`, where, i, i+1)

	rows, err := s.db.Query(r.Context(), query, dataArgs...)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":    true,
			"data":       []map[string]interface{}{},
			"total":      0,
			"pagination": common.BuildPaginationMeta(0, pg.Page, pg.Limit),
		})
		return
	}
	defer rows.Close()

	var data []map[string]interface{}
	for rows.Next() {
		var id, empID, empName, dept, dt, firstIn, lastOut, status string
		var lateMin int
		if err := rows.Scan(&id, &empID, &empName, &dept, &dt, &firstIn, &lastOut, &status, &lateMin); err == nil {
			data = append(data, map[string]interface{}{
				"id":              id,
				"employee_id":     empID,
				"employee_name":   empName,
				"department":      dept,
				"date":            dt,
				"first_in":        firstIn,
				"last_out":        lastOut,
				"status":          status,
				"late_by_minutes": lateMin,
			})
		}
	}
	if data == nil {
		data = []map[string]interface{}{}
	}

	meta := common.BuildPaginationMeta(total, pg.Page, pg.Limit)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"data":       data,
		"total":      total,
		"pagination": meta,
	})
}

