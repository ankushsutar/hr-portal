-- Migration 000026: Centralized Attendance Rules, IP Allowlisting, Geofencing, and Biometric Config
CREATE TABLE IF NOT EXISTS attendance_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(100) NOT NULL UNIQUE DEFAULT 'GLOBAL_DEFAULT',
    web_clock_enabled BOOLEAN DEFAULT true,
    ip_restriction_enabled BOOLEAN DEFAULT false,
    geofence_enabled BOOLEAN DEFAULT false,
    biometric_sync_enabled BOOLEAN DEFAULT true,
    default_grace_period_minutes INT DEFAULT 15,
    half_day_threshold_hours NUMERIC(4,2) DEFAULT 4.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ip_allowlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS geofence_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    radius_meters INT DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default global attendance rules if empty
INSERT INTO attendance_rules (rule_name, web_clock_enabled, ip_restriction_enabled, geofence_enabled, biometric_sync_enabled, default_grace_period_minutes, half_day_threshold_hours)
VALUES ('GLOBAL_DEFAULT', true, false, false, true, 15, 4.0)
ON CONFLICT (rule_name) DO NOTHING;
