package configuration

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ConfigEntry struct {
	ID            string
	Key           string
	Value         map[string]interface{}
	Description   string
	EffectiveFrom string
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) GetConfig(ctx context.Context, key string) (map[string]interface{}, error) {
	query := `
		SELECT config_value 
		FROM system_configurations 
		WHERE config_key = $1 
		  AND effective_from <= CURRENT_TIMESTAMP 
		ORDER BY effective_from DESC 
		LIMIT 1
	`
	
	var valueJSON []byte
	err := s.db.QueryRow(ctx, query, key).Scan(&valueJSON)
	if err != nil {
		return nil, fmt.Errorf("config %s not found: %w", key, err)
	}

	var value map[string]interface{}
	if err := json.Unmarshal(valueJSON, &value); err != nil {
		return nil, err
	}

	return value, nil
}
