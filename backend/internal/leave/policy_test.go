package leave_test

import (
	"testing"
	"time"

	"github.com/company/hrms-backend/internal/leave"
)

func TestEvaluateSandwichRule(t *testing.T) {
	// Dates
	fri := time.Date(2026, 9, 4, 0, 0, 0, 0, time.UTC) // Friday
	sat := time.Date(2026, 9, 5, 0, 0, 0, 0, time.UTC) // Saturday
	sun := time.Date(2026, 9, 6, 0, 0, 0, 0, time.UTC) // Sunday
	mon := time.Date(2026, 9, 7, 0, 0, 0, 0, time.UTC) // Monday
	tue := time.Date(2026, 9, 8, 0, 0, 0, 0, time.UTC) // Tuesday

	tests := []struct {
		name              string
		startDate         time.Time
		endDate           time.Time
		isSandwichEnabled bool
		expectedDays      float64
	}{
		{
			name:              "Standard Mid-week Leave (Mon-Tue)",
			startDate:         mon,
			endDate:           tue,
			isSandwichEnabled: false,
			expectedDays:      2.0,
		},
		{
			name:              "Fri to Mon without Sandwich Rule",
			startDate:         fri,
			endDate:           mon,
			isSandwichEnabled: false,
			expectedDays:      2.0, // Fri and Mon only
		},
		{
			name:              "Fri to Mon WITH Sandwich Rule",
			startDate:         fri,
			endDate:           mon,
			isSandwichEnabled: true,
			expectedDays:      4.0, // Fri, Sat, Sun, Mon
		},
		{
			name:              "Fri to Sun WITH Sandwich Rule",
			startDate:         fri,
			endDate:           sun,
			isSandwichEnabled: true,
			expectedDays:      3.0, // Fri, Sat, Sun
		},
		{
			name:              "Sat to Sun WITH Sandwich Rule",
			startDate:         sat,
			endDate:           sun,
			isSandwichEnabled: true,
			expectedDays:      2.0, // Sat, Sun
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actual := leave.EvaluateSandwichRule(tt.startDate, tt.endDate, tt.isSandwichEnabled)
			if actual != tt.expectedDays {
				t.Errorf("%s: expected %.1f days, got %.1f days", tt.name, tt.expectedDays, actual)
			}
		})
	}
}
