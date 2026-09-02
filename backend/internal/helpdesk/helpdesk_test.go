package helpdesk_test

import (
	"strings"
	"testing"
	"time"

	"github.com/company/hrms-backend/internal/helpdesk"
)

func TestGenerateTicketNumber(t *testing.T) {
	num1 := helpdesk.GenerateTicketNumber(1)
	if !strings.HasPrefix(num1, "TICK-") || !strings.HasSuffix(num1, "-001") {
		t.Errorf("Expected ticket number format TICK-YYYY-001, got %s", num1)
	}

	num42 := helpdesk.GenerateTicketNumber(42)
	if !strings.HasSuffix(num42, "-042") {
		t.Errorf("Expected ticket number format to end in -042, got %s", num42)
	}
}

func TestEvaluateSLABreach(t *testing.T) {
	now := time.Now()

	// Scenario 1: Open ticket created 30 hours ago (SLA 24h) -> Breached
	created30h := now.Add(-30 * time.Hour)
	if !helpdesk.EvaluateSLABreach(created30h, 24, "OPEN") {
		t.Errorf("Expected SLA breach for 30h old OPEN ticket with 24h SLA")
	}

	// Scenario 2: Open ticket created 2 hours ago (SLA 24h) -> Not Breached
	created2h := now.Add(-2 * time.Hour)
	if helpdesk.EvaluateSLABreach(created2h, 24, "OPEN") {
		t.Errorf("Did NOT expect SLA breach for 2h old OPEN ticket")
	}

	// Scenario 3: Resolved ticket created 50 hours ago -> Not Breached
	created50h := now.Add(-50 * time.Hour)
	if helpdesk.EvaluateSLABreach(created50h, 24, "RESOLVED") {
		t.Errorf("Did NOT expect SLA breach for RESOLVED ticket")
	}
}

func TestProcessTicketTransition(t *testing.T) {
	if s := helpdesk.ProcessTicketTransition("OPEN", "START_PROGRESS"); s != "IN_PROGRESS" {
		t.Errorf("Expected IN_PROGRESS, got %s", s)
	}

	if s := helpdesk.ProcessTicketTransition("IN_PROGRESS", "RESOLVE"); s != "RESOLVED" {
		t.Errorf("Expected RESOLVED, got %s", s)
	}

	if s := helpdesk.ProcessTicketTransition("RESOLVED", "CLOSE"); s != "CLOSED" {
		t.Errorf("Expected CLOSED, got %s", s)
	}

	if s := helpdesk.ProcessTicketTransition("CLOSED", "REOPEN"); s != "OPEN" {
		t.Errorf("Expected OPEN, got %s", s)
	}
}
