package reports

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DashboardData struct {
	TotalEmployees   int `json:"total_employees"`
	OpenJobs         int `json:"open_jobs"`
	PendingApprovals int `json:"pending_approvals"`
	TotalPayroll     int `json:"total_payroll"`
	HeadcountData    []HeadcountStat `json:"headcount_data"`
	AttritionData    []AttritionStat `json:"attrition_data"`
}

type HeadcountStat struct {
	Department string `json:"name"`
	Count      int    `json:"count"`
}

type AttritionStat struct {
	Month     string `json:"name"`
	Hired     int    `json:"hired"`
	Attrition int    `json:"attrition"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/dashboard", s.HandleGetDashboardData)
}

func (s *Service) HandleGetDashboardData(w http.ResponseWriter, r *http.Request) {
	// Mock aggregated data for the dashboard
	data := DashboardData{
		TotalEmployees:   142,
		OpenJobs:         12,
		PendingApprovals: 8,
		TotalPayroll:     8500000,
		HeadcountData: []HeadcountStat{
			{Department: "Engineering", Count: 65},
			{Department: "Product", Count: 20},
			{Department: "Sales", Count: 35},
			{Department: "HR", Count: 12},
			{Department: "Finance", Count: 10},
		},
		AttritionData: []AttritionStat{
			{Month: "Jan", Hired: 12, Attrition: 2},
			{Month: "Feb", Hired: 8, Attrition: 1},
			{Month: "Mar", Hired: 15, Attrition: 3},
			{Month: "Apr", Hired: 10, Attrition: 4},
			{Month: "May", Hired: 5, Attrition: 2},
			{Month: "Jun", Hired: 18, Attrition: 1},
			{Month: "Jul", Hired: 20, Attrition: 3},
			{Month: "Aug", Hired: 14, Attrition: 2},
		},
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true, 
		"data":    data,
	})
}
