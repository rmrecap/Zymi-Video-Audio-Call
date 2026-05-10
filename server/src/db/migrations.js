import bcrypt from 'bcryptjs';
import { exec, get, all, run } from './postgres.js';

const tableExists = async (tableName) => {
  const result = await get(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return !!result;
};

const columnExists = async (tableName, columnName) => {
  const result = await get(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [tableName, columnName]
  );
  return !!result;
};

const indexExists = async (indexName) => {
  const result = await get(
    `SELECT indexname FROM pg_indexes
     WHERE schemaname = 'public' AND indexname = $1`,
    [indexName]
  );
  return !!result;
};

export const runMigrations = async () => {
  console.log('[MIGRATION] Starting PostgreSQL database migrations...');
  try {
    await exec('CREATE EXTENSION IF NOT EXISTS postgis');
    console.log('[MIGRATION] PostGIS extension enabled');
  } catch (e) {
    console.warn('[MIGRATION] PostGIS extension could not be enabled. Nearby features may fail:', e.message);
  }

  // ─── USERS ────────────────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      is_banned BOOLEAN DEFAULT FALSE,
      banned_at TIMESTAMP,
      avatar TEXT,
      token_version INTEGER DEFAULT 1,
      notification_sound BOOLEAN DEFAULT TRUE,
      call_ringtone BOOLEAN DEFAULT TRUE,
      theme TEXT DEFAULT 'dark',
      online_visibility BOOLEAN DEFAULT TRUE,
      read_receipt BOOLEAN DEFAULT TRUE,
      country TEXT,
      city TEXT,
      phone TEXT,
      phone_normalized TEXT,
      phone_verified BOOLEAN DEFAULT FALSE,
      display_name TEXT,
      status_text TEXT,
      email TEXT UNIQUE,
      email_verified BOOLEAN DEFAULT FALSE,
      profile_completion INTEGER DEFAULT 40,
      country_code TEXT,
      country_name TEXT,
      phone_country_iso TEXT,
      verification_status TEXT DEFAULT 'pending',
      last_login_at TIMESTAMP,
      location GEOMETRY(Point, 4326),
      last_location_update TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  if (!(await indexExists('idx_users_phone_normalized'))) {
    await exec('CREATE INDEX IF NOT EXISTS idx_users_phone_normalized ON users(phone_normalized)');
  }
  if (!(await indexExists('idx_users_email'))) {
    await exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL');
  }
  // if (!(await indexExists('idx_users_location'))) {
  //   await exec('CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(location)');
  // }
  console.log('[MIGRATION] users table ready');
  
  // Ensure necessary columns exist
  try {
    await exec('ALTER TABLE users ADD COLUMN IF NOT EXISTS location GEOMETRY(Point, 4326)');
    await exec('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP');
    await exec('ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code TEXT');
    await exec('ALTER TABLE users ADD COLUMN IF NOT EXISTS country_name TEXT');
    await exec('ALTER TABLE users ADD COLUMN IF NOT EXISTS city_name TEXT');
    console.log('[MIGRATION] users table columns verified');
  } catch (e) {
    console.warn('[MIGRATION] Could not verify/add columns to users:', e.message);
  }

  // ─── MESSAGES ─────────────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      receiver_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_read BOOLEAN DEFAULT FALSE,
      is_hidden BOOLEAN DEFAULT FALSE,
      deleted_at TIMESTAMP,
      deleted_by INTEGER,
      edited_at TIMESTAMP,
      previous_content TEXT,
      message_type TEXT DEFAULT 'text',
      file_url TEXT,
      file_name TEXT,
      file_size INTEGER,
      mime_type TEXT,
      location_lat DOUBLE PRECISION,
      location_lng DOUBLE PRECISION,
      conversation_id TEXT,
      message_text TEXT,
      delivery_status TEXT DEFAULT 'sent',
      client_message_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      delivered_at TIMESTAMP,
      read_at TIMESTAMP,
      metadata TEXT
    )
  `);
if (!(await indexExists('idx_messages_conversation'))) {
    try {
      await exec('CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)');
    } catch (e) {
      console.log('[MIGRATION] Skipping conversation_id index - column may not exist');
    }
  }
  if (!(await indexExists('idx_messages_client_id'))) {
    await exec('CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_message_id)');
  }

  // ─── ADMIN AUDIT LOGS ─────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER,
      action TEXT NOT NULL,
      target_user_id INTEGER,
      details TEXT,
      ip_address TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[MIGRATION] admin_audit_logs table ready');

  // ─── FEATURE FLAGS ────────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS feature_flags (
      id SERIAL PRIMARY KEY,
      feature_key TEXT UNIQUE NOT NULL,
      enabled BOOLEAN DEFAULT FALSE,
      description TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const flagsToSeed = [
    ['nearby_enabled', false, 'Discover users in proximity'],
    ['file_sharing_enabled', true, 'Allow users to send files'],
    ['video_call_enabled', true, 'Real-time video communication'],
    ['audio_call_enabled', true, 'Real-time voice communication'],
    ['location_sharing_enabled', true, 'Share map pins in chat'],
    ['ai_analysis_enabled', true, 'AI-powered chat insights'],
    ['report_system_enabled', true, 'User complaint system']
  ];
  for (const [key, enabled, desc] of flagsToSeed) {
    await run(
      'INSERT INTO feature_flags (feature_key, enabled, description) VALUES ($1, $2, $3) ON CONFLICT (feature_key) DO NOTHING',
      [key, enabled, desc]
    );
  }
  console.log('[MIGRATION] feature_flags table ready');

  // ─── FEATURE GEO RULES ────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS feature_geo_rules (
      id SERIAL PRIMARY KEY,
      feature_key TEXT NOT NULL REFERENCES feature_flags(feature_key),
      country_code TEXT,
      city_name TEXT,
      enabled BOOLEAN DEFAULT TRUE,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[MIGRATION] feature_geo_rules table ready');

  // ─── FEATURE USER RULES ───────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS feature_user_rules (
      id SERIAL PRIMARY KEY,
      feature_key TEXT NOT NULL REFERENCES feature_flags(feature_key),
      user_id INTEGER NOT NULL,
      enabled BOOLEAN DEFAULT TRUE,
      reason TEXT,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[MIGRATION] feature_user_rules table ready');

  // ─── USER REPORTS ─────────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS user_reports (
      id SERIAL PRIMARY KEY,
      reporter_id INTEGER NOT NULL,
      target_user_id INTEGER NOT NULL,
      feature_key TEXT,
      country_code TEXT,
      city_name TEXT,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      admin_note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[MIGRATION] user_reports table ready');

  // ─── USER LOCATION PREFERENCES ────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS user_location_preferences (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      discovery_enabled BOOLEAN DEFAULT FALSE,
      radius_km INTEGER DEFAULT 5,
      approximate_only BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[MIGRATION] user_location_preferences table ready');

  // ─── NEARBY VISIBILITY ────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS nearby_visibility (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      country_code TEXT,
      city_name TEXT,
      last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
  console.log('[MIGRATION] nearby_visibility table ready');

  // ─── NEARBY REPORTS ───────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS nearby_reports (
      id SERIAL PRIMARY KEY,
      reporter_id INTEGER NOT NULL REFERENCES users(id),
      target_id INTEGER NOT NULL REFERENCES users(id),
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[MIGRATION] nearby_reports table ready');

  // ─── NEARBY BLOCKS ────────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS nearby_blocks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      blocked_user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, blocked_user_id)
    )
  `);
  console.log('[MIGRATION] nearby_blocks table ready');

  // ─── NEARBY GLOBAL SETTINGS ───────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS nearby_global_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      default_radius_km INTEGER DEFAULT 5,
      report_threshold INTEGER DEFAULT 3,
      approximate_only BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await run(
    'INSERT INTO nearby_global_settings (id, default_radius_km, report_threshold, approximate_only) VALUES (1, 5, 3, TRUE) ON CONFLICT (id) DO NOTHING'
  );
  console.log('[MIGRATION] nearby_global_settings table ready');

  // ─── AD GLOBAL SETTINGS ───────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS ad_global_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      ads_enabled BOOLEAN DEFAULT TRUE,
      test_mode BOOLEAN DEFAULT FALSE,
      active_network TEXT DEFAULT 'admob',
      fallback_network TEXT DEFAULT 'applovin',
      interstitial_gap_seconds INTEGER DEFAULT 1800,
      native_refresh_seconds INTEGER DEFAULT 60,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await run(
    "INSERT INTO ad_global_settings (id, ads_enabled, test_mode, active_network) VALUES (1, TRUE, FALSE, 'admob') ON CONFLICT (id) DO NOTHING"
  );
  console.log('[MIGRATION] ad_global_settings table ready');

  // ─── AD NETWORK CONFIGS ───────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS ad_network_configs (
      id SERIAL PRIMARY KEY,
      network_key TEXT UNIQUE NOT NULL,
      sdk_key TEXT,
      app_id TEXT,
      interstitial_id TEXT,
      native_id TEXT,
      rewarded_id TEXT,
      banner_id TEXT,
      is_active BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  for (const net of ['admob', 'meta', 'applovin', 'pangle', 'inmobi']) {
    await run('INSERT INTO ad_network_configs (network_key) VALUES ($1) ON CONFLICT (network_key) DO NOTHING', [net]);
  }
  console.log('[MIGRATION] ad_network_configs table ready');

  // ─── AD PLACEMENTS ────────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS ad_placements (
      placement_key TEXT PRIMARY KEY,
      enabled BOOLEAN DEFAULT TRUE,
      min_delay_seconds INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const placements = [
    ['app_open', true],
    ['chat_list_native', true],
    ['call_end_interstitial', true],
    ['settings_banner', false],
    ['rewarded_unlock', true]
  ];
  for (const [key, enabled] of placements) {
    await run('INSERT INTO ad_placements (placement_key, enabled) VALUES ($1, $2) ON CONFLICT (placement_key) DO NOTHING', [key, enabled]);
  }
  console.log('[MIGRATION] ad_placements table ready');

  // ─── AD COUNTRY RULES ─────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS ad_country_rules (
      id SERIAL PRIMARY KEY,
      country_code TEXT NOT NULL,
      ads_enabled BOOLEAN DEFAULT TRUE,
      network_override TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[MIGRATION] ad_country_rules table ready');

  // ─── AD VERSION RULES ─────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS ad_version_rules (
      id SERIAL PRIMARY KEY,
      app_version TEXT NOT NULL,
      ads_enabled BOOLEAN DEFAULT TRUE,
      force_update BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[MIGRATION] ad_version_rules table ready');

  // ─── AD CONFIG AUDIT LOGS ─────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS ad_config_audit_logs (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER,
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_section TEXT,
      risk_level TEXT DEFAULT 'LOW',
      details TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[MIGRATION] ad_config_audit_logs table ready');

  // ─── EMAIL SETTINGS ───────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS email_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      provider TEXT DEFAULT 'gmail',
      smtp_host TEXT,
      smtp_port INTEGER,
      smtp_user TEXT,
      smtp_pass TEXT,
      smtp_secure BOOLEAN DEFAULT TRUE,
      gmail_user TEXT,
      gmail_app_password TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await run("INSERT INTO email_settings (id, provider) VALUES (1, 'gmail') ON CONFLICT (id) DO NOTHING");
  console.log('[MIGRATION] email_settings table ready');

  // ─── OTP TOKENS ───────────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS otp_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      otp_hash TEXT,
      token_hash TEXT,
      expires_at TIMESTAMP NOT NULL,
      is_used BOOLEAN DEFAULT FALSE,
      is_opened BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  if (!(await indexExists('idx_otp_token_hash'))) {
    await exec('CREATE INDEX IF NOT EXISTS idx_otp_token_hash ON otp_tokens(token_hash)');
  }
  console.log('[MIGRATION] otp_tokens table ready');

  // ─── AUTH AUDIT LOGS ──────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS auth_audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      action TEXT NOT NULL,
      masked_identifier TEXT,
      ip_address TEXT,
      status TEXT,
      details TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[MIGRATION] auth_audit_logs table ready');

  // ─── AD CONFIG SNAPSHOTS ──────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS ad_config_snapshots (
      id SERIAL PRIMARY KEY,
      snapshot_data TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[MIGRATION] ad_config_snapshots table ready');

  // ─── PROJECT PHASES ───────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS project_phases (
      id SERIAL PRIMARY KEY,
      phase_number INTEGER UNIQUE NOT NULL,
      phase_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      completion_percent INTEGER DEFAULT 0,
      risk_level TEXT DEFAULT 'LOW',
      summary TEXT,
      report_path TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const phases = [
    [53, 'Internal Phone Lookup + Governance', 'completed', 100, 'LOW', 'Internal lookup system to replace external redirects.'],
    [54, 'Advanced Auth + Self-hosted OTP', 'completed', 100, 'LOW', 'Email/Phone verification without third-party services.'],
    [55, 'Project Brain + Production Hardening', 'completed', 100, 'LOW', 'System monitoring, risk detection and roadmap governance.'],
    [56, 'Production QA + Release Gate', 'completed', 100, 'LOW', 'Verification, bug fixing, and release readiness.'],
    [57, 'Offline Queue + Notifications', 'completed', 100, 'LOW', 'Self-hosted messaging reliability, unread counts, and notification center.'],
    [58, 'P2P Local Media Transfer', 'completed', 100, 'LOW', 'WebRTC DataChannel media transfer with local-only storage policy.'],
    [59, 'Coturn TURN + Dynamic Connectivity', 'completed', 100, 'LOW', 'Self-hosted STUN/TURN fallback and region-based connectivity policies.'],
    [60, 'Production Observability + Cost Guard', 'in_progress', 50, 'LOW', 'Real TURN health checks, usage tracking, and bandwidth cost guard.']
  ];
  for (const [num, name, status, pct, risk, sum] of phases) {
    await run(
      `INSERT INTO project_phases (phase_number, phase_name, status, completion_percent, risk_level, summary)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (phase_number) DO UPDATE SET status = $3, completion_percent = $4`,
      [num, name, status, pct, risk, sum]
    );
  }
  console.log('[MIGRATION] project_phases table ready');

  // ─── CONVERSATION STATES ──────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS conversation_states (
      id SERIAL PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      last_read_message_id INTEGER,
      unread_count INTEGER DEFAULT 0,
      muted BOOLEAN DEFAULT FALSE,
      archived BOOLEAN DEFAULT FALSE,
      pinned BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(conversation_id, user_id)
    )
  `);
  if (!(await indexExists('idx_conv_state_user'))) {
    await exec('CREATE INDEX IF NOT EXISTS idx_conv_state_user ON conversation_states(user_id)');
  }
  console.log('[MIGRATION] conversation_states table ready');

  // ─── IN-APP NOTIFICATIONS ─────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS in_app_notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      related_user_id INTEGER,
      related_conversation_id TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  if (!(await indexExists('idx_notifications_user'))) {
    await exec('CREATE INDEX IF NOT EXISTS idx_notifications_user ON in_app_notifications(user_id)');
  }
  console.log('[MIGRATION] in_app_notifications table ready');

  // ─── MEDIA MESSAGES ───────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS media_messages (
      id SERIAL PRIMARY KEY,
      message_id INTEGER NOT NULL REFERENCES messages(id),
      conversation_id TEXT NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      media_type TEXT NOT NULL,
      file_id TEXT UNIQUE NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      local_sender_path_hash TEXT,
      receiver_local_path_hash TEXT,
      transfer_status TEXT DEFAULT 'pending',
      data_channel_session_id TEXT,
      checksum TEXT,
      thumbnail_metadata_json TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      expires_at TIMESTAMP
    )
  `);
  if (!(await indexExists('idx_media_conv'))) {
    await exec('CREATE INDEX IF NOT EXISTS idx_media_conv ON media_messages(conversation_id)');
  }
  if (!(await indexExists('idx_media_file_id'))) {
    await exec('CREATE INDEX IF NOT EXISTS idx_media_file_id ON media_messages(file_id)');
  }
  console.log('[MIGRATION] media_messages table ready');

  // ─── MEDIA TRANSFER SESSIONS ──────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS media_transfer_sessions (
      id SERIAL PRIMARY KEY,
      session_id TEXT UNIQUE NOT NULL,
      message_id INTEGER NOT NULL REFERENCES messages(id),
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      status TEXT DEFAULT 'offered',
      chunk_size INTEGER DEFAULT 16384,
      total_chunks INTEGER DEFAULT 0,
      transferred_chunks INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[MIGRATION] media_transfer_sessions table ready');

  // ─── TURN SERVERS ─────────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS turn_servers (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER NOT NULL,
      protocol TEXT DEFAULT 'udp',
      username TEXT,
      credential TEXT,
      region TEXT,
      priority INTEGER DEFAULT 100,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[MIGRATION] turn_servers table ready');

  // ─── TURN HEALTH CHECKS ───────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS turn_health_checks (
      id SERIAL PRIMARY KEY,
      turn_server_id INTEGER NOT NULL REFERENCES turn_servers(id),
      status TEXT NOT NULL,
      udp_reachable BOOLEAN DEFAULT FALSE,
      tcp_reachable BOOLEAN DEFAULT FALSE,
      tls_reachable BOOLEAN DEFAULT FALSE,
      latency_ms INTEGER,
      error_message TEXT,
      checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[MIGRATION] turn_health_checks table ready');

  // ─── RELAY USAGE STATS ────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS relay_usage_stats (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      country_iso TEXT,
      connection_type TEXT,
      relay_mode TEXT,
      bytes_estimated INTEGER DEFAULT 0,
      duration_seconds INTEGER DEFAULT 0,
      session_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[MIGRATION] relay_usage_stats table ready');

  // ─── RELAY COST GUARD RULES ───────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS relay_cost_guard_rules (
      id SERIAL PRIMARY KEY,
      rule_name TEXT NOT NULL,
      country_iso TEXT,
      max_relay_minutes_per_user_daily INTEGER DEFAULT 60,
      max_media_mb_per_user_daily INTEGER DEFAULT 500,
      force_turn_allowed BOOLEAN DEFAULT TRUE,
      alert_threshold_percent INTEGER DEFAULT 80,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await run(
    "INSERT INTO relay_cost_guard_rules (rule_name, country_iso) VALUES ('Global Default Guard', NULL) ON CONFLICT DO NOTHING"
  );
  console.log('[MIGRATION] relay_cost_guard_rules table ready');

  // ─── BLOCKED USERS ────────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS blocked_users (
      id SERIAL PRIMARY KEY,
      blocker_id INTEGER NOT NULL,
      blocked_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(blocker_id, blocked_id)
    )
  `);
  console.log('[MIGRATION] blocked_users table ready');

  // ─── MESSAGE REPORTS ──────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS message_reports (
      id SERIAL PRIMARY KEY,
      message_id INTEGER NOT NULL REFERENCES messages(id),
      reporter_id INTEGER NOT NULL REFERENCES users(id),
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      admin_id INTEGER REFERENCES users(id),
      admin_action TEXT,
      action_details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP
    )
  `);
  console.log('[MIGRATION] message_reports table ready');

  // ─── CALL HISTORY ─────────────────────────────────────────────────────────
  await exec(`
    CREATE TABLE IF NOT EXISTS call_history (
      id SERIAL PRIMARY KEY,
      caller_id INTEGER NOT NULL REFERENCES users(id),
      receiver_id INTEGER NOT NULL REFERENCES users(id),
      call_type TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      answered_at TIMESTAMP,
      ended_at TIMESTAMP,
      duration INTEGER DEFAULT 0
    )
  `);
  console.log('[MIGRATION] call_history table ready');

  console.log('[MIGRATION] All PostgreSQL migrations complete ✓');
};

export const getMigrationStatus = async () => {
  const tableNames = [
    'users', 'messages', 'admin_audit_logs', 'call_history',
    'blocked_users', 'message_reports', 'feature_flags',
    'otp_tokens', 'turn_servers', 'relay_usage_stats'
  ];

  const results = [];
  for (const table of tableNames) {
    const exists = await tableExists(table);
    results.push({ name: `${table} table`, exists });
  }

  const colChecks = [
    ['users', 'role'],
    ['users', 'is_banned'],
    ['users', 'email'],
    ['messages', 'is_read'],
    ['messages', 'conversation_id'],
    ['call_history', 'answered_at']
  ];
  for (const [table, col] of colChecks) {
    const exists = await columnExists(table, col);
    results.push({ name: `${table}.${col} column`, exists });
  }

  return results;
};
