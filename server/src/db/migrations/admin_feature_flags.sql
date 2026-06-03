-- Admin Governance Migration
-- Target: Feature Flags and Regional Controls

-- 1. Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
    id SERIAL PRIMARY KEY,
    feature_key VARCHAR(50) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Geo Rules Table
CREATE TABLE IF NOT EXISTS feature_geo_rules (
    id SERIAL PRIMARY KEY,
    feature_key VARCHAR(50) NOT NULL,
    country_code CHAR(2),
    city_name VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feature_key) REFERENCES feature_flags(feature_key) ON DELETE CASCADE
);

-- 3. User Specific Rules Table
CREATE TABLE IF NOT EXISTS feature_user_rules (
    id SERIAL PRIMARY KEY,
    feature_key VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    reason TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feature_key) REFERENCES feature_flags(feature_key) ON DELETE CASCADE
);

-- 4. Initial Seed Data
INSERT INTO feature_flags (feature_key, enabled, description) VALUES
('nearby_enabled', TRUE, 'Discover users in proximity'),
('file_sharing_enabled', TRUE, 'Allow users to send files'),
('video_call_enabled', TRUE, 'Real-time video communication'),
('audio_call_enabled', TRUE, 'Real-time voice communication'),
('location_sharing_enabled', TRUE, 'Share map pins in chat'),
('ai_analysis_enabled', TRUE, 'AI-powered chat insights'),
('report_system_enabled', TRUE, 'User complaint system');
