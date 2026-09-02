package security_test

import (
	"testing"

	"github.com/company/hrms-backend/internal/security"
)

func TestEvaluateDataScope(t *testing.T) {
	if s := security.EvaluateDataScope("SUPER_ADMIN"); s != "ALL" {
		t.Errorf("Expected SUPER_ADMIN scope ALL, got %s", s)
	}

	if s := security.EvaluateDataScope("HR_ADMIN"); s != "ALL" {
		t.Errorf("Expected HR_ADMIN scope ALL, got %s", s)
	}

	if s := security.EvaluateDataScope("MANAGER"); s != "DEPARTMENT" {
		t.Errorf("Expected MANAGER scope DEPARTMENT, got %s", s)
	}

	if s := security.EvaluateDataScope("EMPLOYEE"); s != "SELF" {
		t.Errorf("Expected EMPLOYEE scope SELF, got %s", s)
	}
}

func TestMaskSensitiveField(t *testing.T) {
	// Bank Account Test
	bank := security.MaskSensitiveField("123456789012", "BANK_ACCOUNT")
	if bank != "********9012" {
		t.Errorf("Expected bank account masking ********9012, got %s", bank)
	}

	// Tax ID / SSN Test
	tax := security.MaskSensitiveField("987654321", "TAX_ID")
	if tax != "98*****21" {
		t.Errorf("Expected tax ID masking 98*****21, got %s", tax)
	}

	// Salary Test
	salary := security.MaskSensitiveField("150000", "SALARY")
	if salary != "[RESTRICTED - ADMIN ONLY]" {
		t.Errorf("Expected salary masking [RESTRICTED - ADMIN ONLY], got %s", salary)
	}

	// Email Test
	email := security.MaskSensitiveField("aarav@company.com", "EMAIL")
	if email != "aa***@company.com" {
		t.Errorf("Expected email masking aa***@company.com, got %s", email)
	}
}
