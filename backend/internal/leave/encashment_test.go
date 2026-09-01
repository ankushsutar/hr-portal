package leave_test

import (
	"math"
	"testing"

	"github.com/company/hrms-backend/internal/leave"
)

func TestCalculateEncashmentAmount(t *testing.T) {
	// Monthly gross salary: 60,000 INR
	// Daily rate = 60,000 / 30 = 2,000 INR
	// 5 days encashment = 10,000 INR

	days := 5.0
	monthlyGross := 60000.0

	perDay, total := leave.CalculateEncashmentAmount(days, monthlyGross)

	if math.Abs(perDay-2000.0) > 0.01 {
		t.Errorf("Expected per day rate 2000.00, got %.2f", perDay)
	}

	if math.Abs(total-10000.0) > 0.01 {
		t.Errorf("Expected total encashment amount 10000.00, got %.2f", total)
	}

	// Zero input edge cases
	p0, t0 := leave.CalculateEncashmentAmount(0, monthlyGross)
	if p0 != 0 || t0 != 0 {
		t.Errorf("Expected zero payout for 0 days")
	}
}

func TestProcessMultiLevelApproval(t *testing.T) {
	// Scenario 1: Level 1 approval out of 2 levels -> Advance to Level 2, remain PENDING
	nextLvl, status := leave.ProcessMultiLevelApproval(1, 2, "APPROVE")
	if nextLvl != 2 || status != "PENDING" {
		t.Errorf("Expected Level 2 PENDING, got Level %d %s", nextLvl, status)
	}

	// Scenario 2: Level 2 approval out of 2 levels -> Final APPROVED
	nextLvl2, status2 := leave.ProcessMultiLevelApproval(2, 2, "APPROVE")
	if nextLvl2 != 2 || status2 != "APPROVED" {
		t.Errorf("Expected Level 2 APPROVED, got Level %d %s", nextLvl2, status2)
	}

	// Scenario 3: Rejection at Level 1 -> Final REJECTED
	_, status3 := leave.ProcessMultiLevelApproval(1, 2, "REJECT")
	if status3 != "REJECTED" {
		t.Errorf("Expected REJECTED, got %s", status3)
	}
}
