package attendance_test

import (
	"testing"
	"time"

	"github.com/company/hrms-backend/internal/attendance"
)

func TestEvaluateShiftException(t *testing.T) {
	// Base date: 2026-09-01
	baseDate := time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC)
	shiftStart := baseDate.Add(9 * time.Hour)  // 09:00 AM
	shiftEnd := baseDate.Add(18 * time.Hour)   // 06:00 PM
	gracePeriod := 15                          // 15 minutes

	testCases := []struct {
		name             string
		checkIn          time.Time
		checkOut         time.Time
		expectedType     string
		expectedLate     int
		expectedEarly    int
	}{
		{
			name:         "On-time Arrival & Full Shift",
			checkIn:      shiftStart.Add(5 * time.Minute), // 09:05 AM (within 15m grace)
			checkOut:     shiftEnd.Add(10 * time.Minute),  // 06:10 PM
			expectedType: "",
			expectedLate: 0,
			expectedEarly: 0,
		},
		{
			name:         "Late Arrival Only",
			checkIn:      shiftStart.Add(30 * time.Minute), // 09:30 AM (> 15m grace)
			checkOut:     shiftEnd,                          // 06:00 PM
			expectedType: "LATE_ARRIVAL",
			expectedLate: 30,
			expectedEarly: 0,
		},
		{
			name:         "Early Departure Only",
			checkIn:      shiftStart,                       // 09:00 AM
			checkOut:     shiftEnd.Add(-45 * time.Minute),  // 05:15 PM (< 05:45 PM grace)
			expectedType: "EARLY_DEPARTURE",
			expectedLate: 0,
			expectedEarly: 45,
		},
		{
			name:         "Both Late Arrival & Early Departure",
			checkIn:      shiftStart.Add(25 * time.Minute), // 09:25 AM
			checkOut:     shiftEnd.Add(-30 * time.Minute),  // 05:30 PM
			expectedType: "BOTH",
			expectedLate: 25,
			expectedEarly: 30,
		},
		{
			name:         "Missing Check Out",
			checkIn:      shiftStart,
			checkOut:     time.Time{}, // Zero time
			expectedType: "MISSING_PUNCH",
			expectedLate: 0,
			expectedEarly: 0,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			excType, lateMin, earlyMin := attendance.EvaluateShiftException(tc.checkIn, tc.checkOut, shiftStart, shiftEnd, gracePeriod)
			if excType != tc.expectedType {
				t.Errorf("Expected exception type %s, got %s", tc.expectedType, excType)
			}
			if lateMin != tc.expectedLate {
				t.Errorf("Expected late minutes %d, got %d", tc.expectedLate, lateMin)
			}
			if earlyMin != tc.expectedEarly {
				t.Errorf("Expected early minutes %d, got %d", tc.expectedEarly, earlyMin)
			}
		})
	}
}
