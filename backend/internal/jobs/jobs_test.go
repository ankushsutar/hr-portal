package jobs

import (
	"context"
	"testing"
)

func TestJobExecutionIdempotency(t *testing.T) {
	service := NewService(nil)
	ctx := context.Background()

	key := "test-idempotent-key-001"
	jobName := "ATTENDANCE_NIGHTLY_CALCULATION"

	// Execution 1: Should run and succeed
	exec1, err := service.ExecuteJob(ctx, jobName, key)
	if err != nil {
		t.Fatalf("expected execution 1 to succeed, got error: %v", err)
	}
	if exec1.Status != "SUCCESS" {
		t.Errorf("expected status SUCCESS, got: %s", exec1.Status)
	}

	// Execution 2 with same key immediately after: Should return SKIPPED (Idempotent)
	exec2, err := service.ExecuteJob(ctx, jobName, key)
	if err != nil {
		t.Fatalf("expected execution 2 to return skipped result, got error: %v", err)
	}
	if exec2.Status != "SKIPPED" {
		t.Errorf("expected status SKIPPED for idempotent duplicate execution, got: %s", exec2.Status)
	}
}
