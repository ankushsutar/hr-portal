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
		dbURL = "postgres://hrms_user:hrms_password@localhost:5433/hrms_db?sslmode=disable"
	}

	db, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer db.Close()
	ctx := context.Background()

	reset := false
	for _, arg := range os.Args {
		if arg == "--reset" {
			reset = true
		}
	}

	if reset {
		log.Println("Resetting HRMS_TEST namespace data...")
		db.Exec(ctx, "DELETE FROM users WHERE email LIKE '%@test.hrms.local'")
		db.Exec(ctx, "DELETE FROM employees WHERE work_email LIKE '%@test.hrms.local' OR employee_id LIKE 'TEST_EMP_%'")
	}

	// 1. Roles
	roleIDs := make(map[string]string)
	roles := []string{"SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"}
	for _, r := range roles {
		var id string
		db.QueryRow(ctx, "SELECT id FROM roles WHERE name = $1", r).Scan(&id)
		if id == "" {
		    db.QueryRow(ctx, "INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id", r).Scan(&id)
		}
		roleIDs[r] = id
	}

	// 2. Organization
	var orgID string
	err = db.QueryRow(ctx, "INSERT INTO organizations (name, code) VALUES ($1, $2) ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name RETURNING id", "Test Corp", "TESTCORP").Scan(&orgID)
	if err != nil { log.Fatalf("Organization: %v", err) }

	// 3. Locations
	locs := []string{"Mumbai", "Pune", "Bengaluru", "Hyderabad"}
	locIDs := []string{}
	for _, l := range locs {
		var id string
		db.QueryRow(ctx, "INSERT INTO locations (organization_id, name, city) VALUES ($1, $2, $2) ON CONFLICT DO NOTHING RETURNING id", orgID, l).Scan(&id)
		if id == "" {
			db.QueryRow(ctx, "SELECT id FROM locations WHERE organization_id = $1 AND name = $2", orgID, l).Scan(&id)
		}
		locIDs = append(locIDs, id)
	}

	// 4. Departments
	depts := []string{"Engineering", "Human Resources", "Finance", "Sales", "Marketing", "Operations", "IT Support", "Administration"}
	deptIDs := []string{}
	for i, d := range depts {
		var id string
		code := fmt.Sprintf("DEPT%02d", i)
		db.QueryRow(ctx, "INSERT INTO departments (organization_id, name, code) VALUES ($1, $2, $3) ON CONFLICT (organization_id, code) DO UPDATE SET name=EXCLUDED.name RETURNING id", orgID, d, code).Scan(&id)
		deptIDs = append(deptIDs, id)
	}

	// 5. Designations
	desigs := []string{"Intern", "Junior Executive", "Executive", "Senior Executive", "Team Lead", "Assistant Manager", "Manager", "Senior Manager"}
	desigIDs := []string{}
	for _, d := range desigs {
		var id string
		db.QueryRow(ctx, "INSERT INTO designations (organization_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id", orgID, d).Scan(&id)
		if id == "" {
			db.QueryRow(ctx, "SELECT id FROM designations WHERE organization_id = $1 AND name = $2", orgID, d).Scan(&id)
		}
		desigIDs = append(desigIDs, id)
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	passHash := string(hash)

	// Create Demo Preset Users
	demoPresets := []struct {
		email    string
		pass     string
		role     string
		empID    string
		fName    string
		lName    string
	}{
		{"admin@company.com", "admin123", "SUPER_ADMIN", "SYS_ADMIN", "System", "Admin"},
		{"hr@company.com", "hr123", "HR_ADMIN", "DEMO_HR", "Demo", "HR"},
		{"manager@company.com", "mgr123", "MANAGER", "DEMO_MGR", "Demo", "Manager"},
		{"employee@company.com", "emp123", "EMPLOYEE", "DEMO_EMP", "Demo", "Employee"},
	}

	for _, preset := range demoPresets {
		presetHash, _ := bcrypt.GenerateFromPassword([]byte(preset.pass), bcrypt.DefaultCost)
		var uID, eID string
		err = db.QueryRow(ctx, "INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash RETURNING id", preset.email, string(presetHash)).Scan(&uID)
		if err != nil { log.Fatalf("Demo user %s: %v", preset.email, err) }
		db.Exec(ctx, "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", uID, roleIDs[preset.role])
		err = db.QueryRow(ctx, "INSERT INTO employees (employee_id, first_name, last_name, user_id, department_id, status, joining_date) VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW()) ON CONFLICT (employee_id) DO UPDATE SET user_id=EXCLUDED.user_id RETURNING id", preset.empID, preset.fName, preset.lName, uID, deptIDs[0]).Scan(&eID)
		if err != nil { log.Fatalf("Demo employee %s: %v", preset.email, err) }
	}
	// Create HR Admin
	var hrUserID, hrEmpID string
	err = db.QueryRow(ctx, "INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash RETURNING id", "hr_admin@test.hrms.local", passHash).Scan(&hrUserID)
	if err != nil { log.Fatalf("HR user: %v", err) }
	db.Exec(ctx, "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", hrUserID, roleIDs["HR_ADMIN"])
	err = db.QueryRow(ctx, "INSERT INTO employees (employee_id, first_name, last_name, user_id, department_id, status, joining_date) VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW()) ON CONFLICT (employee_id) DO UPDATE SET user_id=EXCLUDED.user_id RETURNING id", "TEST_HR_01", "HR", "Admin", hrUserID, deptIDs[1]).Scan(&hrEmpID)
	if err != nil { log.Fatalf("HR employee: %v", err) }

	// Create 5 Managers
	var mgrEmpIDs []string
	for i := 1; i <= 5; i++ {
		email := fmt.Sprintf("manager_%02d@test.hrms.local", i)
		code := fmt.Sprintf("TEST_MGR_%02d", i)
		var uID, eID string
		err = db.QueryRow(ctx, "INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash RETURNING id", email, passHash).Scan(&uID)
		if err != nil { log.Fatalf("Mgr user %d: %v", i, err) }
		db.Exec(ctx, "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", uID, roleIDs["MANAGER"])
		err = db.QueryRow(ctx, "INSERT INTO employees (employee_id, first_name, last_name, user_id, department_id, location_id, designation_id, status, joining_date) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', NOW()) ON CONFLICT (employee_id) DO UPDATE SET user_id=EXCLUDED.user_id RETURNING id", code, "Manager", fmt.Sprintf("%d", i), uID, deptIDs[0], locIDs[0], desigIDs[6]).Scan(&eID)
		if err != nil { log.Fatalf("Mgr employee %d: %v", i, err) }
		mgrEmpIDs = append(mgrEmpIDs, eID)
	}

	// Create 50 Employees, distributed
	created := 0
	skipped := 0
	for i := 1; i <= 50; i++ {
		email := fmt.Sprintf("employee_%03d@test.hrms.local", i)
		code := fmt.Sprintf("TEST_EMP_%03d", i)
		var exists bool
		db.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM employees WHERE employee_id = $1)", code).Scan(&exists)
		if exists && !reset {
			skipped++
			continue
		}

		mgrID := mgrEmpIDs[(i-1)/10] // 10 per manager
		deptID := deptIDs[i%len(deptIDs)]
		locID := locIDs[i%len(locIDs)]
		desigID := desigIDs[i%len(desigIDs)]

		var uID string
		err = db.QueryRow(ctx, "INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash RETURNING id", email, passHash).Scan(&uID)
		if err != nil { log.Fatalf("Emp user %d: %v", i, err) }
		db.Exec(ctx, "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", uID, roleIDs["EMPLOYEE"])
		
		_, err = db.Exec(ctx, "INSERT INTO employees (employee_id, first_name, last_name, user_id, department_id, location_id, designation_id, manager_id, status, employment_type, joining_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', 'PERMANENT', NOW()) ON CONFLICT (employee_id) DO UPDATE SET user_id=EXCLUDED.user_id", code, "Test", fmt.Sprintf("Emp %d", i), uID, deptID, locID, desigID, mgrID)
		if err != nil { log.Fatalf("Emp employee %d: %v", i, err) }
		created++
	}

	fmt.Println("========================================")
	fmt.Println("HRMS TEST DATA SEED")
	fmt.Println("========================================")
	fmt.Printf("Employees: 50\n")
	fmt.Printf("Departments: %d\n", len(depts))
	fmt.Printf("Managers: 5\n")
	fmt.Printf("Locations: %d\n\n", len(locs))
	fmt.Printf("Created: %d\n", created)
	fmt.Printf("Skipped: %d\n", skipped)
	fmt.Println("Failed: 0")
	fmt.Println("========================================")
	fmt.Println("SEED COMPLETE")
	fmt.Println("========================================")
}
