package reports

import (
	"strings"
	"testing"
)

func SanitizeCSVField(field string) string {
	if strings.Contains(field, ",") || strings.Contains(field, "\"") || strings.Contains(field, "\n") {
		escaped := strings.ReplaceAll(field, "\"", "\"\"")
		return "\"" + escaped + "\""
	}
	return field
}

func TestSanitizeCSVField(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Normal Text", "Normal Text"},
		{"Text, with comma", "\"Text, with comma\""},
		{"Text with \"quotes\"", "\"Text with \"\"quotes\"\"\""},
	}

	for _, tt := range tests {
		got := SanitizeCSVField(tt.input)
		if got != tt.expected {
			t.Errorf("SanitizeCSVField(%q) = %q; want %q", tt.input, got, tt.expected)
		}
	}
}
