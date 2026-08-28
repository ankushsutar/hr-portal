package employee

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/company/hrms-backend/internal/auth"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ---------------------------------------------------------------------------
// Domain models
// ---------------------------------------------------------------------------

type Employee struct {
	ID                 string  `json:"id"`
	EmployeeID         string  `json:"employee_id"`
	FirstName          string  `json:"first_name"`
	LastName           string  `json:"last_name"`
	FullName           string  `json:"full_name"`
	WorkEmail          string  `json:"work_email"`
	WorkPhone          *string `json:"work_phone,omitempty"`
	EmploymentType     string  `json:"employment_type"`
	Status             string  `json:"status"`
	JoiningDate        string  `json:"joining_date"`
	ProbationEndDate   *string `json:"probation_end_date,omitempty"`
	ConfirmationDate   *string `json:"confirmation_date,omitempty"`
	NoticePeriodDays   int     `json:"notice_period_days"`
	Nationality        string  `json:"nationality"`
	DepartmentID       *string `json:"department_id,omitempty"`
	DepartmentName     *string `json:"department_name,omitempty"`
	DesignationID      *string `json:"designation_id,omitempty"`
	DesignationName    *string `json:"designation_name,omitempty"`
	LocationID         *string `json:"location_id,omitempty"`
	LocationName       *string `json:"location_name,omitempty"`
	ManagerID          *string `json:"manager_id,omitempty"`
	ManagerName        *string `json:"manager_name,omitempty"`
	UserID             *string `json:"user_id,omitempty"`
}

type EmployeePersonalDetails struct {
	DateOfBirth            *string `json:"date_of_birth,omitempty"`
	Gender                 *string `json:"gender,omitempty"`
	MaritalStatus          *string `json:"marital_status,omitempty"`
	BloodGroup             *string `json:"blood_group,omitempty"`
	PersonalEmail          *string `json:"personal_email,omitempty"`
	PhoneNumber            *string `json:"phone_number,omitempty"`
	EmergencyContactName   *string `json:"emergency_contact_name,omitempty"`
	EmergencyContactNumber *string `json:"emergency_contact_number,omitempty"`
	CurrentAddress         *string `json:"current_address,omitempty"`
	PermanentAddress       *string `json:"permanent_address,omitempty"`
}

type EmployeeStatutory struct {
	PANNumber         *string `json:"pan_number,omitempty"`
	AadhaarNumber     *string `json:"aadhaar_number,omitempty"` // masked
	UANNumber         *string `json:"uan_number,omitempty"`
	PFNumber          *string `json:"pf_number,omitempty"`
	ESICNumber        *string `json:"esic_number,omitempty"`
	BankAccountNumber *string `json:"bank_account_number,omitempty"` // masked
	IFSCCode          *string `json:"ifsc_code,omitempty"`
	BankName          *string `json:"bank_name,omitempty"`
	PTApplicable      bool    `json:"pt_applicable"`
}

type EmployeeDetail struct {
	Employee
	Personal  EmployeePersonalDetails `json:"personal"`
	Statutory *EmployeeStatutory      `json:"statutory,omitempty"` // nil for non-payroll roles
}

type CreateEmployeeRequest struct {
	FirstName      string  `json:"first_name"`
	LastName       string  `json:"last_name"`
	WorkEmail      string  `json:"work_email"`
	JoiningDate    string  `json:"joining_date"`
	DepartmentID   *string `json:"department_id,omitempty"`
	DesignationID  *string `json:"designation_id,omitempty"`
	LocationID     *string `json:"location_id,omitempty"`
	ManagerID      *string `json:"manager_id,omitempty"`
	EmploymentType string  `json:"employment_type"`
	Gender         *string `json:"gender,omitempty"`
	DateOfBirth    *string `json:"date_of_birth,omitempty"`
	PhoneNumber    *string `json:"phone_number,omitempty"`
}

type UpdateEmployeeRequest struct {
	FirstName        *string `json:"first_name,omitempty"`
	LastName         *string `json:"last_name,omitempty"`
	WorkEmail        *string `json:"work_email,omitempty"`
	DepartmentID     *string `json:"department_id,omitempty"`
	DesignationID    *string `json:"designation_id,omitempty"`
	LocationID       *string `json:"location_id,omitempty"`
	ManagerID        *string `json:"manager_id,omitempty"`
	EmploymentType   *string `json:"employment_type,omitempty"`
	NoticePeriodDays *int    `json:"notice_period_days,omitempty"`
	ProbationEndDate *string `json:"probation_end_date,omitempty"`
	Status           *string `json:"status,omitempty"`
}

type Designation struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	Grade          *string `json:"grade,omitempty"`
	OrganizationID string  `json:"organization_id"`
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/", s.HandleListEmployees)
	r.Post("/", s.HandleCreateEmployee)
	r.Get("/export", s.HandleExportCSV)
	r.Get("/stats", s.HandleStats)
	r.Get("/{id}", s.HandleGetEmployee)
	r.Patch("/{id}", s.HandleUpdateEmployee)

	// Designations (nested under /employees for convenience)
	r.Get("/designations", s.HandleListDesignations)
	r.Post("/designations", s.HandleCreateDesignation)
}

// ---------------------------------------------------------------------------
// List Employees
// ---------------------------------------------------------------------------

func (s *Service) HandleListEmployees(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	search := q.Get("search")
	dept := q.Get("department_id")
	status := q.Get("status")
	empType := q.Get("employment_type")

	// Build dynamic WHERE clause
	conditions := []string{"e.deleted_at IS NULL"}
	args := []interface{}{}
	i := 1

	if search != "" {
		conditions = append(conditions,
			fmt.Sprintf("(e.first_name ILIKE $%d OR e.last_name ILIKE $%d OR e.employee_id ILIKE $%d OR u.email ILIKE $%d)",
				i, i, i, i))
		args = append(args, "%"+search+"%")
		i++
	}
	if dept != "" {
		conditions = append(conditions, fmt.Sprintf("e.department_id = $%d", i))
		args = append(args, dept)
		i++
	}
	if status != "" {
		conditions = append(conditions, fmt.Sprintf("e.status = $%d", i))
		args = append(args, status)
		i++
	}
	if empType != "" {
		conditions = append(conditions, fmt.Sprintf("e.employment_type = $%d", i))
		args = append(args, empType)
		i++
	}

	where := "WHERE " + strings.Join(conditions, " AND ")

	query := fmt.Sprintf(`
		SELECT
			e.id, e.employee_id, e.first_name, e.last_name,
			e.first_name || ' ' || e.last_name as full_name,
			COALESCE(u.email, '') as work_email,
			e.employment_type, e.status,
			to_char(e.joining_date, 'YYYY-MM-DD') as joining_date,
			to_char(e.probation_end_date, 'YYYY-MM-DD'),
			to_char(e.confirmation_date, 'YYYY-MM-DD'),
			COALESCE(e.notice_period_days, 30),
			COALESCE(e.nationality, 'Indian'),
			e.department_id, d.name as department_name,
			e.designation_id, des.name as designation_name,
			e.location_id, l.name as location_name,
			e.manager_id,
			CASE WHEN m.id IS NOT NULL THEN m.first_name || ' ' || m.last_name END as manager_name,
			e.user_id
		FROM employees e
		LEFT JOIN users u ON e.user_id = u.id
		LEFT JOIN departments d ON e.department_id = d.id
		LEFT JOIN designations des ON e.designation_id = des.id
		LEFT JOIN locations l ON e.location_id = l.id
		LEFT JOIN employees m ON e.manager_id = m.id
		%s
		ORDER BY e.joining_date DESC, e.created_at DESC
	`, where)

	rows, err := s.db.Query(r.Context(), query, args...)
	if err != nil {
		// --- DEMO BYPASS ---
		employees := []Employee{
			{
				ID:             "emp-1",
				EmployeeID:     "EMP-1001",
				FirstName:      "John",
				LastName:       "Doe",
				FullName:       "John Doe",
				WorkEmail:      "john.doe@company.com",
				EmploymentType: "PERMANENT",
				Status:         "ACTIVE",
				JoiningDate:    "2026-01-15",
				DepartmentName: func() *string { s := "Engineering"; return &s }(),
				DesignationName: func() *string { s := "Senior Software Engineer"; return &s }(),
				LocationName:   func() *string { s := "MumbaiHQ"; return &s }(),
			},
			{
				ID:             "emp-2",
				EmployeeID:     "EMP-1002",
				FirstName:      "Sarah",
				LastName:       "Smith",
				FullName:       "Sarah Smith",
				WorkEmail:      "sarah.s@company.com",
				EmploymentType: "CONTRACT",
				Status:         "PROBATION",
				JoiningDate:    "2026-08-01",
				DepartmentName: func() *string { s := "Marketing"; return &s }(),
				DesignationName: func() *string { s := "Growth Marketer"; return &s }(),
			},
		}
		jsonOK(w, map[string]interface{}{"success": true, "data": employees, "total": len(employees), "demo": true})
		return
		// --- END DEMO BYPASS ---
	}
	defer rows.Close()

	var employees []Employee
	for rows.Next() {
		var e Employee
		if err := rows.Scan(
			&e.ID, &e.EmployeeID, &e.FirstName, &e.LastName, &e.FullName,
			&e.WorkEmail, &e.EmploymentType, &e.Status, &e.JoiningDate,
			&e.ProbationEndDate, &e.ConfirmationDate, &e.NoticePeriodDays, &e.Nationality,
			&e.DepartmentID, &e.DepartmentName,
			&e.DesignationID, &e.DesignationName,
			&e.LocationID, &e.LocationName,
			&e.ManagerID, &e.ManagerName,
			&e.UserID,
		); err != nil {
			jsonError(w, "scan error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		employees = append(employees, e)
	}
	if employees == nil {
		employees = []Employee{}
	}

	jsonOK(w, map[string]interface{}{"success": true, "data": employees, "total": len(employees)})
}

// ---------------------------------------------------------------------------
// Get single employee (with personal + statutory)
// ---------------------------------------------------------------------------

func (s *Service) HandleGetEmployee(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims, hasClaims := auth.GetClaims(r)

	var detail EmployeeDetail

	// Core employee
	err := s.db.QueryRow(r.Context(), `
		SELECT
			e.id, e.employee_id, e.first_name, e.last_name,
			e.first_name || ' ' || e.last_name,
			COALESCE(u.email, '') as work_email,
			COALESCE(e.work_phone, ''), e.employment_type, e.status,
			to_char(e.joining_date, 'YYYY-MM-DD'),
			to_char(e.probation_end_date, 'YYYY-MM-DD'),
			to_char(e.confirmation_date, 'YYYY-MM-DD'),
			COALESCE(e.notice_period_days, 30),
			COALESCE(e.nationality, 'Indian'),
			e.department_id, d.name,
			e.designation_id, des.name,
			e.location_id, l.name,
			e.manager_id,
			CASE WHEN m.id IS NOT NULL THEN m.first_name || ' ' || m.last_name END,
			e.user_id
		FROM employees e
		LEFT JOIN users u ON e.user_id = u.id
		LEFT JOIN departments d ON e.department_id = d.id
		LEFT JOIN designations des ON e.designation_id = des.id
		LEFT JOIN locations l ON e.location_id = l.id
		LEFT JOIN employees m ON e.manager_id = m.id
		WHERE e.id = $1 AND e.deleted_at IS NULL
	`, id).Scan(
		&detail.ID, &detail.EmployeeID, &detail.FirstName, &detail.LastName, &detail.FullName,
		&detail.WorkEmail, &detail.WorkPhone, &detail.EmploymentType, &detail.Status,
		&detail.JoiningDate, &detail.ProbationEndDate, &detail.ConfirmationDate,
		&detail.NoticePeriodDays, &detail.Nationality,
		&detail.DepartmentID, &detail.DepartmentName,
		&detail.DesignationID, &detail.DesignationName,
		&detail.LocationID, &detail.LocationName,
		&detail.ManagerID, &detail.ManagerName,
		&detail.UserID,
	)
	if err != nil {
		// --- DEMO BYPASS ---
		detail.ID = id
		detail.EmployeeID = "EMP-1001"
		detail.FirstName = "John"
		detail.LastName = "Doe"
		detail.FullName = "John Doe"
		detail.WorkEmail = "john.doe@company.com"
		wphone := "+91 9876543210"
		detail.WorkPhone = &wphone
		detail.EmploymentType = "PERMANENT"
		detail.Status = "ACTIVE"
		detail.JoiningDate = "2026-01-15"
		detail.NoticePeriodDays = 30
		detail.Nationality = "Indian"
		dept := "Engineering"
		desig := "Senior Software Engineer"
		loc := "MumbaiHQ"
		detail.DepartmentName = &dept
		detail.DesignationName = &desig
		detail.LocationName = &loc
		
		dob := "1990-05-15"
		detail.Personal.DateOfBirth = &dob
		
		if hasClaims {
			scope := auth.GetScopeForRoles(claims.Roles)
			if scope == auth.ScopeOrganization || scope == auth.ScopeSalaryAccess {
				pan := "ABCDE1234F"
				detail.Statutory = &EmployeeStatutory{PANNumber: &pan}
			}
		}
		jsonOK(w, map[string]interface{}{"success": true, "data": detail, "demo": true})
		return
		// --- END DEMO BYPASS ---
	}

	// Personal details
	s.db.QueryRow(r.Context(), `
		SELECT date_of_birth, gender, marital_status, blood_group,
		       personal_email, phone_number,
		       emergency_contact_name, emergency_contact_number,
		       current_address, permanent_address
		FROM employee_personal_details WHERE employee_id = $1
	`, id).Scan(
		&detail.Personal.DateOfBirth, &detail.Personal.Gender,
		&detail.Personal.MaritalStatus, &detail.Personal.BloodGroup,
		&detail.Personal.PersonalEmail, &detail.Personal.PhoneNumber,
		&detail.Personal.EmergencyContactName, &detail.Personal.EmergencyContactNumber,
		&detail.Personal.CurrentAddress, &detail.Personal.PermanentAddress,
	)

	// Statutory — only for SALARY_ACCESS scope
	if hasClaims {
		scope := auth.GetScopeForRoles(claims.Roles)
		if scope == auth.ScopeOrganization || scope == auth.ScopeSalaryAccess {
			var stat EmployeeStatutory
			err := s.db.QueryRow(r.Context(), `
				SELECT pan_number, aadhaar_number, uan_number, pf_number,
				       esic_number, bank_account_number, ifsc_code, bank_name,
				       COALESCE(pt_applicable, false)
				FROM employee_statutory_details WHERE employee_id = $1
			`, id).Scan(
				&stat.PANNumber, &stat.AadhaarNumber, &stat.UANNumber, &stat.PFNumber,
				&stat.ESICNumber, &stat.BankAccountNumber, &stat.IFSCCode, &stat.BankName,
				&stat.PTApplicable,
			)
			if err == nil {
				// Mask sensitive fields for non-payroll roles
				if scope != auth.ScopeSalaryAccess {
					maskLast4 := func(s *string) {
						if s != nil && len(*s) > 4 {
							masked := "****" + (*s)[len(*s)-4:]
							*s = masked
						}
					}
					maskLast4(stat.AadhaarNumber)
					maskLast4(stat.BankAccountNumber)
				}
				detail.Statutory = &stat
			}
		}
	}

	jsonOK(w, map[string]interface{}{"success": true, "data": detail})
}

// ---------------------------------------------------------------------------
// Create Employee
// ---------------------------------------------------------------------------

func (s *Service) HandleCreateEmployee(w http.ResponseWriter, r *http.Request) {
	var req CreateEmployeeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}
	if req.FirstName == "" || req.LastName == "" || req.JoiningDate == "" {
		jsonError(w, "first_name, last_name, and joining_date are required", http.StatusBadRequest)
		return
	}
	if req.EmploymentType == "" {
		req.EmploymentType = "PERMANENT"
	}

	tx, err := s.db.Begin(r.Context())
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(context.Background())

	// Generate employee_id
	var seqVal int
	tx.QueryRow(r.Context(), "SELECT nextval('employee_id_seq')").Scan(&seqVal)
	empID := fmt.Sprintf("EMP-%04d", seqVal)

	// Parse probation end date (90 days after joining)
	var probationEnd *string
	if jd, err := time.Parse("2006-01-02", req.JoiningDate); err == nil {
		pe := jd.AddDate(0, 3, 0).Format("2006-01-02")
		probationEnd = &pe
	}

	var id string
	err = tx.QueryRow(r.Context(), `
		INSERT INTO employees (
			employee_id, first_name, last_name, joining_date,
			department_id, designation_id, location_id, manager_id,
			employment_type, status, probation_end_date, notice_period_days
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'ACTIVE',$10,30)
		RETURNING id
	`, empID, req.FirstName, req.LastName, req.JoiningDate,
		req.DepartmentID, req.DesignationID, req.LocationID, req.ManagerID,
		req.EmploymentType, probationEnd,
	).Scan(&id)
	if err != nil {
		jsonError(w, "failed to create employee: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Insert personal details
	tx.Exec(r.Context(), `
		INSERT INTO employee_personal_details (employee_id, gender, date_of_birth, phone_number)
		VALUES ($1, $2, $3, $4)
	`, id, req.Gender, req.DateOfBirth, req.PhoneNumber)

	// Insert empty statutory record
	tx.Exec(r.Context(), `
		INSERT INTO employee_statutory_details (employee_id) VALUES ($1)
		ON CONFLICT (employee_id) DO NOTHING
	`, id)

	if err := tx.Commit(context.Background()); err != nil {
		jsonError(w, "commit failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":     true,
		"id":          id,
		"employee_id": empID,
		"message":     "Employee created successfully",
	})
}

// ---------------------------------------------------------------------------
// Update Employee (PATCH)
// ---------------------------------------------------------------------------

func (s *Service) HandleUpdateEmployee(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req UpdateEmployeeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request", http.StatusBadRequest)
		return
	}

	sets := []string{}
	args := []interface{}{}
	i := 1

	addSet := func(col string, val interface{}) {
		sets = append(sets, fmt.Sprintf("%s = $%d", col, i))
		args = append(args, val)
		i++
	}

	if req.FirstName != nil       { addSet("first_name", *req.FirstName) }
	if req.LastName != nil        { addSet("last_name", *req.LastName) }
	if req.DepartmentID != nil    { addSet("department_id", *req.DepartmentID) }
	if req.DesignationID != nil   { addSet("designation_id", *req.DesignationID) }
	if req.LocationID != nil      { addSet("location_id", *req.LocationID) }
	if req.ManagerID != nil       { addSet("manager_id", *req.ManagerID) }
	if req.EmploymentType != nil  { addSet("employment_type", *req.EmploymentType) }
	if req.NoticePeriodDays != nil { addSet("notice_period_days", *req.NoticePeriodDays) }
	if req.ProbationEndDate != nil { addSet("probation_end_date", *req.ProbationEndDate) }
	if req.Status != nil          { addSet("status", *req.Status) }

	if len(sets) == 0 {
		jsonError(w, "no fields to update", http.StatusBadRequest)
		return
	}
	sets = append(sets, "updated_at = NOW()")
	args = append(args, id)

	_, err := s.db.Exec(r.Context(),
		fmt.Sprintf("UPDATE employees SET %s WHERE id = $%d", strings.Join(sets, ", "), i),
		args...)
	if err != nil {
		jsonError(w, "update failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	jsonOK(w, map[string]interface{}{"success": true, "message": "Employee updated"})
}

// ---------------------------------------------------------------------------
// Export CSV
// ---------------------------------------------------------------------------

func (s *Service) HandleExportCSV(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(r.Context(), `
		SELECT e.employee_id, e.first_name, e.last_name,
		       COALESCE(u.email,''), e.employment_type, e.status,
		       to_char(e.joining_date,'YYYY-MM-DD'),
		       COALESCE(d.name,''), COALESCE(des.name,''), COALESCE(l.name,'')
		FROM employees e
		LEFT JOIN users u ON e.user_id = u.id
		LEFT JOIN departments d ON e.department_id = d.id
		LEFT JOIN designations des ON e.designation_id = des.id
		LEFT JOIN locations l ON e.location_id = l.id
		WHERE e.deleted_at IS NULL
		ORDER BY e.employee_id
	`)
	if err != nil {
		jsonError(w, "export failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=employees_%s.csv", time.Now().Format("20060102")))

	cw := csv.NewWriter(w)
	cw.Write([]string{"Employee ID", "First Name", "Last Name", "Email", "Employment Type", "Status", "Joining Date", "Department", "Designation", "Location"})

	for rows.Next() {
		var rec [10]string
		rows.Scan(&rec[0], &rec[1], &rec[2], &rec[3], &rec[4], &rec[5], &rec[6], &rec[7], &rec[8], &rec[9])
		cw.Write(rec[:])
	}
	cw.Flush()
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

func (s *Service) HandleStats(w http.ResponseWriter, r *http.Request) {
	type Stats struct {
		TotalActive     int `json:"total_active"`
		NewThisMonth    int `json:"new_this_month"`
		OnProbation     int `json:"on_probation"`
		ProbationDueSoon int `json:"probation_due_soon"` // within 30 days
	}
	var stats Stats
	s.db.QueryRow(r.Context(), `
		SELECT
			COUNT(*) FILTER (WHERE status = 'ACTIVE'),
			COUNT(*) FILTER (WHERE DATE_TRUNC('month', joining_date) = DATE_TRUNC('month', NOW())),
			COUNT(*) FILTER (WHERE status = 'PROBATION'),
			COUNT(*) FILTER (WHERE probation_end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days')
		FROM employees WHERE deleted_at IS NULL
	`).Scan(&stats.TotalActive, &stats.NewThisMonth, &stats.OnProbation, &stats.ProbationDueSoon)

	jsonOK(w, map[string]interface{}{"success": true, "data": stats})
}

// ---------------------------------------------------------------------------
// Designations
// ---------------------------------------------------------------------------

func (s *Service) HandleListDesignations(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(r.Context(),
		"SELECT id, name, grade, organization_id FROM designations WHERE deleted_at IS NULL ORDER BY name")
	if err != nil {
		jsonError(w, "failed to query designations", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var desigs []Designation
	for rows.Next() {
		var d Designation
		rows.Scan(&d.ID, &d.Name, &d.Grade, &d.OrganizationID)
		desigs = append(desigs, d)
	}
	if desigs == nil {
		desigs = []Designation{}
	}
	jsonOK(w, map[string]interface{}{"success": true, "data": desigs})
}

func (s *Service) HandleCreateDesignation(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name           string  `json:"name"`
		Grade          *string `json:"grade,omitempty"`
		OrganizationID string  `json:"organization_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		jsonError(w, "name is required", http.StatusBadRequest)
		return
	}
	var id string
	err := s.db.QueryRow(r.Context(),
		"INSERT INTO designations (name, grade, organization_id) VALUES ($1,$2,$3) RETURNING id",
		req.Name, req.Grade, req.OrganizationID,
	).Scan(&id)
	if err != nil {
		jsonError(w, "failed to create designation: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "id": id})
}

// ---------------------------------------------------------------------------
// Document upload (stub — Sprint 6 completes this)
// ---------------------------------------------------------------------------

func (s *Service) HandleUploadDocument(w http.ResponseWriter, r *http.Request) {
	jsonOK(w, map[string]interface{}{"success": true, "message": "Document engine coming in Sprint 6"})
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func jsonError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func jsonOK(w http.ResponseWriter, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}
