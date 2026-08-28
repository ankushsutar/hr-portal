package audit

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type LogEntry struct {
	UserID      string
	Action      string
	Module      string
	EntityName  string
	EntityID    string
	BeforeState map[string]interface{}
	AfterState  map[string]interface{}
	IPAddress   string
	UserAgent   string
	Reason      string
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) LogAction(ctx context.Context, entry LogEntry) error {
	beforeJSON, _ := json.Marshal(entry.BeforeState)
	afterJSON, _ := json.Marshal(entry.AfterState)

	query := `
		INSERT INTO audit_logs (
			user_id, action, module, entity_name, entity_id, 
			before_state, after_state, ip_address, user_agent, reason, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	_, err := s.db.Exec(ctx, query,
		entry.UserID, entry.Action, entry.Module, entry.EntityName, entry.EntityID,
		beforeJSON, afterJSON, entry.IPAddress, entry.UserAgent, entry.Reason, time.Now(),
	)

	if err != nil {
		return fmt.Errorf("failed to write audit log: %w", err)
	}
	return nil
}
