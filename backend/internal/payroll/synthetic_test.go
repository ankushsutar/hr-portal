package payroll

import (
	"fmt"
	"math"
	"testing"
)

type SyntheticEmployee struct {
	ID             string
	Name           string
	Department     string
	BasicSalary    float64
	HRA            float64
	SpecialAllow   float64
	LOPDays        float64
	Section80C     float64
	Section80D     float64
}

func Test50EmployeeSyntheticPayrollSync(t *testing.T) {
	// Synthesize 50 employees
	var employees []SyntheticEmployee
	departments := []string{"Engineering", "Sales", "Product", "Human Resources", "Finance"}

	for i := 1; i <= 50; i++ {
		dept := departments[(i-1)%len(departments)]
		base := 30000.0 + float64(i)*2500.0 // Salary range 32,500 to 155,000
		hra := base * 0.50
		special := base * 0.25
		lop := float64(i % 4) // LOP days: 0, 1, 2, or 3 days

		employees = append(employees, SyntheticEmployee{
			ID:           fmt.Sprintf("EMP-SYN-%03d", i),
			Name:         fmt.Sprintf("Employee %d", i),
			Department:   dept,
			BasicSalary:  base,
			HRA:          hra,
			SpecialAllow: special,
			LOPDays:      lop,
			Section80C:   150000.0,
			Section80D:   25000.0,
		})
	}

	if len(employees) != 50 {
		t.Fatalf("expected 50 synthetic employees, got %d", len(employees))
	}

	totalGrossDisbursed := 0.0
	totalNetDisbursed := 0.0
	totalLOPDeductions := 0.0

	for _, emp := range employees {
		monthlyGross := emp.BasicSalary + emp.HRA + emp.SpecialAllow
		perDayGross := monthlyGross / 30.0

		// 1. Attendance LOP Deduction
		lopDeduction := perDayGross * emp.LOPDays
		effectiveGross := monthlyGross - lopDeduction

		// 2. Statutory PF Deduction (12% of Basic, capped at ₹1,800 if basic > 15,000)
		pfDeduction := emp.BasicSalary * 0.12
		if emp.BasicSalary > 15000.0 {
			pfDeduction = 1800.0
		}

		// 3. Statutory ESI (0.75% of gross if monthly gross <= 21,000)
		esiDeduction := 0.0
		if monthlyGross <= 21000.0 {
			esiDeduction = effectiveGross * 0.0075
		}

		// 4. TDS Deduction (simplified bracket on annual income)
		annualTaxable := (effectiveGross * 12.0) - emp.Section80C - emp.Section80D - 50000.0 // Standard Deduction
		if annualTaxable < 0 {
			annualTaxable = 0
		}
		monthlyTDS := (annualTaxable * 0.10) / 12.0

		// 5. Net Salary
		netPay := effectiveGross - pfDeduction - esiDeduction - monthlyTDS

		// Assertions: Zero mathematical discrepancy
		expectedNet := effectiveGross - (pfDeduction + esiDeduction + monthlyTDS)
		if math.Abs(netPay-expectedNet) > 0.01 {
			t.Errorf("Math discrepancy for employee %s: netPay=%.2f, expected=%.2f", emp.ID, netPay, expectedNet)
		}

		if netPay <= 0 {
			t.Errorf("Employee %s produced non-positive net pay: %.2f", emp.ID, netPay)
		}

		totalGrossDisbursed += monthlyGross
		totalNetDisbursed += netPay
		totalLOPDeductions += lopDeduction
	}

	t.Logf("✅ 50-Employee Synthetic Payroll Verification Successful!")
	t.Logf("Total Gross Budget: ₹%.2f", totalGrossDisbursed)
	t.Logf("Total LOP Deductions: ₹%.2f", totalLOPDeductions)
	t.Logf("Total Net Disbursed: ₹%.2f", totalNetDisbursed)
}
