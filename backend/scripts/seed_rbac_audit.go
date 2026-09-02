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
		dbURL = "postgres://hrms_user:@127.0.0.1:5433/hrms_db?sslmode=disable"
	}

	ctx := context.Background()
	db, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}
	defer db.Close()

	fmt.Println("🚀 Seeding RBAC Audit synthetic users...")

	// 1. Roles
	roles := []string{"SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"}
	roleIDs := make(map[string]string)
	for _, r := range roles {
		var id string
		err := db.QueryRow(ctx, `
			INSERT INTO roles (name, description) VALUES ($1, $2)
			ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
			RETURNING id
		`, r, r+" Role").Scan(&id)
		if err != nil {
			log.Fatalf("Failed role %s: %v", r, err)
		}
		roleIDs[r] = id
	}

	// 2. Org & Dept
	var orgID, deptID string
	db.QueryRow(ctx, "INSERT INTO organizations (name, code) VALUES ('RBAC Audit Org', 'RBAC_ORG') ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name RETURNING id").Scan(&orgID)
	db.QueryRow(ctx, "INSERT INTO departments (organization_id, name, code) VALUES ($1, 'Audit Dept', 'RBAC_DEPT') ON CONFLICT (organization_id, code) DO UPDATE SET name=EXCLUDED.name RETURNING id", orgID).Scan(&deptID)

	// Helper to create user + employee
	createUser := func(email, pass, role, empID, first, last string, managerID *string) string {
		hash, _ := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
		var uid string
		
		// UPSERT User
		err = db.QueryRow(ctx, `
			INSERT INTO users (email, password_hash, is_active) VALUES ($1, $2, true)
			ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash 
			RETURNING id
		`, email, string(hash)).Scan(&uid)
		if err != nil {
			log.Fatalf("Failed user %s: %v", email, err)
		}

		// Delete existing role map then insert
		db.Exec(ctx, "DELETE FROM user_roles WHERE user_id = $1", uid)
		db.Exec(ctx, "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)", uid, roleIDs[role])

		// Delete existing employee to avoid conflict or upsert
		db.Exec(ctx, "DELETE FROM employees WHERE user_id = $1 OR employee_id = $2", uid, empID)

		var eid string
		err = db.QueryRow(ctx, `
			INSERT INTO employees (user_id, employee_id, first_name, last_name, department_id, manager_id, joining_date, status)
			VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, 'ACTIVE')
			RETURNING id
		`, uid, empID, first, last, deptID, managerID).Scan(&eid)
		if err != nil {
			log.Fatalf("Failed employee %s: %v", empID, err)
		}
		return eid
	}

	fmt.Println("Creating HR_ADMIN...")
	createUser("hr_admin_001@company.com", "pass123", "HR_ADMIN", "RBAC-HR001", "HR", "Admin", nil)

	fmt.Println("Creating Managers...")
	mgr1ID := createUser("manager_001@company.com", "pass123", "MANAGER", "RBAC-MGR001", "Manager", "One", nil)
	mgr2ID := createUser("manager_002@company.com", "pass123", "MANAGER", "RBAC-MGR002", "Manager", "Two", nil)

	fmt.Println("Creating Employees for Manager 1...")
	createUser("employee_001@company.com", "pass123", "EMPLOYEE", "RBAC-EMP001", "Employee", "One", &mgr1ID)
	createUser("employee_002@company.com", "pass123", "EMPLOYEE", "RBAC-EMP002", "Employee", "Two", &mgr1ID)
	createUser("employee_003@company.com", "pass123", "EMPLOYEE", "RBAC-EMP003", "Employee", "Three", &mgr1ID)

	fmt.Println("Creating Employees for Manager 2...")
	createUser("employee_004@company.com", "pass123", "EMPLOYEE", "RBAC-EMP004", "Employee", "Four", &mgr2ID)
	createUser("employee_005@company.com", "pass123", "EMPLOYEE", "RBAC-EMP005", "Employee", "Five", &mgr2ID)
	createUser("employee_006@company.com", "pass123", "EMPLOYEE", "RBAC-EMP006", "Employee", "Six", &mgr2ID)

	fmt.Println("✅ Done!")
}
