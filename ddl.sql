-- ZYMI PostgreSQL Master DDL
-- Based on architecture-master.md and schema-planning.md
-- Target: PostgreSQL 15+

-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ==============================================================================
-- 2. CORE IDENTITY & AUTHENTICATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_normalized VARCHAR(20) UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'user',
    avatar_url VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Available',
    location geometry(Point, 4326),
    last_location_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE
);

-- ==============================================================================
-- 3. REAL-TIME CHAT & GROUPS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    avatar_url VARCHAR(255),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    body TEXT,
    message_type VARCHAR(20) DEFAULT 'text',
    status VARCHAR(20) DEFAULT 'sent',
    attachment_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: A message must have either a recipient (1-on-1) OR a group_id (Group chat), but not both.
    CONSTRAINT chk_message_target CHECK (
        (recipient_id IS NOT NULL AND group_id IS NULL) OR 
        (recipient_id IS NULL AND group_id IS NOT NULL) OR
        (recipient_id IS NULL AND group_id IS NULL AND message_type = 'system')
    )
);

-- ==============================================================================
-- 4. WEBRTC CALL HISTORY
-- ==============================================================================

CREATE TABLE IF NOT EXISTS call_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id UUID REFERENCES users(id) ON DELETE SET NULL,
    callee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    call_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    -- Constraint: A call must have either a callee (1-on-1) OR a group_id (Group call).
    CONSTRAINT chk_call_target CHECK (
        (callee_id IS NOT NULL AND group_id IS NULL) OR 
        (callee_id IS NULL AND group_id IS NOT NULL)
    )
);

-- ==============================================================================
-- 5. GAMIFICATION SYSTEM
-- ==============================================================================

CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    source VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    rule_key VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS user_badges (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

-- ==============================================================================
-- 6. MODERATION & SECURITY
-- ==============================================================================

CREATE TABLE IF NOT EXISTS blocked_users (
    blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id),
    CONSTRAINT chk_no_self_block CHECK (blocker_id != blocked_id)
);

CREATE TABLE IF NOT EXISTS message_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    reason VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    ip_masked VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. ADMIN & GOVERNANCE (ZRCS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL,
    value FLOAT NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ZRCS Ad Control System
CREATE TABLE IF NOT EXISTS ad_global_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    ads_enabled BOOLEAN DEFAULT FALSE,
    test_mode BOOLEAN DEFAULT FALSE,
    active_network VARCHAR(50),
    fallback_network VARCHAR(50),
    interstitial_gap_seconds INTEGER DEFAULT 1800,
    native_refresh_seconds INTEGER DEFAULT 60,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_single_row CHECK (id = 1) -- Ensures only one global settings row
);

CREATE TABLE IF NOT EXISTS ad_network_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    network_key VARCHAR(50) UNIQUE NOT NULL,
    sdk_key VARCHAR(255),
    app_id VARCHAR(255),
    interstitial_id VARCHAR(255),
    native_id VARCHAR(255),
    rewarded_id VARCHAR(255),
    banner_id VARCHAR(255),
    is_active BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_placements (
    placement_key VARCHAR(50) PRIMARY KEY,
    enabled BOOLEAN DEFAULT FALSE,
    min_delay_seconds INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_country_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(2) NOT NULL,
    ads_enabled BOOLEAN DEFAULT FALSE,
    network_override VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_version_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_version VARCHAR(50) NOT NULL,
    ads_enabled BOOLEAN DEFAULT FALSE,
    force_update BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_config_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. PERFORMANCE INDEXES
-- ==============================================================================

-- B-Tree Indexes for fast user lookup
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_normalized);

-- B-Tree Indexes for message retrieval and timeline sorting
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_group ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- B-Tree Indexes for WebRTC call history
CREATE INDEX IF NOT EXISTS idx_call_history_caller ON call_history(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_history_callee ON call_history(callee_id);

-- B-Tree Index for expiring OTP tokens
CREATE INDEX IF NOT EXISTS idx_otp_tokens_expires ON otp_tokens(expires_at);

-- GIST Index for high-performance PostGIS geospatial proximity queries (Nearby feature)
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST (location);
