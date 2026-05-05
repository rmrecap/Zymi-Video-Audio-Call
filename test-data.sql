-- ZYMI Test Data Generation
-- Location: Dubai (Al Muteena, Marina, Downtown, Palm Jumeirah, Deira)
-- Target: PostgreSQL 15+ with PostGIS

-- We use predefined UUIDs for relational consistency in this script.

-- ==============================================================================
-- 1. USERS
-- PostGIS ST_MakePoint requires (Longitude, Latitude)
-- ==============================================================================
INSERT INTO users (id, username, email, password_hash, phone_normalized, email_verified, role, status, location, created_at)
VALUES 
    -- User 1: Ahmed in Al Muteena
    ('11111111-1111-1111-1111-111111111111', 'ahmed_dxb', 'ahmed@zymi.ae', '$2a$10$xyz...', '+971501234567', true, 'user', 'Available', 
     ST_SetSRID(ST_MakePoint(55.3216, 25.2754), 4326), NOW() - INTERVAL '30 days'),
    
    -- User 2: Sarah in Dubai Marina
    ('22222222-2222-2222-2222-222222222222', 'sarah_marina', 'sarah@zymi.ae', '$2a$10$xyz...', '+971502345678', true, 'user', 'In a call', 
     ST_SetSRID(ST_MakePoint(55.1403, 25.0805), 4326), NOW() - INTERVAL '25 days'),
    
    -- User 3: Omar in Downtown Dubai
    ('33333333-3333-3333-3333-333333333333', 'omar_downtown', 'omar@zymi.ae', '$2a$10$xyz...', '+971503456789', true, 'user', 'Busy', 
     ST_SetSRID(ST_MakePoint(55.2744, 25.1972), 4326), NOW() - INTERVAL '20 days'),
     
    -- User 4: Fatima in Palm Jumeirah
    ('44444444-4444-4444-4444-444444444444', 'fatima_palm', 'fatima@zymi.ae', '$2a$10$xyz...', '+971504567890', true, 'user', 'Available', 
     ST_SetSRID(ST_MakePoint(55.1390, 25.1124), 4326), NOW() - INTERVAL '15 days'),
     
    -- User 5: Khalid (Admin) in Deira
    ('55555555-5555-5555-5555-555555555555', 'admin_khalid', 'khalid_admin@zymi.ae', '$2a$10$xyz...', '+971505678901', true, 'admin', 'Available', 
     ST_SetSRID(ST_MakePoint(55.3180, 25.2676), 4326), NOW() - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 2. OTP TOKENS
-- ==============================================================================
INSERT INTO otp_tokens (id, user_id, token_hash, type, expires_at, used)
VALUES 
    (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'hash1', 'email_verify', NOW() - INTERVAL '29 days', true),
    (uuid_generate_v4(), '22222222-2222-2222-2222-222222222222', 'hash2', 'password_reset', NOW() - INTERVAL '5 days', true),
    (uuid_generate_v4(), '33333333-3333-3333-3333-333333333333', 'hash3', 'email_verify', NOW() - INTERVAL '19 days', true),
    (uuid_generate_v4(), '44444444-4444-4444-4444-444444444444', 'hash4', '2fa_login', NOW() + INTERVAL '5 minutes', false),
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', 'hash5', '2fa_login', NOW() - INTERVAL '1 hour', false)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 3. GROUPS
-- ==============================================================================
INSERT INTO groups (id, name, description, created_by, created_at)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dubai Tech Hub', 'Developers in UAE', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '10 days'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Marina Runners', 'Morning runs around Dubai Marina', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '8 days'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Downtown Foodies', 'Best spots near Burj Khalifa', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '7 days'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'UAE WebRTC Beta Testers', 'Testing ZYMI group calls', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '5 days'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Gaming Squad ME', 'Regional gaming chat', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 4. GROUP MEMBERS
-- ==============================================================================
INSERT INTO group_members (group_id, user_id, role, joined_at)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'admin', NOW() - INTERVAL '10 days'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'member', NOW() - INTERVAL '9 days'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'member', NOW() - INTERVAL '8 days'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'admin', NOW() - INTERVAL '8 days'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'member', NOW() - INTERVAL '7 days')
ON CONFLICT (group_id, user_id) DO NOTHING;

-- ==============================================================================
-- 5. MESSAGES (Logical chronological flow)
-- ==============================================================================
INSERT INTO messages (id, sender_id, recipient_id, group_id, body, message_type, status, created_at)
VALUES 
    -- Conversation between Ahmed and Omar
    (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', NULL, 'Hey Omar, are you going to the Downtown meetup today?', 'text', 'seen', NOW() - INTERVAL '2 hours'),
    (uuid_generate_v4(), '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', NULL, 'Yes! I will be there around 6 PM.', 'text', 'seen', NOW() - INTERVAL '1 hour 55 minutes'),
    
    -- Conversation between Sarah and Fatima
    (uuid_generate_v4(), '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', NULL, 'Sending you the Marina running route now.', 'text', 'delivered', NOW() - INTERVAL '30 minutes'),
    (uuid_generate_v4(), '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', NULL, 'map_route.jpg', 'image', 'sent', NOW() - INTERVAL '29 minutes'),
    
    -- Group Message in Dubai Tech Hub
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Welcome to the group everyone! Please check the pinned rules.', 'system', 'delivered', NOW() - INTERVAL '9 days')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 6. CALL HISTORY
-- ==============================================================================
INSERT INTO call_history (id, caller_id, callee_id, group_id, call_type, status, duration_seconds, started_at, ended_at)
VALUES 
    (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', NULL, 'audio', 'completed', 300, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '5 minutes'),
    (uuid_generate_v4(), '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', NULL, 'video', 'completed', 1500, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '25 minutes'),
    (uuid_generate_v4(), '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', NULL, 'audio', 'missed', 0, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', NULL, 'video', 'rejected', 0, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),
    (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'video', 'completed', 3600, NOW() - INTERVAL '10 hours', NOW() - INTERVAL '9 hours')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 7. GAMIFICATION: BADGES & POINTS
-- ==============================================================================
INSERT INTO badges (id, name, description, icon_url, rule_key)
VALUES 
    (uuid_generate_v4(), 'Early Adopter', 'Joined ZYMI in the first month', '/badges/early.png', 'early_adopter'),
    (uuid_generate_v4(), 'Chatterbox', 'Sent over 1000 messages', '/badges/chat.png', 'msg_1000'),
    (uuid_generate_v4(), 'Social Butterfly', 'Joined 5 groups', '/badges/social.png', 'grp_5'),
    (uuid_generate_v4(), 'Video Star', 'Completed 50 video calls', '/badges/video.png', 'vid_50'),
    (uuid_generate_v4(), 'Verified Local', 'Used the Nearby feature 10 times', '/badges/local.png', 'nearby_10')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_points (id, user_id, points, source, created_at)
VALUES 
    (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 50, 'daily_login', NOW() - INTERVAL '2 days'),
    (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 100, 'profile_completion', NOW() - INTERVAL '30 days'),
    (uuid_generate_v4(), '22222222-2222-2222-2222-222222222222', 50, 'daily_login', NOW() - INTERVAL '1 day'),
    (uuid_generate_v4(), '33333333-3333-3333-3333-333333333333', 200, 'first_video_call', NOW() - INTERVAL '20 days'),
    (uuid_generate_v4(), '44444444-4444-4444-4444-444444444444', 50, 'daily_login', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert User Badges
WITH b AS (SELECT id, rule_key FROM badges)
INSERT INTO user_badges (user_id, badge_id, awarded_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', (SELECT id FROM b WHERE rule_key = 'early_adopter'), NOW() - INTERVAL '30 days'),
    ('55555555-5555-5555-5555-555555555555', (SELECT id FROM b WHERE rule_key = 'early_adopter'), NOW() - INTERVAL '60 days'),
    ('22222222-2222-2222-2222-222222222222', (SELECT id FROM b WHERE rule_key = 'vid_50'), NOW() - INTERVAL '5 days'),
    ('33333333-3333-3333-3333-333333333333', (SELECT id FROM b WHERE rule_key = 'msg_1000'), NOW() - INTERVAL '2 days'),
    ('44444444-4444-4444-4444-444444444444', (SELECT id FROM b WHERE rule_key = 'nearby_10'), NOW() - INTERVAL '1 day')
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- ==============================================================================
-- 8. MODERATION & AUDIT LOGS
-- ==============================================================================
INSERT INTO blocked_users (blocker_id, blocked_id, created_at)
VALUES 
    ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '2 days'),
    ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '5 days'),
    ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '4 days'),
    ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '10 days'),
    ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '1 day')
ON CONFLICT (blocker_id, blocked_id) DO NOTHING;

INSERT INTO message_reports (id, reporter_id, message_id, reason, status, created_at)
SELECT uuid_generate_v4(), '22222222-2222-2222-2222-222222222222', id, 'Spam content', 'pending', NOW()
FROM messages LIMIT 5;

INSERT INTO auth_audit_logs (id, user_id, action, ip_masked, created_at)
VALUES 
    (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'login_success', '192.168.1.***', NOW() - INTERVAL '2 hours'),
    (uuid_generate_v4(), '22222222-2222-2222-2222-222222222222', 'login_success', '10.0.0.***', NOW() - INTERVAL '5 hours'),
    (uuid_generate_v4(), '33333333-3333-3333-3333-333333333333', 'login_failure', '172.16.0.***', NOW() - INTERVAL '1 day'),
    (uuid_generate_v4(), '44444444-4444-4444-4444-444444444444', 'password_change', '192.168.1.***', NOW() - INTERVAL '3 days'),
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', 'login_success', '8.8.8.***', NOW() - INTERVAL '10 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO admin_audit_logs (id, admin_id, action_type, target_user_id, payload, created_at)
VALUES 
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', 'ban_user', '44444444-4444-4444-4444-444444444444', '{"reason": "Violation of terms"}', NOW() - INTERVAL '1 day'),
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', 'update_ad_network', NULL, '{"network": "admob", "enabled": true}', NOW() - INTERVAL '2 days'),
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', 'warn_user', '33333333-3333-3333-3333-333333333333', '{"reason": "Spam reports"}', NOW() - INTERVAL '3 days'),
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', 'resolve_report', '22222222-2222-2222-2222-222222222222', '{"action": "dismissed"}', NOW() - INTERVAL '4 days'),
    (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', 'system_config_update', NULL, '{"maintenance_mode": false}', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 9. METRICS
-- ==============================================================================
INSERT INTO metrics (id, key, value, recorded_at)
VALUES 
    (uuid_generate_v4(), 'active_users', 1500, NOW() - INTERVAL '5 days'),
    (uuid_generate_v4(), 'active_users', 1650, NOW() - INTERVAL '4 days'),
    (uuid_generate_v4(), 'active_users', 1700, NOW() - INTERVAL '3 days'),
    (uuid_generate_v4(), 'active_users', 1850, NOW() - INTERVAL '2 days'),
    (uuid_generate_v4(), 'active_users', 2100, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 10. ZRCS AD SYSTEM
-- ==============================================================================
INSERT INTO ad_global_settings (id, ads_enabled, test_mode, active_network, fallback_network, interstitial_gap_seconds)
VALUES 
    (1, true, true, 'admob', 'meta', 1800)
ON CONFLICT (id) DO UPDATE SET 
    ads_enabled = EXCLUDED.ads_enabled,
    test_mode = EXCLUDED.test_mode;

INSERT INTO ad_network_configs (id, network_key, app_id, is_active)
VALUES 
    (uuid_generate_v4(), 'admob', 'ca-app-pub-3940256099942544~3347511713', true),
    (uuid_generate_v4(), 'meta', '123456789012345', false),
    (uuid_generate_v4(), 'applovin', 'applovin_sdk_key_xyz', false),
    (uuid_generate_v4(), 'pangle', 'pangle_app_123', false),
    (uuid_generate_v4(), 'inmobi', 'inmobi_app_456', false)
ON CONFLICT (network_key) DO NOTHING;

INSERT INTO ad_placements (placement_key, enabled, min_delay_seconds)
VALUES 
    ('app_open', true, 14400),
    ('chat_list_native', true, 60),
    ('call_end_interstitial', true, 1800),
    ('settings_banner', true, 0),
    ('rewarded_unlock', false, 0)
ON CONFLICT (placement_key) DO NOTHING;

INSERT INTO ad_country_rules (id, country_code, ads_enabled, network_override)
VALUES 
    (uuid_generate_v4(), 'US', true, NULL),
    (uuid_generate_v4(), 'AE', true, 'meta'),
    (uuid_generate_v4(), 'UK', false, NULL),
    (uuid_generate_v4(), 'IN', true, 'admob'),
    (uuid_generate_v4(), 'CN', false, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ad_version_rules (id, app_version, ads_enabled, force_update)
VALUES 
    (uuid_generate_v4(), '1.0.0', false, true),
    (uuid_generate_v4(), '1.0.1', false, true),
    (uuid_generate_v4(), '1.1.0', true, false),
    (uuid_generate_v4(), '1.2.0', true, false),
    (uuid_generate_v4(), '2.0.0-beta', true, false)
ON CONFLICT (id) DO NOTHING;
