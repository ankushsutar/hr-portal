package payroll_test

import (
	"math"
	"testing"

	"github.com/company/hrms-backend/internal/payroll"
)

func TestConvertCurrency(t *testing.T) {
	// Base Currency: INR (rate 1.0)
	// Foreign Currency: USD (rate 0.012)
	inrRate := 1.0
	usdRate := 0.012

	// Convert 100 USD to INR
	inrAmount := payroll.ConvertCurrency(100.0, usdRate, inrRate)
	expectedInr := 8333.333333

	if math.Abs(inrAmount-expectedInr) > 0.01 {
		t.Errorf("Expected 100 USD to convert to ~8333.33 INR, got %.2f", inrAmount)
	}

	// Convert 10,000 INR to USD
	usdAmount := payroll.ConvertCurrency(10000.0, inrRate, usdRate)
	expectedUsd := 120.0

	if math.Abs(usdAmount-expectedUsd) > 0.01 {
		t.Errorf("Expected 10,000 INR to convert to 120 USD, got %.2f", usdAmount)
	}
}

func TestCalculateSalaryBreakdown(t *testing.T) {
	baseSalary := 100000.0
	breakdown := payroll.CalculateSalaryBreakdown(baseSalary, "INR", "₹")

	if breakdown.GrossEarnings != 100000.0 {
		t.Errorf("Expected Gross Earnings 100,000.00, got %.2f", breakdown.GrossEarnings)
	}

	// Verify Basic (50% = 50,000)
	if breakdown.Earnings[0].Amount != 50000.0 {
		t.Errorf("Expected Basic 50,000.00, got %.2f", breakdown.Earnings[0].Amount)
	}

	// Verify HRA (40% of Basic = 20,000)
	if breakdown.Earnings[1].Amount != 20000.0 {
		t.Errorf("Expected HRA 20,000.00, got %.2f", breakdown.Earnings[1].Amount)
	}

	// Verify Special Allowance (30,000)
	if breakdown.Earnings[2].Amount != 30000.0 {
		t.Errorf("Expected Special Allowance 30,000.00, got %.2f", breakdown.Earnings[2].Amount)
	}

	// Verify PF (12% of Basic = 6,000)
	if breakdown.Deductions[0].Amount != 6000.0 {
		t.Errorf("Expected PF 6,000.00, got %.2f", breakdown.Deductions[0].Amount)
	}

	// Verify Net Pay (100,000 Gross - 16,200 Deductions = 83,800)
	expectedNet := 100000.0 - (6000.0 + 10000.0 + 200.0)
	if math.Abs(breakdown.NetPay-expectedNet) > 0.01 {
		t.Errorf("Expected Net Pay %.2f, got %.2f", expectedNet, breakdown.NetPay)
	}
}
