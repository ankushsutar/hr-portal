package attendance_test

import (
	"math"
	"testing"

	"github.com/company/hrms-backend/internal/attendance"
)

func TestCalculateHaversineDistance(t *testing.T) {
	// Mumbai HQ coordinates: 19.0760, 72.8777
	// Office entrance: 19.0762, 72.8779 (approx 30m away)
	// Bengaluru Tech Hub: 12.9716, 77.5946 (approx 840 km away)

	mumbaiLat, mumbaiLon := 19.0760, 72.8777
	entranceLat, entranceLon := 19.0762, 72.8779
	blrLat, blrLon := 12.9716, 77.5946

	distEntrance := attendance.CalculateHaversineDistance(mumbaiLat, mumbaiLon, entranceLat, entranceLon)
	if distEntrance > 50 || distEntrance < 10 {
		t.Errorf("Expected entrance distance around 20-40m, got %.2fm", distEntrance)
	}

	distBlr := attendance.CalculateHaversineDistance(mumbaiLat, mumbaiLon, blrLat, blrLon)
	if math.Abs(distBlr-840000) > 50000 {
		t.Errorf("Expected Mumbai to Bengaluru distance approx 840km, got %.2fkm", distBlr/1000)
	}
}

func TestIsIPAllowed(t *testing.T) {
	allowlist := []string{"192.168.1.100", "10.0.4.15", "203.0.113.42"}

	if !attendance.IsIPAllowed("192.168.1.100", allowlist) {
		t.Errorf("Expected 192.168.1.100 to be allowed")
	}

	if !attendance.IsIPAllowed(" 10.0.4.15 ", allowlist) {
		t.Errorf("Expected 10.0.4.15 (with whitespace) to be allowed")
	}

	if attendance.IsIPAllowed("192.168.1.101", allowlist) {
		t.Errorf("Expected 192.168.1.101 to NOT be allowed")
	}
}

func TestIsWithinGeofence(t *testing.T) {
	fences := []attendance.GeofenceLocation{
		{
			ID:           "f1",
			Name:         "Mumbai HQ Main Building",
			Latitude:     19.0760,
			Longitude:    72.8777,
			RadiusMeters: 100,
			IsActive:     true,
		},
		{
			ID:           "f2",
			Name:         "Inactive Office",
			Latitude:     28.6139,
			Longitude:    77.2090,
			RadiusMeters: 500,
			IsActive:     false,
		},
	}

	// 1. Employee inside Mumbai HQ (30m away)
	inFence, name := attendance.IsWithinGeofence(19.0762, 72.8779, fences)
	if !inFence || name != "Mumbai HQ Main Building" {
		t.Errorf("Expected inside Mumbai HQ, got inFence=%v, name=%s", inFence, name)
	}

	// 2. Employee far outside Mumbai HQ (500m away)
	outFence, _ := attendance.IsWithinGeofence(19.0810, 72.8777, fences)
	if outFence {
		t.Errorf("Expected outside Mumbai HQ for 500m distance")
	}

	// 3. Employee inside Inactive Office (should fail because IsActive=false)
	inactiveFence, _ := attendance.IsWithinGeofence(28.6139, 77.2090, fences)
	if inactiveFence {
		t.Errorf("Expected inactive fence to return false")
	}
}
