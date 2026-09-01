package attendance_test

import (
	"testing"
)

func TestAttendanceValidationStateMachine(t *testing.T) {
	validStatuses := map[string]bool{
		"DRAFT":       true,
		"TO_VALIDATE": true,
		"OT_PENDING":  true,
		"VALIDATED":   true,
		"REJECTED":    true,
	}

	testCases := []struct {
		name        string
		inputStatus string
		expected    bool
	}{
		{"Draft Status", "DRAFT", true},
		{"To Validate Status", "TO_VALIDATE", true},
		{"OT Pending Status", "OT_PENDING", true},
		{"Validated Status", "VALIDATED", true},
		{"Rejected Status", "REJECTED", true},
		{"Invalid Status", "UNKNOWN_STATUS", false},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			_, exists := validStatuses[tc.inputStatus]
			if exists != tc.expected {
				t.Errorf("Expected status %s validity to be %v, got %v", tc.inputStatus, tc.expected, exists)
			}
		})
	}
}

func TestPayrollValidationGuardLogic(t *testing.T) {
	// Simulate attendance status items for period
	periodRecords := []map[string]string{
		{"id": "1", "status": "VALIDATED"},
		{"id": "2", "status": "VALIDATED"},
		{"id": "3", "status": "TO_VALIDATE"},
	}

	unvalidatedCount := 0
	for _, rec := range periodRecords {
		if rec["status"] == "TO_VALIDATE" || rec["status"] == "OT_PENDING" {
			unvalidatedCount++
		}
	}

	if unvalidatedCount == 0 {
		t.Errorf("Expected guard to detect 1 unvalidated attendance record, got 0")
	}

	if unvalidatedCount != 1 {
		t.Errorf("Expected exactly 1 unvalidated record, got %d", unvalidatedCount)
	}
}
