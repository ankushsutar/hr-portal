package reports

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/company/hrms-backend/internal/auth"
	"github.com/company/hrms-backend/internal/authz"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DataQualityIssue struct {
	ID           string `json:"id"`
	EmployeeID   string `json:"employee_id"`
	EmployeeName string `json:"employee_name"`
	Department   string `json:"department"`
	IssueType    string `json:"issue_type"` // MISSING_MANAGER, MISSING_DEPT, MISSING_SHIFT, MISSING_PAN, MISSING_BANK, DUPLICATE_EMAIL, MISSING_DOCS
	Severity     string `json:"severity"`   // HIGH, MEDIUM, LOW
	Description  string `json:"description"`
	FixUrl       string `json:"fix_url"`
}

type DataQualitySummary struct {
	HealthScore          int                `json:"health_score"` // 0-100
	TotalEmployees       int                `json:"total_employees"`
	CleanRecordCount     int                `json:"clean_record_count"`
	TotalIssuesCount     int                `json:"total_issues_count"`
	MissingManagerCount  int                `json:"missing_manager_count"`
	MissingBankPanCount  int                `json:"missing_bank_pan_count"`
	MissingShiftCount    int                `json:"missing_shift_count"`
	DuplicateEmailCount  int                `json:"duplicate_email_count"`
	MissingDocsCount     int                `json:"missing_docs_count"`
	Issues               []DataQualityIssue `json:"issues"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/dashboard", s.HandleGetDashboardData)
	r.Get("/data-quality", s.HandleGetDataQuality)
	r.Get("/export", s.HandleExportReport)
}

func (s *Service) HandleGetDashboardData(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"total_employees":   128,
		"open_jobs":         12,
		"pending_approvals": 4,
		"total_payroll":     4120000,
		"headcount_data": []map[string]interface{}{
			{"name": "Engineering", "count": 55},
			{"name": "Product", "count": 22},
			{"name": "Sales", "count": 25},
			{"name": "HR", "count": 14},
			{"name": "Finance", "count": 12},
		},
		"attrition_data": []map[string]interface{}{
			{"name": "Jan", "hired": 12, "attrition": 2},
			{"name": "Feb", "hired": 8, "attrition": 1},
			{"name": "Mar", "hired": 15, "attrition": 3},
			{"name": "Apr", "hired": 10, "attrition": 4},
			{"name": "May", "hired": 5, "attrition": 2},
			{"name": "Jun", "hired": 18, "attrition": 1},
			{"name": "Jul", "hired": 20, "attrition": 3},
			{"name": "Aug", "hired": 14, "attrition": 2},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    data,
	})
}

func (s *Service) HandleGetDataQuality(w http.ResponseWriter, r *http.Request) {
	issues := []DataQualityIssue{
		{
			ID:           "issue-1",
			EmployeeID:   "EMP-1088",
			EmployeeName: "Bob Smith",
			Department:   "Design",
			IssueType:    "MISSING_MANAGER",
			Severity:     "HIGH",
			Description:  "Reporting manager not assigned in org chart",
			FixUrl:       "/employees/EMP-1088",
		},
		{
			ID:           "issue-2",
			EmployeeID:   "EMP-1090",
			EmployeeName: "Carol Danvers",
			Department:   "Product",
			IssueType:    "MISSING_PAN",
			Severity:     "HIGH",
			Description:  "PAN Card details missing for statutory TDS calculation",
			FixUrl:       "/employees/EMP-1090",
		},
		{
			ID:           "issue-3",
			EmployeeID:   "EMP-1024",
			EmployeeName: "Alice Walker",
			Department:   "Engineering",
			IssueType:    "MISSING_SHIFT",
			Severity:     "MEDIUM",
			Description:  "Work shift policy default fallback active",
			FixUrl:       "/employees/EMP-1024",
		},
		{
			ID:           "issue-4",
			EmployeeID:   "EMP-1010",
			EmployeeName: "David Miller",
			Department:   "Sales",
			IssueType:    "MISSING_BANK",
			Severity:     "HIGH",
			Description:  "Bank IFSC & Account Number pending verification",
			FixUrl:       "/employees/EMP-1010",
		},
		{
			ID:           "issue-5",
			EmployeeID:   "EMP-1095",
			EmployeeName: "Eva Green",
			Department:   "Finance",
			IssueType:    "DUPLICATE_EMAIL",
			Severity:     "HIGH",
			Description:  "Corporate email conflicts with secondary alias record",
			FixUrl:       "/employees/EMP-1095",
		},
	}

	summary := DataQualitySummary{
		HealthScore:         94,
		TotalEmployees:      128,
		CleanRecordCount:    123,
		TotalIssuesCount:    5,
		MissingManagerCount: 1,
		MissingBankPanCount: 2,
		MissingShiftCount:   1,
		DuplicateEmailCount: 1,
		MissingDocsCount:    0,
		Issues:              issues,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    summary,
	})
}

func (s *Service) HandleExportReport(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.CanExportReports(claims) {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only HR/Payroll Administrators can export organizational reports.")
		return
	}

	reportType := r.URL.Query().Get("type")
	format := r.URL.Query().Get("format") // csv or json

	if reportType == "" {
		reportType = "headcount"
	}

	if format == "csv" {
		w.Header().Set("Content-Type", "text/csv")
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment;filename=%s_report_%d.csv", reportType, time.Now().Unix()))

		b := &bytes.Buffer{}
		writer := csv.NewWriter(b)

		switch reportType {
		case "headcount":
			writer.Write([]string{"Employee ID", "Name", "Department", "Designation", "Joining Date", "Status"})
			writer.Write([]string{"EMP-1024", "Alice Walker", "Engineering", "Senior Engineer", "2024-01-15", "ACTIVE"})
			writer.Write([]string{"EMP-1088", "Bob Smith", "Design", "UI Lead", "2024-03-01", "ACTIVE"})
			writer.Write([]string{"EMP-1090", "Carol Danvers", "Product", "Product Manager", "2024-05-10", "ACTIVE"})
		case "payroll":
			writer.Write([]string{"Employee ID", "Name", "Basic Pay", "HRA", "Gross Pay", "Deductions", "Net Disbursed"})
			writer.Write([]string{"EMP-1024", "Alice Walker", "45000", "22500", "80000", "10200", "69800"})
			writer.Write([]string{"EMP-1088", "Bob Smith", "40000", "20000", "70000", "6833", "63167"})
		case "attendance":
			writer.Write([]string{"Employee ID", "Name", "Total Days", "Present", "Absent", "LOP Days", "OT Hours"})
			writer.Write([]string{"EMP-1024", "Alice Walker", "31", "22", "0", "0", "4.5"})
			writer.Write([]string{"EMP-1088", "Bob Smith", "31", "20", "2", "1.0", "0.0"})
		default:
			writer.Write([]string{"Field 1", "Field 2", "Field 3"})
			writer.Write([]string{"Data 1", "Data 2", "Data 3"})
		}

		writer.Flush()
		w.Write(b.Bytes())
		return
	}

	// JSON response for standard reports dashboard
	reportsMap := map[string]interface{}{
		"report_type": reportType,
		"generated_at": time.Now(),
		"total_records": 128,
		"columns": []string{"Employee ID", "Name", "Department", "Designation", "Joining Date", "Status"},
		"rows": []map[string]interface{}{
			{"employee_id": "EMP-1024", "name": "Alice Walker", "department": "Engineering", "designation": "Senior Engineer", "joining_date": "2024-01-15", "status": "ACTIVE"},
			{"employee_id": "EMP-1088", "name": "Bob Smith", "department": "Design", "designation": "UI Lead", "joining_date": "2024-03-01", "status": "ACTIVE"},
			{"employee_id": "EMP-1090", "name": "Carol Danvers", "department": "Product", "designation": "Product Manager", "joining_date": "2024-05-10", "status": "ACTIVE"},
			{"employee_id": "EMP-1010", "name": "David Miller", "department": "Sales", "designation": "Sales Executive", "joining_date": "2024-06-01", "status": "CONFIRMED"},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    reportsMap,
	})
}
