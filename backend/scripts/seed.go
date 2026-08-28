package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://hrms_user:hrms_password@localhost:5432/hrms_db?sslmode=disable"
	}

	db, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer db.Close()

	users := []struct {
		email    string
		password string
		role     string
	}{
		{"admin@company.com", "admin123", "SUPER_ADMIN"},
		{"hr@company.com", "hr123", "HR_ADMIN"},
		{"employee@company.com", "emp123", "EMPLOYEE"},
	}

	for _, u := range users {
		hash, _ := bcrypt.GenerateFromPassword([]byte(u.password), bcrypt.DefaultCost)
		
		var userID string
		err := db.QueryRow(context.Background(), `
			INSERT INTO users (email, password_hash)
			VALUES ($1, $2)
			ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
			RETURNING id
		`, u.email, string(hash)).Scan(&userID)
		
		if err != nil {
			log.Printf("Error inserting user %s: %v\n", u.email, err)
			continue
		}

		// Ensure role exists
		var roleID string
		err = db.QueryRow(context.Background(), `
			INSERT INTO roles (name) VALUES ($1)
			ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
			RETURNING id
		`, u.role).Scan(&roleID)

		if err != nil {
			log.Printf("Error inserting role %s: %v\n", u.role, err)
			continue
		}

		// Assign role
		_, err = db.Exec(context.Background(), `
			INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)
			ON CONFLICT DO NOTHING
		`, userID, roleID)

		if err != nil {
			log.Printf("Error assigning role to user %s: %v\n", u.email, err)
		}
		fmt.Printf("Seeded user %s\n", u.email)
	}
}
