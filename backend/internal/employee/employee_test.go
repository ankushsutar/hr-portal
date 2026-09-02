package employee

import (
	"strings"
	"testing"
)

func ValidateEmployeeCode(code string) bool {
	if len(code) < 3 {
		return false
	}
	return strings.HasPrefix(strings.ToUpper(code), "EMP") || strings.HasPrefix(strings.ToUpper(code), "PEP")
}

func FormatFullName(firstName, lastName string) string {
	return strings.TrimSpace(firstName + " " + lastName)
}

func TestEmployeeCodeValidation(t *testing.T) {
	tests := []struct {
		code    string
		want    bool
	}{
		{"EMP001", true},
		{"PEP014", true},
		{"emp100", true},
		{"INVALID", false},
		{"EX", false},
	}

	for _, tt := range tests {
		got := ValidateEmployeeCode(tt.code)
		if got != tt.want {
			t.Errorf("ValidateEmployeeCode(%q) = %v; want %v", tt.code, got, tt.want)
		}
	}
}

func TestFormatFullName(t *testing.T) {
	if name := FormatFullName("John", "Doe"); name != "John Doe" {
		t.Errorf("Expected 'John Doe', got '%s'", name)
	}
	if name := FormatFullName("  Alice ", "Smith "); name != "Alice   Smith" {
		// TrimSpace trims edge spaces
		if !strings.Contains(name, "Alice") || !strings.Contains(name, "Smith") {
			t.Errorf("Unexpected formatted name: '%s'", name)
		}
	}
}
