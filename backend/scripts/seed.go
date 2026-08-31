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

	ctx := context.Background()
	log.Println("Starting Enterprise HRMS Demo Data Seeding...")

	// 1. Roles
	roles := []string{"SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"}
	roleIDs := make(map[string]string)
	for _, r := range roles {
		var id string
		err := db.QueryRow(ctx, `
			INSERT INTO roles (name) VALUES ($1)
			ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
			RETURNING id
		`, r).Scan(&id)
		if err != nil {
			log.Printf("Role insert error (%s): %v\n", r, err)
		} else {
			roleIDs[r] = id
		}
	}
	fmt.Println("✓ Seeded User Roles")

	// 2. Users
	users := []struct {
		email    string
		password string
		role     string
	}{
		{"admin@company.com", "password123", "SUPER_ADMIN"},
		{"hr@company.com", "password123", "HR_ADMIN"},
		{"manager@company.com", "password123", "MANAGER"},
		{"aarav@company.com", "password123", "EMPLOYEE"},
		{"priya@company.com", "password123", "EMPLOYEE"},
		{"vikram@company.com", "password123", "EMPLOYEE"},
		{"neha@company.com", "password123", "EMPLOYEE"},
	}

	userIDs := make(map[string]string)
	for _, u := range users {
		hash, _ := bcrypt.GenerateFromPassword([]byte(u.password), bcrypt.DefaultCost)
		var id string
		err := db.QueryRow(ctx, `
			INSERT INTO users (email, password_hash)
			VALUES ($1, $2)
			ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
			RETURNING id
		`, u.email, string(hash)).Scan(&id)

		if err == nil {
			userIDs[u.email] = id
			if rID, ok := roleIDs[u.role]; ok {
				db.Exec(ctx, `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, id, rID)
			}
		}
	}
	fmt.Println("✓ Seeded Demo User Credentials")

	// 3. Organization Locations, Departments, Designations
	locations := []struct {
		name, city, state, country string
	}{
		{"Mumbai HQ", "Mumbai", "Maharashtra", "India"},
		{"Bengaluru Tech Hub", "Bengaluru", "Karnataka", "India"},
		{"Hyderabad R&D Center", "Hyderabad", "Telangana", "India"},
		{"Delhi Regional Office", "New Delhi", "Delhi", "India"},
	}
	locIDs := []string{}
	for _, l := range locations {
		var id string
		err := db.QueryRow(ctx, `
			INSERT INTO locations (name, city, state, country) VALUES ($1, $2, $3, $4)
			ON CONFLICT DO NOTHING RETURNING id
		`, l.name, l.city, l.state, l.country).Scan(&id)
		if err == nil {
			locIDs = append(locIDs, id)
		}
	}

	departments := []string{"Engineering", "Product Management", "HR & People Ops", "Finance & Payroll", "Sales & Marketing"}
	deptIDs := []string{}
	for _, d := range departments {
		var id string
		err := db.QueryRow(ctx, `
			INSERT INTO departments (name) VALUES ($1)
			ON CONFLICT DO NOTHING RETURNING id
		`, d).Scan(&id)
		if err == nil {
			deptIDs = append(deptIDs, id)
		}
	}

	designations := []string{"VP of Engineering", "Lead System Architect", "Senior Fullstack Developer", "HR Business Partner", "Senior Payroll Specialist"}
	desigIDs := []string{}
	for _, d := range designations {
		var id string
		err := db.QueryRow(ctx, `
			INSERT INTO designations (name) VALUES ($1)
			ON CONFLICT DO NOTHING RETURNING id
		`, d).Scan(&id)
		if err == nil {
			desigIDs = append(desigIDs, id)
		}
	}
	fmt.Println("✓ Seeded Organization Hierarchy (Locations, Departments, Designations)")

	// 4. Employees
	employees := []struct {
		code, firstName, lastName, email, phone string
	}{
		{"EMP-001", "Aarav", "Sharma", "aarav@company.com", "+91 98765 43210"},
		{"EMP-002", "Priya", "Patel", "priya@company.com", "+91 98765 43211"},
		{"EMP-003", "Vikram", "Malhotra", "vikram@company.com", "+91 98765 43212"},
		{"EMP-004", "Neha", "Gupta", "neha@company.com", "+91 98765 43213"},
		{"EMP-005", "Rohan", "Verma", "rohan@company.com", "+91 98765 43214"},
	}

	for _, e := range employees {
		uID := userIDs[e.email]
		db.Exec(ctx, `
			INSERT INTO employees (employee_code, first_name, last_name, work_email, phone_number, joining_date, employment_type, status, user_id)
			VALUES ($1, $2, $3, $4, $5, '2025-01-15', 'FULL_TIME', 'ACTIVE', $6)
			ON CONFLICT (work_email) DO NOTHING
		`, e.code, e.firstName, e.lastName, e.email, e.phone, uID)
	}
	fmt.Println("✓ Seeded Employee Directory Profiles")

	// 5. Leave Types
	leaveTypes := []struct {
		name, code string
		days       int
	}{
		{"Casual Leave", "CL", 12},
		{"Sick Leave", "SL", 10},
		{"Earned Leave", "EL", 15},
		{"Maternity Leave", "ML", 180},
	}

	for _, lt := range leaveTypes {
		db.Exec(ctx, `
			INSERT INTO leave_types (name, code, default_days, is_paid)
			VALUES ($1, $2, $3, true)
			ON CONFLICT (code) DO NOTHING
		`, lt.name, lt.code, lt.days)
	}
	fmt.Println("✓ Seeded Leave Configuration & Types")

	// 6. Onboarding Templates
	db.Exec(ctx, `
		INSERT INTO onboarding_templates (title, description, is_default)
		VALUES ('Engineering Onboarding 2026', 'Standard onboarding checklist for technical team members', true)
		ON CONFLICT DO NOTHING
	`)
	fmt.Println("✓ Seeded Onboarding & Workflow Templates")

	// 7. Performance Cycles
	db.Exec(ctx, `
		INSERT INTO performance_cycles (title, start_date, end_date, status)
		VALUES ('FY26 Annual Performance Review', '2026-04-01', '2027-03-31', 'ACTIVE')
		ON CONFLICT DO NOTHING
	`)
	fmt.Println("✓ Seeded Performance Cycles & OKR Framework")

	fmt.Println("\n🎉 Demo data seeding complete! Ready for live demonstrations.")
}
