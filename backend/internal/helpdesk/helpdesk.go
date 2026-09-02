package helpdesk

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/company/hrms-backend/internal/audit"
	"github.com/company/hrms-backend/internal/auth"
	"github.com/company/hrms-backend/internal/authz"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type HelpdeskCategory struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	SLAHours    int    `json:"sla_hours"`
}

type HelpdeskTicket struct {
	ID              string `json:"id"`
	TicketNumber    string `json:"ticket_number"`
	EmployeeID      string `json:"employee_id"`
	EmployeeCode    string `json:"employee_code,omitempty"`
	EmployeeName    string `json:"employee_name,omitempty"`
	CategoryID      string `json:"category_id"`
	CategoryName    string `json:"category_name,omitempty"`
	Subject         string `json:"subject"`
	Description     string `json:"description"`
	Priority        string `json:"priority"` // LOW, MEDIUM, HIGH, URGENT
	Status          string `json:"status"`   // OPEN, IN_PROGRESS, RESOLVED, CLOSED
	AssignedTo      string `json:"assigned_to,omitempty"`
	AssignedToName  string `json:"assigned_to_name,omitempty"`
	SLAHours        int    `json:"sla_hours"`
	IsSLABreached   bool   `json:"is_sla_breached"`
	ResolvedAt      string `json:"resolved_at,omitempty"`
	ResolutionNotes string `json:"resolution_notes,omitempty"`
	CreatedAt       string `json:"created_at"`
	CommentsCount   int    `json:"comments_count"`
}

type TicketComment struct {
	ID        string `json:"id"`
	TicketID  string `json:"ticket_id"`
	UserID    string `json:"user_id"`
	UserName  string `json:"user_name,omitempty"`
	UserRole  string `json:"user_role,omitempty"`
	Comment   string `json:"comment"`
	CreatedAt string `json:"created_at"`
}

type Service struct {
	db           *pgxpool.Pool
	auditService *audit.Service
}

func NewService(db *pgxpool.Pool, auditService *audit.Service) *Service {
	return &Service{db: db, auditService: auditService}
}

// GenerateTicketNumber formats sequence ID into standard ticket number
func GenerateTicketNumber(seq int) string {
	return fmt.Sprintf("TICK-%d-%03d", time.Now().Year(), seq)
}

// EvaluateSLABreach checks whether a ticket exceeds category SLA target hours
func EvaluateSLABreach(createdAt time.Time, slaHours int, status string) bool {
	if status == "RESOLVED" || status == "CLOSED" {
		return false
	}
	if slaHours <= 0 {
		return false
	}
	deadline := createdAt.Add(time.Duration(slaHours) * time.Hour)
	return time.Now().After(deadline)
}

// ProcessTicketTransition updates ticket status state machine
func ProcessTicketTransition(currentStatus string, action string) string {
	switch action {
	case "ASSIGN", "START_PROGRESS":
		return "IN_PROGRESS"
	case "RESOLVE":
		return "RESOLVED"
	case "CLOSE":
		return "CLOSED"
	case "REOPEN":
		return "OPEN"
	default:
		return currentStatus
	}
}

func (s *Service) RegisterRoutes(r chi.Router) {
	r.Get("/categories", s.HandleGetCategories)
	r.Post("/categories", s.HandleCreateCategory)
	r.Get("/tickets", s.HandleGetTickets)
	r.Post("/tickets", s.HandleCreateTicket)
	r.Get("/tickets/{id}", s.HandleGetTicketDetails)
	r.Post("/tickets/{id}/comments", s.HandleAddComment)
	r.Post("/tickets/{id}/transition", s.HandleTransitionTicket)
}

func (s *Service) HandleGetCategories(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	rows, err := s.db.Query(r.Context(), `SELECT id::text, name, COALESCE(description, ''), sla_hours FROM helpdesk_categories ORDER BY name ASC`)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	var items []HelpdeskCategory
	for rows.Next() {
		var item HelpdeskCategory
		if err := rows.Scan(&item.ID, &item.Name, &item.Description, &item.SLAHours); err == nil {
			items = append(items, item)
		}
	}
	if items == nil {
		items = []HelpdeskCategory{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": items})
}

func (s *Service) HandleCreateCategory(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN") {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only HR and Super Admins can manage helpdesk categories.")
		return
	}

	var req HelpdeskCategory
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		http.Error(w, "invalid category payload", http.StatusBadRequest)
		return
	}

	if req.SLAHours <= 0 {
		req.SLAHours = 24
	}

	if s.db != nil {
		var id string
		err := s.db.QueryRow(r.Context(), `
			INSERT INTO helpdesk_categories (name, description, sla_hours)
			VALUES ($1, $2, $3)
			RETURNING id::text
		`, req.Name, req.Description, req.SLAHours).Scan(&id)

		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
			return
		}

		req.ID = id
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Helpdesk category created successfully.",
		"data":    req,
	})
}

func (s *Service) HandleGetTickets(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	query := `
		SELECT t.id::text, t.ticket_number, t.employee_id::text, e.employee_id as employee_code,
		       e.first_name || ' ' || e.last_name as employee_name,
		       t.category_id::text, c.name as category_name, c.sla_hours,
		       t.subject, t.description, t.priority, t.status,
		       COALESCE(t.assigned_to::text, '') as assigned_to,
		       COALESCE(u.email, '') as assigned_to_name,
		       COALESCE(to_char(t.resolved_at, 'YYYY-MM-DD HH24:MI:SS'), '') as resolved_at,
		       COALESCE(t.resolution_notes, '') as resolution_notes,
		       t.created_at,
		       (SELECT COUNT(*) FROM helpdesk_ticket_comments cm WHERE cm.ticket_id = t.id) as comments_count
		FROM helpdesk_tickets t
		JOIN employees e ON t.employee_id = e.id
		JOIN helpdesk_categories c ON t.category_id = c.id
		LEFT JOIN users u ON t.assigned_to = u.id
		ORDER BY t.created_at DESC
	`

	rows, err := s.db.Query(r.Context(), query)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	var items []HelpdeskTicket
	for rows.Next() {
		var item HelpdeskTicket
		var createdAtTime time.Time

		if err := rows.Scan(
			&item.ID, &item.TicketNumber, &item.EmployeeID, &item.EmployeeCode, &item.EmployeeName,
			&item.CategoryID, &item.CategoryName, &item.SLAHours,
			&item.Subject, &item.Description, &item.Priority, &item.Status,
			&item.AssignedTo, &item.AssignedToName, &item.ResolvedAt, &item.ResolutionNotes,
			&createdAtTime, &item.CommentsCount,
		); err == nil {
			item.CreatedAt = createdAtTime.Format("2006-01-02 15:04:05")
			item.IsSLABreached = EvaluateSLABreach(createdAtTime, item.SLAHours, item.Status)
			items = append(items, item)
		}
	}
	if items == nil {
		items = []HelpdeskTicket{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": items})
}

func (s *Service) HandleCreateTicket(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req HelpdeskTicket
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.CategoryID == "" || req.Subject == "" || req.Description == "" {
		http.Error(w, "invalid ticket payload", http.StatusBadRequest)
		return
	}

	if req.Priority == "" {
		req.Priority = "MEDIUM"
	}

	if s.db != nil {
		// Fetch employee ID for logged in user
		var empID string
		_ = s.db.QueryRow(r.Context(), `SELECT id::text FROM employees WHERE user_id::text = $1 LIMIT 1`, claims.UserID).Scan(&empID)
		if empID == "" {
			_ = s.db.QueryRow(r.Context(), `SELECT id::text FROM employees LIMIT 1`).Scan(&empID)
		}

		// Count existing tickets for number sequence
		var count int
		_ = s.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM helpdesk_tickets`).Scan(&count)
		ticketNum := GenerateTicketNumber(count + 1)

		var id string
		err := s.db.QueryRow(r.Context(), `
			INSERT INTO helpdesk_tickets (
				ticket_number, employee_id, category_id, subject, description, priority, status
			) VALUES (
				$1, $2::uuid, $3::uuid, $4, $5, $6, 'OPEN'
			) RETURNING id::text
		`, ticketNum, empID, req.CategoryID, req.Subject, req.Description, req.Priority).Scan(&id)

		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
			return
		}

		req.ID = id
		req.TicketNumber = ticketNum
		req.EmployeeID = empID
		req.Status = "OPEN"
		req.CreatedAt = time.Now().Format("2006-01-02 15:04:05")

		if s.auditService != nil {
			_ = s.auditService.LogAction(r.Context(), audit.LogEntry{
				UserID:     claims.UserID,
				Action:     "HELPDESK_TICKET_SUBMITTED",
				Module:     "HELPDESK",
				EntityName: "helpdesk_tickets",
				EntityID:   id,
				Reason:     fmt.Sprintf("Submitted helpdesk ticket %s: %s", ticketNum, req.Subject),
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Helpdesk ticket %s submitted successfully.", req.TicketNumber),
		"data":    req,
	})
}

func (s *Service) HandleGetTicketDetails(w http.ResponseWriter, r *http.Request) {
	ticketID := chi.URLParam(r, "id")
	if ticketID == "" {
		http.Error(w, "missing ticket id", http.StatusBadRequest)
		return
	}

	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database connection unavailable"})
		return
	}

	var ticket HelpdeskTicket
	var createdAtTime time.Time

	err := s.db.QueryRow(r.Context(), `
		SELECT t.id::text, t.ticket_number, t.employee_id::text, e.employee_id as employee_code,
		       e.first_name || ' ' || e.last_name as employee_name,
		       t.category_id::text, c.name as category_name, c.sla_hours,
		       t.subject, t.description, t.priority, t.status,
		       COALESCE(t.assigned_to::text, '') as assigned_to,
		       COALESCE(u.email, '') as assigned_to_name,
		       COALESCE(to_char(t.resolved_at, 'YYYY-MM-DD HH24:MI:SS'), '') as resolved_at,
		       COALESCE(t.resolution_notes, '') as resolution_notes,
		       t.created_at
		FROM helpdesk_tickets t
		JOIN employees e ON t.employee_id = e.id
		JOIN helpdesk_categories c ON t.category_id = c.id
		LEFT JOIN users u ON t.assigned_to = u.id
		WHERE t.id = $1::uuid
	`, ticketID).Scan(
		&ticket.ID, &ticket.TicketNumber, &ticket.EmployeeID, &ticket.EmployeeCode, &ticket.EmployeeName,
		&ticket.CategoryID, &ticket.CategoryName, &ticket.SLAHours,
		&ticket.Subject, &ticket.Description, &ticket.Priority, &ticket.Status,
		&ticket.AssignedTo, &ticket.AssignedToName, &ticket.ResolvedAt, &ticket.ResolutionNotes,
		&createdAtTime,
	)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "ticket not found"})
		return
	}

	ticket.CreatedAt = createdAtTime.Format("2006-01-02 15:04:05")
	ticket.IsSLABreached = EvaluateSLABreach(createdAtTime, ticket.SLAHours, ticket.Status)

	// Fetch Comments
	commentRows, _ := s.db.Query(r.Context(), `
		SELECT cm.id::text, cm.ticket_id::text, cm.user_id::text, u.email as user_name,
		       COALESCE(u.role, 'USER') as user_role, cm.comment,
		       to_char(cm.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
		FROM helpdesk_ticket_comments cm
		JOIN users u ON cm.user_id = u.id
		WHERE cm.ticket_id = $1::uuid
		ORDER BY cm.created_at ASC
	`, ticketID)

	var comments []TicketComment
	if commentRows != nil {
		defer commentRows.Close()
		for commentRows.Next() {
			var c TicketComment
			if err := commentRows.Scan(&c.ID, &c.TicketID, &c.UserID, &c.UserName, &c.UserRole, &c.Comment, &c.CreatedAt); err == nil {
				comments = append(comments, c)
			}
		}
	}
	if comments == nil {
		comments = []TicketComment{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"ticket":   ticket,
		"comments": comments,
	})
}

func (s *Service) HandleAddComment(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	ticketID := chi.URLParam(r, "id")
	var req struct {
		Comment string `json:"comment"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Comment == "" {
		http.Error(w, "invalid comment payload", http.StatusBadRequest)
		return
	}

	if s.db != nil {
		var id string
		err := s.db.QueryRow(r.Context(), `
			INSERT INTO helpdesk_ticket_comments (ticket_id, user_id, comment)
			VALUES ($1::uuid, $2::uuid, $3)
			RETURNING id::text
		`, ticketID, claims.UserID, req.Comment).Scan(&id)

		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Comment posted to helpdesk ticket.",
	})
}

func (s *Service) HandleTransitionTicket(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN") {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only HR and Support Admins can update ticket status.")
		return
	}

	ticketID := chi.URLParam(r, "id")
	var req struct {
		Action          string `json:"action"` // START_PROGRESS, RESOLVE, CLOSE, REOPEN
		ResolutionNotes string `json:"resolution_notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Action == "" {
		http.Error(w, "invalid transition payload", http.StatusBadRequest)
		return
	}

	if s.db != nil {
		var currentStatus string
		_ = s.db.QueryRow(r.Context(), `SELECT status FROM helpdesk_tickets WHERE id = $1::uuid`, ticketID).Scan(&currentStatus)

		targetStatus := ProcessTicketTransition(currentStatus, req.Action)

		if req.Action == "RESOLVE" || req.Action == "CLOSE" {
			_, _ = s.db.Exec(r.Context(), `
				UPDATE helpdesk_tickets
				SET status = $1, assigned_to = $2::uuid, resolved_at = NOW(), resolution_notes = $3, updated_at = NOW()
				WHERE id = $4::uuid
			`, targetStatus, claims.UserID, req.ResolutionNotes, ticketID)
		} else {
			_, _ = s.db.Exec(r.Context(), `
				UPDATE helpdesk_tickets
				SET status = $1, assigned_to = $2::uuid, updated_at = NOW()
				WHERE id = $3::uuid
			`, targetStatus, claims.UserID, ticketID)
		}

		if s.auditService != nil {
			_ = s.auditService.LogAction(r.Context(), audit.LogEntry{
				UserID:     claims.UserID,
				Action:     "HELPDESK_TICKET_TRANSITION",
				Module:     "HELPDESK",
				EntityName: "helpdesk_tickets",
				EntityID:   ticketID,
				Reason:     fmt.Sprintf("Ticket status transitioned to %s", targetStatus),
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Ticket status updated.",
	})
}
