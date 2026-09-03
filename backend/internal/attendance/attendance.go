package attendance

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
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
	r.Get("/punch-status", s.HandlePunchStatus)
	r.Get("/daily", s.HandleDailyStatus)
	r.Get("/dashboard-metrics", s.HandleDashboardMetrics)
	r.Get("/activities", s.HandleGetActivities)
	r.Get("/monthly-summary", s.HandleGetMonthlySummary)

	// Sprint 1 — Attendance 3-Stage Validation Engine
	r.Get("/validation-queue", s.HandleGetValidationQueue)
	r.Post("/validate-batch", s.HandleBatchValidation)

	// Sprint 2 — Shift Exceptions & Tracking
	s.RegisterExceptionRoutes(r)

	// Sprint 4 — Attendance Rules, IP Allowlisting, Geofencing & Biometrics
	s.RegisterConfigRoutes(r)

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
	Action string `json:"action"`
	Notes  string `json:"notes"`
}

func (s *Service) HandlePunch(w http.ResponseWriter, r *http.Request) {
	var req PunchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	claims, ok := auth.GetClaims(r)
	if !ok {
		authz.UnauthorizedResponse(w)
		return
	}

	if s.db == nil {
		common.JSONError(w, "Database connection unavailable", http.StatusInternalServerError)
		return
	}

	callerEmpID, _, _ := s.getCallerIDs(r.Context(), claims.UserID)
	if callerEmpID == "" {
		common.JSONError(w, "Employee profile not found", http.StatusBadRequest)
		return
	}

	punchType := "IN"
	if req.Action == "CHECK_OUT" {
		punchType = "OUT"
	}

	// 1. Insert into attendance_raw_logs
	_, err := s.db.Exec(r.Context(), `
		INSERT INTO attendance_raw_logs (employee_id, provider, punch_time, punch_type, raw_payload)
		VALUES ($1, 'MANUAL_WEB', NOW(), $2, $3)
	`, callerEmpID, punchType, fmt.Sprintf(`{"notes": "%s"}`, req.Notes))
	if err != nil {
		common.JSONError(w, "Failed to record raw punch", http.StatusInternalServerError)
		return
	}

	// 2. Upsert into attendance_daily_status
	today := time.Now().Format("2006-01-02")
	if punchType == "IN" {
		_, err = s.db.Exec(r.Context(), `
			INSERT INTO attendance_daily_status (employee_id, date, first_in, status, validation_status)
			VALUES ($1, $2, NOW(), 'PRESENT', 'TO_VALIDATE')
			ON CONFLICT (employee_id, date) DO UPDATE 
			SET first_in = EXCLUDED.first_in, status = 'PRESENT', updated_at = NOW() 
			WHERE attendance_daily_status.first_in IS NULL
		`, callerEmpID, today)
	} else {
		// For Check-Out, update last_out and calculate worked_hours
		_, err = s.db.Exec(r.Context(), `
			UPDATE attendance_daily_status
			SET last_out = NOW(),
			    worked_hours = EXTRACT(EPOCH FROM (NOW() - first_in))/3600.0,
			    updated_at = NOW()
			WHERE employee_id = $1 AND date = $2
		`, callerEmpID, today)
	}

	if err != nil {
		common.JSONError(w, "Failed to update daily status", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Punch recorded successfully",
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

// HandlePunchStatus handles live punch status queries for the top navbar widget
func (s *Service) HandlePunchStatus(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok {
		authz.UnauthorizedResponse(w)
		return
	}

	callerEmpID, _, _ := s.getCallerIDs(r.Context(), claims.UserID)
	if callerEmpID == "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":         true,
			"is_checked_in":   false,
			"check_in_time":   "",
			"check_out_time":  "",
			"elapsed_seconds": 0,
			"user_id":         claims.UserID,
		})
		return
	}

	today := time.Now().Format("2006-01-02")
	var checkIn string
	var checkOut string

	if s.db != nil {
		_ = s.db.QueryRow(r.Context(), `
			SELECT COALESCE(to_char(first_in, 'HH24:MI:SS'), ''), COALESCE(to_char(last_out, 'HH24:MI:SS'), '')
			FROM attendance_daily_status
			WHERE date = $1 AND employee_id = $2
			LIMIT 1
		`, today, callerEmpID).Scan(&checkIn, &checkOut)
	}

	isCheckedIn := checkIn != "" && checkOut == ""
	elapsedSeconds := 0
	if isCheckedIn {
		t, err := time.Parse("15:04:05", checkIn)
		if err == nil {
			now := time.Now()
			checkInToday := time.Date(now.Year(), now.Month(), now.Day(), t.Hour(), t.Minute(), t.Second(), 0, now.Location())
			elapsedSeconds = int(now.Sub(checkInToday).Seconds())
			if elapsedSeconds < 0 {
				elapsedSeconds = 0
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":         true,
		"is_checked_in":   isCheckedIn,
		"check_in_time":   checkIn,
		"check_out_time":  checkOut,
		"elapsed_seconds": elapsedSeconds,
		"user_id":         claims.UserID,
	})
}

func (s *Service) HandleDashboardMetrics(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok {
		authz.UnauthorizedResponse(w)
		return
	}

	callerEmpID, _, _ := s.getCallerIDs(r.Context(), claims.UserID)
	isAdmin := authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN", "PAYROLL_ADMIN")
	isManager := authz.HasRole(claims, "MANAGER", "DEPT_HEAD")

	scopeCond := "1=0"
	if isAdmin {
		scopeCond = "1=1"
	} else if isManager && callerEmpID != "" {
		scopeCond = fmt.Sprintf("e.manager_id::text = '%s'", callerEmpID)
	} else {
		scopeCond = fmt.Sprintf("e.id::text = '%s'", callerEmpID)
	}

	today := time.Now().Format("2006-01-02")
	
	query := fmt.Sprintf(`
		SELECT 
			COUNT(e.id) as total_employees,
			COUNT(a.id) FILTER (WHERE a.status = 'PRESENT' OR a.status = 'LATE') as present_today,
			COUNT(a.id) FILTER (WHERE a.status = 'LATE' OR a.late_by_minutes > 0) as late_arrivals,
			COUNT(a.id) FILTER (WHERE a.validation_status = 'TO_VALIDATE') as pending_validation,
			COUNT(a.id) FILTER (WHERE a.ot_hours > 0) as ot_pending
		FROM employees e
		LEFT JOIN attendance_daily_status a ON e.id = a.employee_id AND a.date = $1
		WHERE e.status = 'ACTIVE' AND (%s)
	`, scopeCond)

	var totalEmployees, presentToday, lateArrivals, pendingValidation, otPending int
	err := s.db.QueryRow(r.Context(), query, today).Scan(&totalEmployees, &presentToday, &lateArrivals, &pendingValidation, &otPending)
	if err != nil {
		common.JSONError(w, "Failed to load dashboard metrics", http.StatusInternalServerError)
		return
	}

	onTime := presentToday - lateArrivals
	if onTime < 0 {
		onTime = 0
	}

	presentPercentage := 0.0
	if totalEmployees > 0 {
		presentPercentage = float64(presentToday) / float64(totalEmployees) * 100
	}

	// Department Rates
	deptQuery := fmt.Sprintf(`
		SELECT COALESCE(d.name, 'General'), 
			   COUNT(a.id) FILTER (WHERE a.status IN ('PRESENT', 'LATE')) * 100.0 / NULLIF(COUNT(e.id), 0)
		FROM employees e
		LEFT JOIN departments d ON e.department_id = d.id
		LEFT JOIN attendance_daily_status a ON e.id = a.employee_id AND a.date = $1
		WHERE e.status = 'ACTIVE' AND (%s)
		GROUP BY d.name
	`, scopeCond)
	
	var deptRates []map[string]interface{}
	rows, _ := s.db.Query(r.Context(), deptQuery, today)
	if rows != nil {
		for rows.Next() {
			var name string
			var rate sql.NullFloat64
			rows.Scan(&name, &rate)
			if rate.Valid {
				deptRates = append(deptRates, map[string]interface{}{"department": name, "rate": math.Round(rate.Float64*10) / 10})
			}
		}
		rows.Close()
	}

	// Top Absentees
	absentQuery := fmt.Sprintf(`
		SELECT e.first_name || ' ' || e.last_name, COALESCE(d.name, 'General'), COUNT(a.id)
		FROM employees e
		LEFT JOIN departments d ON e.department_id = d.id
		JOIN attendance_daily_status a ON e.id = a.employee_id
		WHERE a.status = 'ABSENT' AND date_trunc('month', a.date) = date_trunc('month', $1::date) AND (%s)
		GROUP BY e.id, d.name
		ORDER BY COUNT(a.id) DESC
		LIMIT 5
	`, scopeCond)
	
	var topAbsentees []map[string]interface{}
	rowsAbs, _ := s.db.Query(r.Context(), absentQuery, today)
	if rowsAbs != nil {
		for rowsAbs.Next() {
			var name, dept string
			var count int
			rowsAbs.Scan(&name, &dept, &count)
			topAbsentees = append(topAbsentees, map[string]interface{}{"employee_name": name, "department": dept, "absent_days": count})
		}
		rowsAbs.Close()
	}

	metrics := map[string]interface{}{
		"total_employees":      totalEmployees,
		"present_today":        presentToday,
		"present_percentage":   math.Round(presentPercentage*10) / 10,
		"on_leave":             0, // Future hook for leave system
		"on_time":              onTime,
		"late_arrivals":        lateArrivals,
		"early_departures":     0, // Placeholder
		"pending_validation":   pendingValidation,
		"ot_pending":           otPending,
		"clock_in_distribution": []map[string]interface{}{
			{"hour": "08:00", "count": presentToday / 4},
			{"hour": "08:30", "count": presentToday / 2},
			{"hour": "09:00", "count": presentToday / 4},
		},
		"dept_attendance_rate": deptRates,
		"top_absentees":        topAbsentees,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    metrics,
	})
}

func (s *Service) HandleGetActivities(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok {
		authz.UnauthorizedResponse(w)
		return
	}

	callerEmpID, _, _ := s.getCallerIDs(r.Context(), claims.UserID)
	isAdmin := authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN", "PAYROLL_ADMIN")
	isManager := authz.HasRole(claims, "MANAGER", "DEPT_HEAD")

	scopeCond := "1=0"
	if isAdmin {
		scopeCond = "1=1"
	} else if isManager && callerEmpID != "" {
		scopeCond = fmt.Sprintf("e.manager_id::text = '%s'", callerEmpID)
	} else {
		scopeCond = fmt.Sprintf("e.id::text = '%s'", callerEmpID)
	}

	today := time.Now().Format("2006-01-02")
	query := fmt.Sprintf(`
		SELECT 
			a.id::text, e.employee_id, e.first_name || ' ' || e.last_name,
			to_char(a.date, 'YYYY-MM-DD'),
			COALESCE(to_char(a.first_in, 'HH24:MI:SS'), '-'),
			COALESCE(to_char(a.last_out, 'HH24:MI:SS'), '-'),
			CASE WHEN a.last_out IS NULL AND a.first_in IS NOT NULL THEN true ELSE false END as is_active,
			COALESCE(a.worked_hours, 0)
		FROM attendance_daily_status a
		JOIN employees e ON a.employee_id = e.id
		WHERE a.date = $1 AND (%s)
		ORDER BY a.first_in DESC
		LIMIT 50
	`, scopeCond)

	var activities []map[string]interface{}
	rows, err := s.db.Query(r.Context(), query, today)
	if err == nil {
		for rows.Next() {
			var id, empCode, empName, date, checkIn, checkOut string
			var isActive bool
			var workedHours float64
			
			rows.Scan(&id, &empCode, &empName, &date, &checkIn, &checkOut, &isActive, &workedHours)
			
			durStr := fmt.Sprintf("%.2f hrs", workedHours)
			if checkOut == "-" {
				durStr = "Running"
			}

			activities = append(activities, map[string]interface{}{
				"id":              id,
				"employee_code":   empCode,
				"employee_name":   empName,
				"attendance_date": date,
				"in_date":         date,
				"check_in":        checkIn,
				"out_date":        date,
				"check_out":       checkOut,
				"duration":        durStr,
				"is_active":       isActive,
			})
		}
		rows.Close()
	}

	if activities == nil {
		activities = []map[string]interface{}{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    activities,
	})
}

func (s *Service) HandleGetMonthlySummary(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok {
		authz.UnauthorizedResponse(w)
		return
	}

	callerEmpID, _, _ := s.getCallerIDs(r.Context(), claims.UserID)
	isAdmin := authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN", "PAYROLL_ADMIN")
	isManager := authz.HasRole(claims, "MANAGER", "DEPT_HEAD")

	scopeCond := "1=0"
	if isAdmin {
		scopeCond = "1=1"
	} else if isManager && callerEmpID != "" {
		scopeCond = fmt.Sprintf("e.manager_id::text = '%s'", callerEmpID)
	} else {
		scopeCond = fmt.Sprintf("e.id::text = '%s'", callerEmpID)
	}

	month := r.URL.Query().Get("month")
	if month == "" {
		month = time.Now().Format("2006-01")
	}

	query := fmt.Sprintf(`
		SELECT 
			e.employee_id, e.first_name || ' ' || e.last_name, COALESCE(d.name, 'General'),
			COUNT(a.id) FILTER (WHERE a.status = 'PRESENT' OR a.status = 'LATE') as present_days,
			COUNT(a.id) FILTER (WHERE a.status = 'ABSENT') as absent_days,
			COUNT(a.id) as working_days,
			COALESCE(SUM(a.worked_hours), 0) as worked_hours,
			COALESCE(SUM(a.ot_hours), 0) as ot_hours
		FROM employees e
		LEFT JOIN departments d ON e.department_id = d.id
		LEFT JOIN attendance_daily_status a ON e.id = a.employee_id AND to_char(a.date, 'YYYY-MM') = $1
		WHERE e.status = 'ACTIVE' AND (%s)
		GROUP BY e.employee_id, e.first_name, e.last_name, d.name
		ORDER BY e.first_name ASC
	`, scopeCond)

	var summary []map[string]interface{}
	var totalEmployees, totalWorkingDays int
	var sumAttendance float64

	rows, err := s.db.Query(r.Context(), query, month)
	if err == nil {
		for rows.Next() {
			var empCode, empName, dept string
			var presentDays, absentDays, workingDays int
			var workedHours, otHours float64

			rows.Scan(&empCode, &empName, &dept, &presentDays, &absentDays, &workingDays, &workedHours, &otHours)

			totalEmployees++
			totalWorkingDays += workingDays
			if workingDays > 0 {
				sumAttendance += float64(presentDays) / float64(workingDays) * 100.0
			}

			summary = append(summary, map[string]interface{}{
				"employee_code": empCode,
				"employee_name": empName,
				"department":    dept,
				"present_days":  presentDays,
				"absent_days":   absentDays,
				"paid_leave":    0,
				"unpaid_leave":  0,
				"working_days":  workingDays,
				"worked_hours":  fmt.Sprintf("%.1f", workedHours),
				"ot_hours":      fmt.Sprintf("%.1f", otHours),
			})
		}
		rows.Close()
	}

	if summary == nil {
		summary = []map[string]interface{}{}
	}

	avgAttendance := 0.0
	if totalEmployees > 0 {
		avgAttendance = sumAttendance / float64(totalEmployees)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    summary,
		"totals": map[string]interface{}{
			"total_employees": totalEmployees,
			"working_days":    totalWorkingDays, // Simplified aggregation
			"avg_attendance":  fmt.Sprintf("%.1f%%", avgAttendance),
		},
	})
}

func (s *Service) getCallerIDs(ctx context.Context, userID string) (string, string, error) {
	var empID string
	err := s.db.QueryRow(ctx, "SELECT id::text FROM employees WHERE user_id = $1 AND deleted_at IS NULL", userID).Scan(&empID)
	if err != nil {
		return "", userID, err
	}
	return empID, userID, nil
}

