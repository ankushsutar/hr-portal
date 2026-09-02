package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

func Seed50Employees() {
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

	fmt.Println("🌱 Seeding Database with 50 Persistent Employees & Complete Payroll Data...")

	// 1. Ensure Organization
	var orgID string
	err = db.QueryRow(ctx, `
		INSERT INTO organizations (name, code)
		VALUES ('Enterprise Corp', 'ENT_CORP')
		ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
		RETURNING id
	`).Scan(&orgID)
	if err != nil {
		log.Fatalf("Failed to create org: %v", err)
	}

	// 2. Roles
	roles := []string{"SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"}
	roleIDs := make(map[string]string)
	for _, r := range roles {
		var id string
		err := db.QueryRow(ctx, `
			INSERT INTO roles (name, description) VALUES ($1, $2)
			ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
			RETURNING id
		`, r, r+" Role").Scan(&id)
		if err == nil {
			roleIDs[r] = id
		}
	}
	fmt.Println("✓ Seeded Roles")

	// 3. Locations, Departments, Designations
	locs := []struct{ name, city, state, country string }{
		{"Bengaluru HQ", "Bengaluru", "Karnataka", "India"},
		{"Gurugram Office", "Gurugram", "Haryana", "India"},
		{"Mumbai Branch", "Mumbai", "Maharashtra", "India"},
		{"Hyderabad Tech Hub", "Hyderabad", "Telangana", "India"},
	}
	locIDs := make(map[string]string)
	for _, l := range locs {
		var id string
		err := db.QueryRow(ctx, `
			INSERT INTO locations (organization_id, name, city, state, country)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT DO NOTHING
			RETURNING id
		`, orgID, l.name, l.city, l.state, l.country).Scan(&id)
		if err != nil {
			db.QueryRow(ctx, `SELECT id FROM locations WHERE organization_id = $1 AND name = $2`, orgID, l.name).Scan(&id)
		}
		locIDs[l.name] = id
	}

	depts := []struct{ name, code string }{
		{"Engineering", "ENG"},
		{"Human Resources", "HR"},
		{"Sales & Business", "SALES"},
		{"Product Management", "PROD"},
		{"Finance & Operations", "FIN"},
	}
	deptIDs := make(map[string]string)
	for _, d := range depts {
		var id string
		err := db.QueryRow(ctx, `
			INSERT INTO departments (organization_id, name, code)
			VALUES ($1, $2, $3)
			ON CONFLICT (organization_id, code) DO UPDATE SET name = EXCLUDED.name
			RETURNING id
		`, orgID, d.name, d.code).Scan(&id)
		if err == nil {
			deptIDs[d.name] = id
		}
	}

	desigs := []string{
		"Staff Engineer", "Senior Fullstack Engineer", "Backend Developer", "QA Automation Lead", "DevOps Engineer",
		"HR Operations Manager", "Talent Acquisition Lead", "HR Business Partner", "Payroll Specialist",
		"Enterprise Account Exec", "Sales Development Rep", "Regional Sales Manager", "Customer Success Lead",
		"Senior Product Manager", "Product Owner", "UI/UX Designer", "Product Analyst",
		"Finance Controller", "Senior Accountant", "Operations Analyst", "Compliance Officer",
	}
	desigIDs := make(map[string]string)
	for _, d := range desigs {
		var id string
		err := db.QueryRow(ctx, `
			INSERT INTO designations (organization_id, name)
			VALUES ($1, $2)
			ON CONFLICT DO NOTHING
			RETURNING id
		`, orgID, d).Scan(&id)
		if err != nil {
			db.QueryRow(ctx, `SELECT id FROM designations WHERE organization_id = $1 AND name = $2`, orgID, d).Scan(&id)
		}
		desigIDs[d] = id
	}
	fmt.Println("✓ Seeded Organization Master Data")

	// 4. 50 Employees Data
	firstNames := []string{
		"Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Neha", "Rahul", "Kavya",
		"Siddharth", "Pooja", "Aditya", "Sneha", "Karan", "Riya", "Amit", "Divya",
		"Manish", "Isha", "Rajesh", "Tanvi", "Suresh", "Meera", "Deepak", "Anushka",
		"Nikhil", "Simran", "Alok", "Swati", "Gaurav", "Preeti", "Varun", "Shweta",
		"Yash", "Monika", "Tarun", "Nisha", "Harsh", "Rashmi", "Abhishek", "Sonam",
		"Arjun", "Komal", "Mayank", "Shalini", "Pranav", "Richa", "Saurabh", "Payal",
		"Vineet", "Bhavna",
	}

	lastNames := []string{
		"Sharma", "Verma", "Gupta", "Iyer", "Malhotra", "Patel", "Singh", "Reddy",
		"Joshi", "Deshmukh", "Kumar", "Chawla", "Mehta", "Bhasin", "Nair", "Saxena",
		"Rao", "Kapoor", "Bhat", "Shah", "Trivedi", "Dutta", "Mukherjee", "Roy",
		"Agarwal", "Bansal", "Choudhury", "Pillai", "Menon", "Kulkarni", "Shenoy", "Hegde",
		"Gowda", "Naidu", "Sen", "Das", "Biswas", "Mishra", "Pandey", "Tripathi",
		"Tiwari", "Shukla", "Dubey", "Yadav", "Chauhan", "Rathore", "Solanki", "Vaghela",
		"Jain", "Bhattacharya",
	}

	locationsList := []string{"Bengaluru HQ", "Gurugram Office", "Mumbai Branch", "Hyderabad Tech Hub"}
	deptList := []string{"Engineering", "Human Resources", "Sales & Business", "Product Management", "Finance & Operations"}

	corePasswords := map[string]string{
		"admin@company.com":    "admin123",
		"hr@company.com":       "hr123",
		"manager@company.com":   "mgr123",
		"employee@company.com":  "emp123",
	}
	coreRoles := map[string]string{
		"admin@company.com":    "SUPER_ADMIN",
		"hr@company.com":       "HR_ADMIN",
		"manager@company.com":   "MANAGER",
		"employee@company.com":  "EMPLOYEE",
	}

	empIDs := make([]string, 50)

	for i := 0; i < 50; i++ {
		fn := firstNames[i]
		ln := lastNames[i]
		empCode := fmt.Sprintf("EMP-%04d", 1001+i)

		email := fmt.Sprintf("%s.%s@company.com", strings.ToLower(fn), strings.ToLower(ln))
		pass := "password123"
		roleName := "EMPLOYEE"

		if i == 0 {
			email = "admin@company.com"
		} else if i == 1 {
			email = "hr@company.com"
		} else if i == 2 {
			email = "manager@company.com"
		} else if i == 3 {
			email = "employee@company.com"
		}

		if pwd, ok := corePasswords[email]; ok {
			pass = pwd
		}
		if rName, ok := coreRoles[email]; ok {
			roleName = rName
		}

		hash, _ := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
		var uID string
		err := db.QueryRow(ctx, `
			INSERT INTO users (email, password_hash)
			VALUES ($1, $2)
			ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
			RETURNING id
		`, email, string(hash)).Scan(&uID)
		if err != nil {
			db.QueryRow(ctx, `SELECT id FROM users WHERE email = $1`, email).Scan(&uID)
		}

		if rID, ok := roleIDs[roleName]; ok && uID != "" {
			db.Exec(ctx, `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, uID, rID)
		}

		dName := deptList[i%len(deptList)]
		desName := desigs[i%len(desigs)]
		lName := locationsList[i%len(locationsList)]

		dID := deptIDs[dName]
		desID := desigIDs[desName]
		lID := locIDs[lName]

		status := "ACTIVE"
		if i%7 == 0 {
			status = "PROBATION"
		} else if i%19 == 0 {
			status = "NOTICE_PERIOD"
		}

		empType := "PERMANENT"
		if i%11 == 0 {
			empType = "CONTRACT"
		}

		joinDate := fmt.Sprintf("2023-%02d-%02d", (i%12)+1, (i%25)+1)
		phone := fmt.Sprintf("+91 98765 %05d", 10000+i)

		var empID string
		err = db.QueryRow(ctx, `
			INSERT INTO employees (
				employee_id, first_name, last_name, joining_date, employment_type,
				status, user_id, department_id, designation_id, location_id,
				notice_period_days, nationality, work_phone
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 60, 'Indian', $11)
			ON CONFLICT (employee_id) DO UPDATE SET
				first_name = EXCLUDED.first_name,
				last_name = EXCLUDED.last_name,
				department_id = EXCLUDED.department_id,
				designation_id = EXCLUDED.designation_id,
				location_id = EXCLUDED.location_id,
				status = EXCLUDED.status
			RETURNING id
		`, empCode, fn, ln, joinDate, empType, status, uID, dID, desID, lID, phone).Scan(&empID)

		if err != nil {
			log.Printf("Employee error for %s (%s): %v", empCode, email, err)
			db.QueryRow(ctx, `SELECT id FROM employees WHERE employee_id = $1`, empCode).Scan(&empID)
		}
		empIDs[i] = empID
	}
	fmt.Println("✓ Seeded 50 Full Employees into `employees` table")

	// 5. Payroll Run & Payslips for August 2026
	var runID string
	err = db.QueryRow(ctx, `
		INSERT INTO payroll_runs (
			organization_id, month, year, status, total_lop_days, total_advances_deducted, variance_percentage, created_at
		) VALUES ($1, 8, 2026, 'PUBLISHED', 14.5, 75000.00, 1.8, $2)
		ON CONFLICT (organization_id, month, year) DO UPDATE SET status = 'PUBLISHED'
		RETURNING id
	`, orgID, time.Now()).Scan(&runID)
	if err != nil {
		log.Printf("Payroll run error: %v", err)
		db.QueryRow(ctx, `SELECT id FROM payroll_runs WHERE organization_id = $1 AND month = 8 AND year = 2026`, orgID).Scan(&runID)
	}

	for i := 0; i < 50; i++ {
		eID := empIDs[i]
		if eID == "" {
			continue
		}
		basic := float64(60000 + (i%5)*15000)
		hra := basic * 0.5
		special := basic * 0.25
		totalGross := basic + hra + special

		pf := basic * 0.12
		tds := totalGross * 0.10
		ptax := 200.0
		lop := 0.0
		if i%6 == 0 {
			lop = (totalGross / 30.0) * float64((i%3)+1)
		}
		totalDeductions := pf + tds + ptax + lop
		netPay := totalGross - totalDeductions

		db.Exec(ctx, `
			INSERT INTO payslips (
				payroll_run_id, employee_id, basic_pay, hra,
				total_earnings, total_deductions, net_pay, status
			) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PUBLISHED')
			ON CONFLICT (payroll_run_id, employee_id) DO UPDATE SET
				basic_pay = EXCLUDED.basic_pay,
				total_earnings = EXCLUDED.total_earnings,
				net_pay = EXCLUDED.net_pay
		`, runID, eID, basic, hra, totalGross, totalDeductions, netPay)
	}
	fmt.Println("✓ Seeded Payroll Runs & 50 Payslips into `payslips` table")

	// 6. Leave Types
	leaveTypes := []struct{ name, code string; days int }{
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
	fmt.Println("✓ Seeded Leave Types")

	fmt.Println("\n🎉 Database successfully populated with 50 persistent employees!")
}
