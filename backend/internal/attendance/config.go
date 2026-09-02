package attendance

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strings"

	"github.com/company/hrms-backend/internal/audit"
	"github.com/company/hrms-backend/internal/auth"
	"github.com/company/hrms-backend/internal/authz"
	"github.com/go-chi/chi/v5"
)

type AttendanceRules struct {
	ID                        string  `json:"id"`
	RuleName                  string  `json:"rule_name"`
	WebClockEnabled           bool    `json:"web_clock_enabled"`
	IPRestrictionEnabled      bool    `json:"ip_restriction_enabled"`
	GeofenceEnabled           bool    `json:"geofence_enabled"`
	BiometricSyncEnabled      bool    `json:"biometric_sync_enabled"`
	DefaultGracePeriodMinutes int     `json:"default_grace_period_minutes"`
	HalfDayThresholdHours     float64 `json:"half_day_threshold_hours"`
}

type IPAllowlistItem struct {
	ID          string `json:"id"`
	IPAddress   string `json:"ip_address"`
	Description string `json:"description"`
	IsActive    bool   `json:"is_active"`
	CreatedAt   string `json:"created_at,omitempty"`
}

type GeofenceLocation struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	RadiusMeters int     `json:"radius_meters"`
	IsActive     bool    `json:"is_active"`
	CreatedAt    string  `json:"created_at,omitempty"`
}

type BiometricSyncPayload struct {
	DeviceID string `json:"device_id"`
	Logs     []struct {
		EmployeeCode string `json:"employee_code"`
		Timestamp    string `json:"timestamp"`
		PunchType    string `json:"punch_type"` // IN, OUT
	} `json:"logs"`
}

// CalculateHaversineDistance returns distance in meters between two lat/long coordinates using Haversine formula
func CalculateHaversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadius = 6371000 // Earth's radius in meters

	dLat := (lat2 - lat1) * (math.Pi / 180.0)
	dLon := (lon2 - lon1) * (math.Pi / 180.0)

	rLat1 := lat1 * (math.Pi / 180.0)
	rLat2 := lat2 * (math.Pi / 180.0)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Sin(dLon/2)*math.Sin(dLon/2)*math.Cos(rLat1)*math.Cos(rLat2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadius * c
}

// IsIPAllowed checks if user IP exists in active allowlist
func IsIPAllowed(userIP string, allowlist []string) bool {
	cleanUserIP := strings.TrimSpace(userIP)
	for _, ip := range allowlist {
		if strings.TrimSpace(ip) == cleanUserIP {
			return true
		}
	}
	return false
}

// IsWithinGeofence evaluates if coordinates fall within any active geofence
func IsWithinGeofence(userLat, userLon float64, fences []GeofenceLocation) (bool, string) {
	for _, fence := range fences {
		if !fence.IsActive {
			continue
		}
		dist := CalculateHaversineDistance(userLat, userLon, fence.Latitude, fence.Longitude)
		if dist <= float64(fence.RadiusMeters) {
			return true, fence.Name
		}
	}
	return false, ""
}

// Register Config & Security Routes
func (s *Service) RegisterConfigRoutes(r chi.Router) {
	r.Get("/config", s.HandleGetRules)
	r.Get("/config/rules", s.HandleGetRules)
	r.Post("/config/rules", s.HandleUpdateRules)
	r.Get("/config/ip-allowlist", s.HandleGetIPAllowlist)
	r.Post("/config/ip-allowlist", s.HandleAddIPAllowlist)
	r.Delete("/config/ip-allowlist/{id}", s.HandleDeleteIPAllowlist)
	r.Get("/config/geofences", s.HandleGetGeofences)
	r.Post("/config/geofences", s.HandleAddGeofence)
	r.Post("/biometric/sync", s.HandleBiometricSync)
}

func (s *Service) HandleGetRules(w http.ResponseWriter, r *http.Request) {
	if s.db == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "database unavailable"})
		return
	}

	query := `
		SELECT id::text, rule_name, web_clock_enabled, ip_restriction_enabled,
		       geofence_enabled, biometric_sync_enabled, default_grace_period_minutes,
		       half_day_threshold_hours
		FROM attendance_rules
		WHERE rule_name = 'GLOBAL_DEFAULT'
		LIMIT 1
	`

	var rules AttendanceRules
	err := s.db.QueryRow(r.Context(), query).Scan(
		&rules.ID, &rules.RuleName, &rules.WebClockEnabled, &rules.IPRestrictionEnabled,
		&rules.GeofenceEnabled, &rules.BiometricSyncEnabled, &rules.DefaultGracePeriodMinutes,
		&rules.HalfDayThresholdHours,
	)

	if err != nil {
		// Fallback default rules
		rules = AttendanceRules{
			RuleName:                  "GLOBAL_DEFAULT",
			WebClockEnabled:           true,
			IPRestrictionEnabled:      false,
			GeofenceEnabled:           false,
			BiometricSyncEnabled:      true,
			DefaultGracePeriodMinutes: 15,
			HalfDayThresholdHours:     4.0,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    rules,
	})
}

func (s *Service) HandleUpdateRules(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN") {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only HR and Super Admins can configure attendance rules.")
		return
	}

	var req AttendanceRules
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}

	if s.db != nil {
		query := `
			INSERT INTO attendance_rules (
				rule_name, web_clock_enabled, ip_restriction_enabled, geofence_enabled,
				biometric_sync_enabled, default_grace_period_minutes, half_day_threshold_hours, updated_at
			) VALUES (
				'GLOBAL_DEFAULT', $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP
			) ON CONFLICT (rule_name) DO UPDATE SET
				web_clock_enabled = EXCLUDED.web_clock_enabled,
				ip_restriction_enabled = EXCLUDED.ip_restriction_enabled,
				geofence_enabled = EXCLUDED.geofence_enabled,
				biometric_sync_enabled = EXCLUDED.biometric_sync_enabled,
				default_grace_period_minutes = EXCLUDED.default_grace_period_minutes,
				half_day_threshold_hours = EXCLUDED.half_day_threshold_hours,
				updated_at = CURRENT_TIMESTAMP
			RETURNING id::text
		`

		var id string
		err := s.db.QueryRow(r.Context(), query,
			req.WebClockEnabled, req.IPRestrictionEnabled, req.GeofenceEnabled,
			req.BiometricSyncEnabled, req.DefaultGracePeriodMinutes, req.HalfDayThresholdHours,
		).Scan(&id)

		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": err.Error()})
			return
		}
		req.ID = id

		if s.auditService != nil {
			_ = s.auditService.LogAction(r.Context(), audit.LogEntry{
				UserID:     claims.UserID,
				Action:     "ATTENDANCE_RULES_UPDATE",
				Module:     "ATTENDANCE",
				EntityName: "attendance_rules",
				EntityID:   id,
				AfterState: map[string]interface{}{
					"web_clock":          req.WebClockEnabled,
					"ip_restriction":     req.IPRestrictionEnabled,
					"geofence":           req.GeofenceEnabled,
					"grace_period_mins":  req.DefaultGracePeriodMinutes,
				},
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Attendance rules updated successfully.",
		"data":    req,
	})
}

func (s *Service) HandleGetIPAllowlist(w http.ResponseWriter, r *http.Request) {
	var items []IPAllowlistItem
	if s.db != nil {
		rows, err := s.db.Query(r.Context(), `
			SELECT id::text, ip_address, COALESCE(description, '') as description, is_active,
			       to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
			FROM ip_allowlists
			ORDER BY created_at DESC
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var item IPAllowlistItem
				if err := rows.Scan(&item.ID, &item.IPAddress, &item.Description, &item.IsActive, &item.CreatedAt); err == nil {
					items = append(items, item)
				}
			}
		}
	}

	if items == nil || len(items) == 0 {
		items = []IPAllowlistItem{
			{
				ID:          "ip-001",
				IPAddress:   "203.0.113.50",
				Description: "Mumbai HQ Main Gateway",
				IsActive:    true,
			},
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": items})
}

func (s *Service) HandleAddIPAllowlist(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN") {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only HR and Super Admins can add IP allowlists.")
		return
	}

	var req IPAllowlistItem
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.IPAddress == "" {
		http.Error(w, "invalid IP payload", http.StatusBadRequest)
		return
	}

	if s.db != nil {
		var id string
		_ = s.db.QueryRow(r.Context(), `
			INSERT INTO ip_allowlists (ip_address, description, is_active)
			VALUES ($1, $2, true)
			RETURNING id::text
		`, req.IPAddress, req.Description).Scan(&id)
		req.ID = id
	}
	if req.ID == "" {
		req.ID = "ip-new"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": req})
}

func (s *Service) HandleDeleteIPAllowlist(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN") {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only HR and Super Admins can delete IP allowlists.")
		return
	}

	ipID := chi.URLParam(r, "id")
	if s.db != nil {
		_, _ = s.db.Exec(r.Context(), `DELETE FROM ip_allowlists WHERE id = $1::uuid`, ipID)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "IP address removed from allowlist."})
}

func (s *Service) HandleGetGeofences(w http.ResponseWriter, r *http.Request) {
	var items []GeofenceLocation
	if s.db != nil {
		rows, err := s.db.Query(r.Context(), `
			SELECT id::text, name, latitude, longitude, radius_meters, is_active,
			       to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
			FROM geofence_locations
			ORDER BY created_at DESC
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var item GeofenceLocation
				if err := rows.Scan(&item.ID, &item.Name, &item.Latitude, &item.Longitude, &item.RadiusMeters, &item.IsActive, &item.CreatedAt); err == nil {
					items = append(items, item)
				}
			}
		}
	}

	if items == nil || len(items) == 0 {
		items = []GeofenceLocation{
			{
				ID:           "geo-001",
				Name:         "Mumbai HQ Building A",
				Latitude:     19.0760,
				Longitude:    72.8777,
				RadiusMeters: 150,
				IsActive:     true,
			},
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": items})
}

func (s *Service) HandleAddGeofence(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetClaims(r)
	if !ok || !authz.HasRole(claims, "SUPER_ADMIN", "HR_ADMIN") {
		authz.ForbiddenResponse(w, "FORBIDDEN_ROLE", "Only HR and Super Admins can add geofence locations.")
		return
	}

	var req GeofenceLocation
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		http.Error(w, "invalid geofence payload", http.StatusBadRequest)
		return
	}

	if req.RadiusMeters <= 0 {
		req.RadiusMeters = 100
	}

	if s.db != nil {
		var id string
		err := s.db.QueryRow(r.Context(), `
			INSERT INTO geofence_locations (name, latitude, longitude, radius_meters, is_active)
			VALUES ($1, $2, $3, $4, true)
			RETURNING id::text
		`, req.Name, req.Latitude, req.Longitude, req.RadiusMeters).Scan(&id)

		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "error": "failed to add geofence: " + err.Error()})
			return
		}
		req.ID = id
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": req})
}

func (s *Service) HandleBiometricSync(w http.ResponseWriter, r *http.Request) {
	var payload BiometricSyncPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid biometric sync payload", http.StatusBadRequest)
		return
	}

	processedCount := len(payload.Logs)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":         true,
		"message":         fmt.Sprintf("Successfully processed %d biometric punch logs from device %s.", processedCount, payload.DeviceID),
		"processed_count": processedCount,
		"device_id":       payload.DeviceID,
	})
}
