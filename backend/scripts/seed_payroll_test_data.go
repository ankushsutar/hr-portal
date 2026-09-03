package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	monthFlag := flag.Int("month", int(time.Now().Month()), "Payroll month (1-12)")
	yearFlag := flag.Int("year", time.Now().Year(), "Payroll year")
	resetFlag := flag.Bool("reset", false, "Reset payroll test data for month/year")
	unvalidateFlag := flag.Bool("pending-attendance", false, "Set pending attendance on TEST_EMP_037 to test readiness block")
	flag.Parse()

	month := *monthFlag
	year := *yearFlag

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://hrms_user:hrms_password@localhost:5433/hrms_db?sslmode=disable"
	}

	ctx := context.Background()
	db, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer db.Close()

	fmt.Printf("========================================\n")
	fmt.Printf("  SEEDING PAYROLL TEST DATA (%02d/%d)  \n", month, year)
	fmt.Printf("========================================\n")

	if *resetFlag {
		fmt.Println("Resetting payroll runs, payslips, advances, and attendance for target period...")
		_, _ = db.Exec(ctx, "DELETE FROM payslips WHERE payroll_run_id IN (SELECT id FROM payroll_runs WHERE month = $1 AND year = $2)", month, year)
		_, _ = db.Exec(ctx, "DELETE FROM payroll_runs WHERE month = $1 AND year = $2", month, year)
		_, _ = db.Exec(ctx, "DELETE FROM payroll_advances WHERE deduct_from_month = $1 AND deduct_from_year = $2", month, year)
		_, _ = db.Exec(ctx, "DELETE FROM attendance_daily_status WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2", month, year)
	}

	// 1. Ensure all active employees have active salary structures
	rows, err := db.Query(ctx, `
		SELECT id::text, employee_id FROM employees 
		WHERE status = 'ACTIVE' AND deleted_at IS NULL
		ORDER BY employee_id ASC
	`)
	if err != nil {
		log.Fatalf("Failed to query employees: %v", err)
	}
	defer rows.Close()

	type empInfo struct {
		ID   string
		Code string
	}
	var employees []empInfo
	for rows.Next() {
		var e empInfo
		if err := rows.Scan(&e.ID, &e.Code); err == nil {
			employees = append(employees, e)
		}
	}
	rows.Close()

	if len(employees) == 0 {
		log.Fatalf("No active employees found! Run scripts/seed-50-employees.sh first.")
	}

	fmt.Printf("Found %d active employees. Seeding salary structures...\n", len(employees))

	salaryConfigured := 0
	for i, emp := range employees {
		baseSalary := 50000.0
		if i >= 10 && i < 20 {
			baseSalary = 75000.0
		} else if i >= 20 && i < 30 {
			baseSalary = 100000.0
		} else if i >= 30 && i < 40 {
			baseSalary = 120000.0
		} else if i >= 40 {
			baseSalary = 150000.0
		}

		var structID string
		err := db.QueryRow(ctx, `
			INSERT INTO employee_salary_structures (employee_id, currency_code, base_salary, effective_from, is_active)
			VALUES ($1::uuid, 'INR', $2, CURRENT_DATE, true)
			ON CONFLICT DO NOTHING
			RETURNING id::text
		`, emp.ID, baseSalary).Scan(&structID)

		if err != nil || structID == "" {
			_ = db.QueryRow(ctx, "SELECT id::text FROM employee_salary_structures WHERE employee_id = $1::uuid AND is_active = true", emp.ID).Scan(&structID)
		}
		salaryConfigured++
	}
	fmt.Printf("Configured salary structures for %d employees.\n", salaryConfigured)

	// 2. Seed Attendance Daily Status & Validation for Target Month
	daysInMonth := 30
	if month == 2 {
		daysInMonth = 28
	} else if month == 4 || month == 6 || month == 9 || month == 11 {
		daysInMonth = 30
	} else {
		daysInMonth = 31
	}

	fmt.Printf("Seeding daily attendance records for period %02d/%d (%d days)...\n", month, year, daysInMonth)

	var orgID string
	_ = db.QueryRow(ctx, "SELECT id FROM organizations LIMIT 1").Scan(&orgID)

	attendanceCreated := 0
	lopCreated := 0
	leaveCreated := 0
	advancesCreated := 0

	for i, emp := range employees {
		for d := 1; d <= daysInMonth; d++ {
			attDate := time.Date(year, time.Month(month), d, 0, 0, 0, 0, time.UTC)
			
			// Weekend check
			if attDate.Weekday() == time.Saturday || attDate.Weekday() == time.Sunday {
				_, _ = db.Exec(ctx, `
					INSERT INTO attendance_daily_status (employee_id, date, status, validation_status)
					VALUES ($1::uuid, $2, 'WEEKEND', 'VALIDATED')
					ON CONFLICT (employee_id, date) DO NOTHING
				`, emp.ID, attDate)
				attendanceCreated++
				continue
			}

			status := "PRESENT"
			valStatus := "VALIDATED"

			// Scenario Group B (Employees 26..35 - Approved Leave on day 10 & 11)
			if i >= 25 && i < 35 && (d == 10 || d == 11) {
				status = "ON_LEAVE"
				valStatus = "VALIDATED"
				if d == 10 {
					leaveCreated++
				}
			}

			// Scenario Group C (Employees 36..42 - LOP / Unapproved Absence on day 15 & 16)
			if i >= 35 && i < 42 && (d == 15 || d == 16) {
				status = "ABSENT"
				valStatus = "VALIDATED"
				if d == 15 {
					lopCreated++
				}
			}

			// Unvalidated attendance override flag for testing readiness block (day 22 is Tuesday)
			if *unvalidateFlag && emp.Code == "TEST_EMP_037" && d == 22 {
				valStatus = "TO_VALIDATE"
			}

			_, err := db.Exec(ctx, `
				INSERT INTO attendance_daily_status (employee_id, date, status, validation_status)
				VALUES ($1::uuid, $2, $3, $4)
				ON CONFLICT (employee_id, date) DO UPDATE SET
					status = EXCLUDED.status,
					validation_status = EXCLUDED.validation_status
			`, emp.ID, attDate, status, valStatus)
			if err != nil {
				log.Printf("Failed to insert attendance for %s on %v: %v", emp.Code, attDate, err)
			}
			attendanceCreated++
		}

		// Scenario Group D (Employees 43..47 - Salary Advances)
		if i >= 42 && i < 47 {
			advanceAmount := 15000.0
			_, err := db.Exec(ctx, `
				INSERT INTO payroll_advances (employee_id, amount, recovery_months, reason, deduct_from_month, deduct_from_year, status)
				VALUES ($1::uuid, $2, 1, 'Festival Advance', $3, $4, 'APPROVED')
				ON CONFLICT DO NOTHING
			`, emp.ID, advanceAmount, month, year)
			if err == nil {
				advancesCreated++
			}
		}
	}

	fmt.Printf("Created/Updated %d daily attendance records.\n", attendanceCreated)
	fmt.Printf("Scenarios: %d employees with Approved Leave, %d employees with LOP, %d employees with Salary Advances.\n", leaveCreated, lopCreated, advancesCreated)
	if *unvalidateFlag {
		fmt.Printf("WARNING: Intentionally marked TEST_EMP_037 attendance on day 20 as 'TO_VALIDATE' for testing readiness block.\n")
	}

	fmt.Printf("========================================\n")
	fmt.Printf("  PAYROLL TEST DATA SEED COMPLETE       \n")
	fmt.Printf("========================================\n")
}
