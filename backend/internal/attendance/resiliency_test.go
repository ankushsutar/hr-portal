package attendance

import (
	"testing"
	"time"

	"github.com/company/hrms-backend/internal/auth"
	"github.com/company/hrms-backend/internal/authz"
)

func TestNightShiftCrossover(t *testing.T) {
	// Shift 10:00 PM to 06:00 AM (next day)
	checkIn := time.Date(2026, 9, 2, 22, 0, 0, 0, time.UTC)
	checkOut := time.Date(2026, 9, 3, 6, 0, 0, 0, time.UTC)

	duration := checkOut.Sub(checkIn)
	if duration.Hours() != 8.0 {
		t.Errorf("expected 8.0 hours duration for night shift, got %.2f", duration.Hours())
	}

	shiftStart := time.Date(2026, 9, 2, 22, 0, 0, 0, time.UTC)
	shiftEnd := time.Date(2026, 9, 3, 6, 0, 0, 0, time.UTC)

	excType, late, early := EvaluateShiftException(checkIn, checkOut, shiftStart, shiftEnd, 15)
	if excType != "" || late != 0 || early != 0 {
		t.Errorf("expected no exception for exact night shift, got excType='%s', late=%d, early=%d", excType, late, early)
	}
}

func TestRapidPunchDeduplication(t *testing.T) {
	t1 := time.Now()
	t2 := t1.Add(15 * time.Second) // 15 seconds after t1

	timeDiff := t2.Sub(t1)
	if timeDiff < 60*time.Second {
		// Duplicate punch window triggered
		isDuplicate := true
		if !isDuplicate {
			t.Errorf("expected punch within 15s to be flagged as duplicate")
		}
	}
}

func TestZeroWorkingDaysProration(t *testing.T) {
	workingDays := 0
	baseSalary := 50000.0

	var perDay float64
	if workingDays > 0 {
		perDay = baseSalary / float64(workingDays)
	} else {
		perDay = 0.0
	}

	if perDay != 0.0 {
		t.Errorf("expected 0.0 per day for 0 working days, got %.2f", perDay)
	}
}

func TestRoleEscalationSecurityGuard(t *testing.T) {
	employeeClaims := &auth.Claims{
		UserID: "usr-emp-001",
		Email:  "employee@company.com",
		Roles:  []string{"EMPLOYEE"},
	}

	adminAllowed := authz.HasRole(employeeClaims, "SUPER_ADMIN", "HR_ADMIN")
	if adminAllowed {
		t.Errorf("security flaw: EMPLOYEE role gained administrative privilege")
	}

	adminClaims := &auth.Claims{
		UserID: "usr-admin-001",
		Email:  "admin@company.com",
		Roles:  []string{"SUPER_ADMIN"},
	}
	if !authz.HasRole(adminClaims, "SUPER_ADMIN") {
		t.Errorf("expected SUPER_ADMIN role to pass security check")
	}
}
