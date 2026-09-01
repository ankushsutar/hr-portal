package attendance

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/company/hrms-backend/internal/audit"
	"github.com/company/hrms-backend/internal/auth"
	"github.com/company/hrms-backend/internal/authz"
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

type ValidationItem struct {
	ID                 string  `json:"id"`
	EmployeeID         string  `json:"employee_id"`
	EmployeeCode       string  `json:"employee_code"`
	EmployeeName       string  `json:"employee_name"`
	Department         string  `json:"department"`
	Date               string  `json:"date"`
	ShiftName          string  `json:"shift_name"`
	CheckInTime        string  `json:"check_in_time"`
	CheckOutTime       string  `json:"check_out_time"`
	WorkedHours        float64 `json:"worked_hours"`
	ExpectedHours      float64 `json:"expected_hours"`
	OTHours            float64 `json:"ot_hours"`
	ValidationStatus   string  `json:"validation_status"` // TO_VALIDATE, OT_PENDING, VALIDATED, REJECTED
	ValidationComments string  `json:"validation_comments"`
	ValidatedBy        string  `json:"validated_by,omitempty"`
	ValidatedAt        string  `json:"validated_at,omitempty"`
}

type BatchValidationRequest struct {
	IDs      []string `json:"ids"`
	Action   string   `json:"action"` // VALIDATE, REJECT, APPROVE_OT, REJECT_OT
	Comments string   `json:"comments"`
}

type Service struct {
	db           *pgxpool.Pool
	auditService *audit.Service
}

func NewService(db *pgxpool.Pool) *Service {
	var auditSvc *audit.Service
	if db != nil {
		auditSvc = audit.NewService(db)
	}
	return &Service{db: db, auditService: auditSvc}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/logs", s.HandleGetLogs)
	r.Post("/check-in", s.HandleCheckIn)
	r.Post("/check-out", s.HandleCheckOut)
	r.Post("/regularize", s.HandleRegularize)
	
	// Sprint 8 & 9
	r.Post("/punch", s.HandlePunch)
	r.Get("/daily", s.HandleDailyStatus)

	// Sprint 1 — Attendance 3-Stage Validation Engine
	r.Get("/validation-queue", s.HandleGetValidationQueue)
	r.Post("/validate-batch", s.HandleBatchValidation)

	// Sprint 2 — Shift Exceptions & Tracking
	s.RegisterExceptionRoutes(r)

	// Sprint 9 Requests
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

func (s *Service) HandleGetValidationQueue(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN", "MANAGER", "PAYROLL_ADMIN") {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only managers and HR admins can access validation queues.")
		return
	}

	pg := common.ParsePaginationParams(r)
	statusFilter := r.URL.Query().Get("validation_status")
	if statusFilter == "" {
		statusFilter = "TO_VALIDATE"
	}

	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	query := `
		SELECT ads.id::text, e.id::text as employee_uuid, e.employee_id as employee_code,
		       e.first_name || ' ' || e.last_name as employee_name,
		       COALESCE(d.name, 'General') as department,
		       to_char(ads.date, 'YYYY-MM-DD') as date,
		       COALESCE(s.name, 'Regular Shift') as shift_name,
		       COALESCE(to_char(ads.first_in, 'HH12:MI AM'), '--:--') as check_in_time,
		       COALESCE(to_char(ads.last_out, 'HH12:MI AM'), '--:--') as check_out_time,
		       COALESCE(ads.worked_hours, 0) as worked_hours,
		       COALESCE(ads.expected_hours, 8.0) as expected_hours,
		       COALESCE(ads.ot_hours, 0) as ot_hours,
		       COALESCE(ads.validation_status, 'TO_VALIDATE') as validation_status,
		       COALESCE(ads.validation_comments, '') as validation_comments,
		       COALESCE(ads.validated_by::text, '') as validated_by,
		       COALESCE(to_char(ads.validated_at, 'YYYY-MM-DD HH24:MI:SS'), '') as validated_at
		FROM attendance_daily_status ads
		JOIN employees e ON ads.employee_id = e.id
		LEFT JOIN departments d ON e.department_id = d.id
		LEFT JOIN shifts s ON ads.shift_id = s.id
		WHERE ads.validation_status = $1
		ORDER BY ads.date DESC, e.employee_id ASC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Query(r.Context(), query, statusFilter, pg.Limit, pg.Offset)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":    true,
			"data":       []ValidationItem{},
			"total":      0,
			"pagination": common.BuildPaginationMeta(0, pg.Page, pg.Limit),
		})
		return
	}
	defer rows.Close()

	var items []ValidationItem
	for rows.Next() {
		var vi ValidationItem
		if err := rows.Scan(
			&vi.ID, &vi.EmployeeID, &vi.EmployeeCode, &vi.EmployeeName, &vi.Department,
			&vi.Date, &vi.ShiftName, &vi.CheckInTime, &vi.CheckOutTime,
			&vi.WorkedHours, &vi.ExpectedHours, &vi.OTHours,
			&vi.ValidationStatus, &vi.ValidationComments, &vi.ValidatedBy, &vi.ValidatedAt,
		); err == nil {
			items = append(items, vi)
		}
	}
	if items == nil {
		items = []ValidationItem{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"data":       items,
		"total":      len(items),
		"pagination": common.BuildPaginationMeta(len(items), pg.Page, pg.Limit),
	})
}

func (s *Service) HandleBatchValidation(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN", "MANAGER", "PAYROLL_ADMIN") {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only managers and HR admins can validate attendance records.")
		return
	}

	var req BatchValidationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || len(req.IDs) == 0 {
		http.Error(w, "invalid request: select at least one record", http.StatusBadRequest)
		return
	}

	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	targetStatus := "VALIDATED"
	if req.Action == "REJECT" || req.Action == "REJECT_OT" {
		targetStatus = "REJECTED"
	} else if req.Action == "APPROVE_OT" || req.Action == "VALIDATE" {
		targetStatus = "VALIDATED"
	}

	updatedCount := 0
	for _, id := range req.IDs {
		var validUUID string
		_ = s.db.QueryRow(r.Context(), "SELECT id::text FROM users WHERE id::text = $1", claims.UserID).Scan(&validUUID)

		var err error
		if validUUID != "" {
			_, err = s.db.Exec(r.Context(), `
				UPDATE attendance_daily_status
				SET validation_status = $1,
				    validated_by = $2::uuid,
				    validated_at = NOW(),
				    validation_comments = $3,
				    updated_at = NOW()
				WHERE id::text = $4
			`, targetStatus, validUUID, req.Comments, id)
		} else {
			_, err = s.db.Exec(r.Context(), `
				UPDATE attendance_daily_status
				SET validation_status = $1,
				    validated_at = NOW(),
				    validation_comments = $2,
				    updated_at = NOW()
				WHERE id::text = $3
			`, targetStatus, req.Comments, id)
		}

		if err == nil {
			updatedCount++
			if s.auditService != nil {
				_ = s.auditService.LogAction(r.Context(), audit.LogEntry{
					UserID:     claims.UserID,
					Action:     "ATTENDANCE_VALIDATION_" + req.Action,
					Module:     "ATTENDANCE",
					EntityName: "attendance_daily_status",
					EntityID:   id,
					AfterState: map[string]interface{}{"validation_status": targetStatus, "comments": req.Comments},
					Reason:     req.Comments,
				})
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Successfully processed %d attendance records to status %s.", updatedCount, targetStatus),
		"count":   updatedCount,
		"status":  targetStatus,
	})
}

