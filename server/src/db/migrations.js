import bcrypt from 'bcryptjs';
import { exec, get, all, run } from './database.js';

const tableExists = (tableName) => {
  const result = get("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", tableName);
  return !!result;
};

const columnExists = (tableName, columnName) => {
  if (!tableExists(tableName)) return false;
  const columns = all(`PRAGMA table_info(${tableName})`);
  return columns.some(col => col.name === columnName);
};

export const runMigrations = () => {
  console.log('[MIGRATION] Starting database migrations...');
  
  if (!tableExists('users')) {
    exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_banned INTEGER DEFAULT 0,
        banned_at DATETIME
      )
    `);
    console.log('[MIGRATION] Created users table');
  }
  
  if (!columnExists('users', 'role')) {
    exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
    console.log('[MIGRATION] Added role column to users');
  }
  
  if (!columnExists('users', 'is_banned')) {
    exec("ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0");
    console.log('[MIGRATION] Added is_banned column to users');
  }
  
   if (!columnExists('users', 'banned_at')) {
     exec("ALTER TABLE users ADD COLUMN banned_at DATETIME");
     console.log('[MIGRATION] Added banned_at column to users');
   }

   if (!columnExists('users', 'avatar')) {
     exec("ALTER TABLE users ADD COLUMN avatar TEXT");
     console.log('[MIGRATION] Added avatar column to users');
   }

   if (!columnExists('users', 'token_version')) {
     exec("ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1");
     console.log('[MIGRATION] Added token_version column to users');
   }

   if (!columnExists('users', 'notification_sound')) {
     exec("ALTER TABLE users ADD COLUMN notification_sound INTEGER DEFAULT 1");
     console.log('[MIGRATION] Added notification_sound column to users');
   }

   if (!columnExists('users', 'call_ringtone')) {
     exec("ALTER TABLE users ADD COLUMN call_ringtone INTEGER DEFAULT 1");
     console.log('[MIGRATION] Added call_ringtone column to users');
   }

   if (!columnExists('users', 'theme')) {
     exec("ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'dark'");
     console.log('[MIGRATION] Added theme column to users');
   }

   if (!columnExists('users', 'online_visibility')) {
     exec("ALTER TABLE users ADD COLUMN online_visibility INTEGER DEFAULT 1");
     console.log('[MIGRATION] Added online_visibility column to users');
   }

   if (!columnExists('users', 'read_receipt')) {
     exec("ALTER TABLE users ADD COLUMN read_receipt INTEGER DEFAULT 1");
     console.log('[MIGRATION] Added read_receipt column to users');
   }

   if (!columnExists('users', 'country')) {
     exec("ALTER TABLE users ADD COLUMN country TEXT");
     console.log('[MIGRATION] Added country column to users');
   }

    if (!columnExists('users', 'city')) {
      exec("ALTER TABLE users ADD COLUMN city TEXT");
      console.log('[MIGRATION] Added city column to users');
    }

    if (!columnExists('users', 'phone')) {
      exec("ALTER TABLE users ADD COLUMN phone TEXT");
      console.log('[MIGRATION] Added phone column to users');
    }

    if (!columnExists('users', 'phone_normalized')) {
      exec("ALTER TABLE users ADD COLUMN phone_normalized TEXT");
      exec("CREATE INDEX IF NOT EXISTS idx_users_phone_normalized ON users(phone_normalized)");
      console.log('[MIGRATION] Added phone_normalized column and index to users');
    }

    if (!columnExists('users', 'phone_verified')) {
      exec("ALTER TABLE users ADD COLUMN phone_verified INTEGER DEFAULT 0");
      console.log('[MIGRATION] Added phone_verified column to users');
    }

    if (!columnExists('users', 'display_name')) {
      exec("ALTER TABLE users ADD COLUMN display_name TEXT");
      console.log('[MIGRATION] Added display_name column to users');
    }

    if (!columnExists('users', 'status_text')) {
      exec("ALTER TABLE users ADD COLUMN status_text TEXT");
      console.log('[MIGRATION] Added status_text column to users');
    }
    if (!columnExists('users', 'password_hash') && columnExists('users', 'password')) {
      exec("ALTER TABLE users RENAME COLUMN password TO password_hash");
      console.log('[MIGRATION] Renamed password column to password_hash in users');
    }
  
  if (!tableExists('messages')) {
    exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_read INTEGER DEFAULT 0,
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (receiver_id) REFERENCES users(id)
      )
    `);
    console.log('[MIGRATION] Created messages table');
  }
  
   if (!columnExists('messages', 'is_read')) {
     exec("ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0");
     console.log('[MIGRATION] Added is_read column to messages');
   }

   if (!columnExists('messages', 'is_hidden')) {
     exec("ALTER TABLE messages ADD COLUMN is_hidden INTEGER DEFAULT 0");
     console.log('[MIGRATION] Added is_hidden column to messages');
   }

   if (!columnExists('messages', 'deleted_at')) {
     exec("ALTER TABLE messages ADD COLUMN deleted_at DATETIME");
     console.log('[MIGRATION] Added deleted_at column to messages');
   }

   if (!columnExists('messages', 'deleted_by')) {
     exec("ALTER TABLE messages ADD COLUMN deleted_by INTEGER");
     console.log('[MIGRATION] Added deleted_by column to messages');
   }

   if (!columnExists('messages', 'edited_at')) {
     exec("ALTER TABLE messages ADD COLUMN edited_at DATETIME");
     console.log('[MIGRATION] Added edited_at column to messages');
   }

if (!columnExists('messages', 'previous_content')) {
      exec("ALTER TABLE messages ADD COLUMN previous_content TEXT");
      console.log('[MIGRATION] Added previous_content column to messages');
    }

    if (!columnExists('messages', 'message_type')) {
      exec("ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT 'text'");
      console.log('[MIGRATION] Added message_type column to messages');
    }

    if (!columnExists('messages', 'file_url')) {
      exec("ALTER TABLE messages ADD COLUMN file_url TEXT");
      console.log('[MIGRATION] Added file_url column to messages');
    }

    if (!columnExists('messages', 'file_name')) {
      exec("ALTER TABLE messages ADD COLUMN file_name TEXT");
      console.log('[MIGRATION] Added file_name column to messages');
    }

    if (!columnExists('messages', 'file_size')) {
      exec("ALTER TABLE messages ADD COLUMN file_size INTEGER");
      console.log('[MIGRATION] Added file_size column to messages');
    }

    if (!columnExists('messages', 'mime_type')) {
      exec("ALTER TABLE messages ADD COLUMN mime_type TEXT");
      console.log('[MIGRATION] Added mime_type column to messages');
    }

    if (!columnExists('messages', 'location_lat')) {
      exec("ALTER TABLE messages ADD COLUMN location_lat REAL");
      console.log('[MIGRATION] Added location_lat column to messages');
    }

    if (!columnExists('messages', 'location_lng')) {
      exec("ALTER TABLE messages ADD COLUMN location_lng REAL");
      console.log('[MIGRATION] Added location_lng column to messages');
    }
  
  if (!tableExists('admin_audit_logs')) {
    exec(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER,
        action TEXT NOT NULL,
        target_user_id INTEGER,
        details TEXT,
        ip_address TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATION] Created admin_audit_logs table');
  }

  if (!tableExists('feature_flags')) {
    exec(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_key TEXT UNIQUE NOT NULL,
        enabled INTEGER DEFAULT 0,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATION] Created feature_flags table');
    
    // Seed initial flags
    const flags = [
      ['nearby_enabled', 0, 'Discover users in proximity'],
      ['file_sharing_enabled', 1, 'Allow users to send files'],
      ['video_call_enabled', 1, 'Real-time video communication'],
      ['audio_call_enabled', 1, 'Real-time voice communication'],
      ['location_sharing_enabled', 1, 'Share map pins in chat'],
      ['ai_analysis_enabled', 1, 'AI-powered chat insights'],
      ['report_system_enabled', 1, 'User complaint system']
    ];
    
    flags.forEach(([key, enabled, desc]) => {
      run("INSERT INTO feature_flags (feature_key, enabled, description) VALUES (?, ?, ?)", key, enabled, desc);
    });
  }

  if (!tableExists('feature_geo_rules')) {
    exec(`
      CREATE TABLE IF NOT EXISTS feature_geo_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_key TEXT NOT NULL,
        country_code TEXT,
        city_name TEXT,
        enabled INTEGER DEFAULT 1,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feature_key) REFERENCES feature_flags(feature_key)
      )
    `);
    console.log('[MIGRATION] Created feature_geo_rules table');
  }

  if (!tableExists('feature_user_rules')) {
    exec(`
      CREATE TABLE IF NOT EXISTS feature_user_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_key TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        enabled INTEGER DEFAULT 1,
        reason TEXT,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feature_key) REFERENCES feature_flags(feature_key)
      )
    `);
    console.log('[MIGRATION] Created feature_user_rules table');
  }

  if (!tableExists('user_reports')) {
    exec(`
      CREATE TABLE IF NOT EXISTS user_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reporter_id INTEGER NOT NULL,
        target_user_id INTEGER NOT NULL,
        feature_key TEXT,
        country_code TEXT,
        city_name TEXT,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        admin_note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATION] Created user_reports table');
  }

  if (!tableExists('user_location_preferences')) {
    exec(`
      CREATE TABLE IF NOT EXISTS user_location_preferences (
        user_id INTEGER PRIMARY KEY,
        discovery_enabled INTEGER DEFAULT 0,
        radius_km INTEGER DEFAULT 5,
        approximate_only INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('[MIGRATION] Created user_location_preferences table');
  }

  if (!tableExists('nearby_visibility')) {
    exec(`
      CREATE TABLE IF NOT EXISTS nearby_visibility (
        user_id INTEGER PRIMARY KEY,
        lat REAL,
        lng REAL,
        country_code TEXT,
        city_name TEXT,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('[MIGRATION] Created nearby_visibility table');
  }

  if (!tableExists('nearby_reports')) {
    exec(`
      CREATE TABLE IF NOT EXISTS nearby_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reporter_id INTEGER NOT NULL,
        target_id INTEGER NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(id),
        FOREIGN KEY (target_id) REFERENCES users(id)
      )
    `);
    console.log('[MIGRATION] Created nearby_reports table');
  }

  if (!tableExists('nearby_blocks')) {
    exec(`
      CREATE TABLE IF NOT EXISTS nearby_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        blocked_user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (blocked_user_id) REFERENCES users(id),
        UNIQUE(user_id, blocked_user_id)
      )
    `);
    console.log('[MIGRATION] Created nearby_blocks table');
  }

  if (!tableExists('nearby_global_settings')) {
    exec(`
      CREATE TABLE IF NOT EXISTS nearby_global_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        default_radius_km INTEGER DEFAULT 5,
        report_threshold INTEGER DEFAULT 3,
        approximate_only INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    exec('INSERT OR IGNORE INTO nearby_global_settings (id, default_radius_km, report_threshold, approximate_only) VALUES (1, 5, 3, 1)');
    console.log('[MIGRATION] Created nearby_global_settings table');
  }

  // ZRCS - Ad Control Tables
  if (!tableExists('ad_global_settings')) {
    exec(`
      CREATE TABLE IF NOT EXISTS ad_global_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        ads_enabled INTEGER DEFAULT 1,
        test_mode INTEGER DEFAULT 0,
        active_network TEXT DEFAULT 'admob',
        fallback_network TEXT DEFAULT 'applovin',
        interstitial_gap_seconds INTEGER DEFAULT 1800,
        native_refresh_seconds INTEGER DEFAULT 60,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    exec("INSERT OR IGNORE INTO ad_global_settings (id, ads_enabled, test_mode, active_network) VALUES (1, 1, 0, 'admob')");
    console.log('[MIGRATION] Created ad_global_settings table');
  }

  if (!tableExists('ad_network_configs')) {
    exec(`
      CREATE TABLE IF NOT EXISTS ad_network_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        network_key TEXT UNIQUE NOT NULL,
        sdk_key TEXT,
        app_id TEXT,
        interstitial_id TEXT,
        native_id TEXT,
        rewarded_id TEXT,
        banner_id TEXT,
        is_active INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const networks = ['admob', 'meta', 'applovin', 'pangle', 'inmobi'];
    networks.forEach(net => {
      run("INSERT OR IGNORE INTO ad_network_configs (network_key) VALUES (?)", net);
    });
    console.log('[MIGRATION] Created ad_network_configs table');
  }

  if (!tableExists('ad_placements')) {
    exec(`
      CREATE TABLE IF NOT EXISTS ad_placements (
        placement_key TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 1,
        min_delay_seconds INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const placements = [
      ['app_open', 1],
      ['chat_list_native', 1],
      ['call_end_interstitial', 1],
      ['settings_banner', 0],
      ['rewarded_unlock', 1]
    ];
    placements.forEach(([key, enabled]) => {
      run("INSERT OR IGNORE INTO ad_placements (placement_key, enabled) VALUES (?, ?)", key, enabled);
    });
    console.log('[MIGRATION] Created ad_placements table');
  }

  if (!tableExists('ad_country_rules')) {
    exec(`
      CREATE TABLE IF NOT EXISTS ad_country_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        country_code TEXT NOT NULL,
        ads_enabled INTEGER DEFAULT 1,
        network_override TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATION] Created ad_country_rules table');
  }

  if (!tableExists('ad_version_rules')) {
    exec(`
      CREATE TABLE IF NOT EXISTS ad_version_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_version TEXT NOT NULL,
        ads_enabled INTEGER DEFAULT 1,
        force_update INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATION] Created ad_version_rules table');
  }

  if (!tableExists('ad_config_audit_logs')) {
    exec(`
      CREATE TABLE IF NOT EXISTS ad_config_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER,
        action TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_section TEXT,
        risk_level TEXT DEFAULT 'LOW',
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATION] Created ad_config_audit_logs table');
  } else {
    // Add new columns if they don't exist
    if (!columnExists('ad_config_audit_logs', 'old_value')) {
      exec("ALTER TABLE ad_config_audit_logs ADD COLUMN old_value TEXT");
    }
    if (!columnExists('ad_config_audit_logs', 'new_value')) {
      exec("ALTER TABLE ad_config_audit_logs ADD COLUMN new_value TEXT");
    }
    if (!columnExists('ad_config_audit_logs', 'changed_section')) {
      exec("ALTER TABLE ad_config_audit_logs ADD COLUMN changed_section TEXT");
    }
    if (!columnExists('ad_config_audit_logs', 'risk_level')) {
      exec("ALTER TABLE ad_config_audit_logs ADD COLUMN risk_level TEXT DEFAULT 'LOW'");
    }
  }

  if (!columnExists('users', 'email')) {
    exec("ALTER TABLE users ADD COLUMN email TEXT");
    exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
    console.log('[MIGRATION] Added email column to users');
  }

  if (!columnExists('users', 'email_verified')) {
    exec("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0");
    console.log('[MIGRATION] Added email_verified column to users');
  }

  if (!columnExists('users', 'profile_completion')) {
    exec("ALTER TABLE users ADD COLUMN profile_completion INTEGER DEFAULT 40");
    console.log('[MIGRATION] Added profile_completion column to users');
  }

  if (!columnExists('users', 'country_code')) {
    exec("ALTER TABLE users ADD COLUMN country_code TEXT");
    console.log('[MIGRATION] Added country_code column to users');
  }

  if (!columnExists('users', 'country_name')) {
    exec("ALTER TABLE users ADD COLUMN country_name TEXT");
    console.log('[MIGRATION] Added country_name column to users');
  }

  if (!columnExists('users', 'phone_country_iso')) {
    exec("ALTER TABLE users ADD COLUMN phone_country_iso TEXT");
    console.log('[MIGRATION] Added phone_country_iso column to users');
  }

  if (!columnExists('users', 'verification_status')) {
    exec("ALTER TABLE users ADD COLUMN verification_status TEXT DEFAULT 'pending'");
    console.log('[MIGRATION] Added verification_status column to users');
  }

  if (!columnExists('users', 'last_login_at')) {
    exec("ALTER TABLE users ADD COLUMN last_login_at DATETIME");
    console.log('[MIGRATION] Added last_login_at column to users');
  }

  if (!tableExists('email_settings')) {
    exec(`
      CREATE TABLE IF NOT EXISTS email_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        provider TEXT DEFAULT 'gmail', -- 'gmail' or 'smtp'
        smtp_host TEXT,
        smtp_port INTEGER,
        smtp_user TEXT,
        smtp_pass TEXT, -- Encrypted
        smtp_secure INTEGER DEFAULT 1,
        gmail_user TEXT,
        gmail_app_password TEXT, -- Encrypted
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    exec("INSERT OR IGNORE INTO email_settings (id, provider) VALUES (1, 'gmail')");
    console.log('[MIGRATION] Created email_settings table');
  }

  if (!tableExists('otp_tokens')) {
    exec(`
      CREATE TABLE IF NOT EXISTS otp_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- 'email' or 'phone'
        otp_hash TEXT,
        token_hash TEXT,
        expires_at DATETIME NOT NULL,
        is_used INTEGER DEFAULT 0,
        is_opened INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    exec("CREATE INDEX IF NOT EXISTS idx_otp_token_hash ON otp_tokens(token_hash)");
    console.log('[MIGRATION] Created otp_tokens table');
  }

  if (!tableExists('auth_audit_logs')) {
    exec(`
      CREATE TABLE IF NOT EXISTS auth_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        masked_identifier TEXT, -- Masked email or phone
        ip_address TEXT,
        status TEXT, -- 'success', 'failed'
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATION] Created auth_audit_logs table');
  }

  if (!tableExists('ad_config_snapshots')) {
    exec(`
      CREATE TABLE IF NOT EXISTS ad_config_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATION] Created ad_config_snapshots table');
  }

  // Phase 55: Project Brain Tables
  if (!tableExists('project_phases')) {
    exec(`
      CREATE TABLE IF NOT EXISTS project_phases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phase_number INTEGER UNIQUE NOT NULL,
        phase_name TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        completion_percent INTEGER DEFAULT 0,
        risk_level TEXT DEFAULT 'LOW',
        summary TEXT,
        report_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATION] Created project_phases table');

    // Seed existing phases
    const phases = [
      [53, 'Internal Phone Lookup + Governance', 'completed', 100, 'LOW', 'Internal lookup system to replace external redirects.'],
      [54, 'Advanced Auth + Self-hosted OTP', 'completed', 100, 'LOW', 'Email/Phone verification without third-party services.'],
      [55, 'Project Brain + Production Hardening', 'completed', 100, 'LOW', 'System monitoring, risk detection and roadmap governance.'],
      [56, 'Production QA + Release Gate', 'in_progress', 10, 'LOW', 'Verification, bug fixing, and release readiness.']
    ];
    phases.forEach(([num, name, status, pct, risk, sum]) => {
      run("INSERT INTO project_phases (phase_number, phase_name, status, completion_percent, risk_level, summary) VALUES (?, ?, ?, ?, ?, ?)", num, name, status, pct, risk, sum);
    });
  }

  // Phase 56: Production QA + Release Gate
  if (tableExists('project_phases')) {
    run("UPDATE project_phases SET status = 'completed', completion_percent = 100 WHERE phase_number = 56");
  }

  // Phase 57: Offline Message Queue + Unread Counter + In-App Notification Center
  if (tableExists('project_phases')) {
    const p57 = get("SELECT * FROM project_phases WHERE phase_number = 57");
    if (!p57) {
      run("INSERT INTO project_phases (phase_number, phase_name, status, completion_percent, risk_level, summary) VALUES (57, 'Offline Queue + Notifications', 'completed', 100, 'LOW', 'Self-hosted messaging reliability, unread counts, and notification center.')");
    } else {
      run("UPDATE project_phases SET status = 'completed', completion_percent = 100 WHERE phase_number = 57");
    }
    
    const p58 = get("SELECT * FROM project_phases WHERE phase_number = 58");
    if (!p58) {
      run("INSERT INTO project_phases (phase_number, phase_name, status, completion_percent, risk_level, summary) VALUES (58, 'P2P Local Media Transfer', 'in_progress', 0, 'LOW', 'WebRTC DataChannel media transfer with local-only storage policy.')");
    }
  }

  // Extend messages table for Phase 57 (preserved)
  if (tableExists('messages')) {
    if (!columnExists('messages', 'conversation_id')) {
      exec("ALTER TABLE messages ADD COLUMN conversation_id TEXT");
      exec("CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)");
    }
    if (!columnExists('messages', 'message_text')) {
      exec("ALTER TABLE messages ADD COLUMN message_text TEXT");
    }
    if (!columnExists('messages', 'delivery_status')) {
      exec("ALTER TABLE messages ADD COLUMN delivery_status TEXT DEFAULT 'sent'");
    }
    if (!columnExists('messages', 'client_message_id')) {
      exec("ALTER TABLE messages ADD COLUMN client_message_id TEXT");
      exec("CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_message_id)");
    }
    if (!columnExists('messages', 'created_at')) {
      exec("ALTER TABLE messages ADD COLUMN created_at DATETIME");
    }
    if (!columnExists('messages', 'delivered_at')) {
      exec("ALTER TABLE messages ADD COLUMN delivered_at DATETIME");
    }
    if (!columnExists('messages', 'read_at')) {
      exec("ALTER TABLE messages ADD COLUMN read_at DATETIME");
    }
    if (!columnExists('messages', 'metadata')) {
      exec("ALTER TABLE messages ADD COLUMN metadata TEXT");
    }
  }

  // Create conversation_states table (Phase 57)
  if (!tableExists('conversation_states')) {
    exec(`
      CREATE TABLE IF NOT EXISTS conversation_states (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        last_read_message_id INTEGER,
        unread_count INTEGER DEFAULT 0,
        muted INTEGER DEFAULT 0,
        archived INTEGER DEFAULT 0,
        pinned INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(conversation_id, user_id)
      )
    `);
    exec("CREATE INDEX IF NOT EXISTS idx_conv_state_user ON conversation_states(user_id)");
  }

  // Create in_app_notifications table (Phase 57)
  if (!tableExists('in_app_notifications')) {
    exec(`
      CREATE TABLE IF NOT EXISTS in_app_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        related_user_id INTEGER,
        related_conversation_id TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    exec("CREATE INDEX IF NOT EXISTS idx_notifications_user ON in_app_notifications(user_id)");
  }

  // Phase 58: Media Messages (Index only, no files on server)
  if (!tableExists('media_messages')) {
    exec(`
      CREATE TABLE IF NOT EXISTS media_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL,
        conversation_id TEXT NOT NULL,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        media_type TEXT NOT NULL, -- image, video, voice, file
        file_id TEXT UNIQUE NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        local_sender_path_hash TEXT,
        receiver_local_path_hash TEXT,
        transfer_status TEXT DEFAULT 'pending', -- pending, transferring, completed, failed, expired
        data_channel_session_id TEXT,
        checksum TEXT,
        thumbnail_metadata_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        expires_at DATETIME,
        FOREIGN KEY (message_id) REFERENCES messages(id)
      )
    `);
    exec("CREATE INDEX IF NOT EXISTS idx_media_conv ON media_messages(conversation_id)");
    exec("CREATE INDEX IF NOT EXISTS idx_media_file_id ON media_messages(file_id)");
    console.log('[MIGRATION] Created media_messages table');
  }

  // Phase 58: Media Transfer Sessions
  if (!tableExists('media_transfer_sessions')) {
    exec(`
      CREATE TABLE IF NOT EXISTS media_transfer_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        message_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        status TEXT DEFAULT 'offered', -- offered, accepted, transferring, completed, failed
        chunk_size INTEGER DEFAULT 16384,
        total_chunks INTEGER DEFAULT 0,
        transferred_chunks INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages(id)
      )
    `);
    console.log('[MIGRATION] Created media_transfer_sessions table');
  }

  // Phase 59: Coturn TURN Relay + Dynamic Connectivity Control
  if (tableExists('project_phases')) {
    run("UPDATE project_phases SET status = 'completed', completion_percent = 100 WHERE phase_number = 58");
    
    const p59 = get("SELECT * FROM project_phases WHERE phase_number = 59");
    if (!p59) {
      run("INSERT INTO project_phases (phase_number, phase_name, status, completion_percent, risk_level, summary) VALUES (59, 'Coturn TURN + Dynamic Connectivity', 'in_progress', 0, 'LOW', 'Self-hosted STUN/TURN fallback and region-based connectivity policies.')");
    }
  }

  // Phase 60: Production Observability + Real Coturn Validation + Cost Guard
  if (tableExists('project_phases')) {
    run("UPDATE project_phases SET status = 'completed', completion_percent = 100 WHERE phase_number = 59");
    
    const p60 = get("SELECT * FROM project_phases WHERE phase_number = 60");
    if (!p60) {
      run("INSERT INTO project_phases (phase_number, phase_name, status, completion_percent, risk_level, summary) VALUES (60, 'Production Observability + Cost Guard', 'in_progress', 0, 'LOW', 'Real TURN health checks, usage tracking, and bandwidth cost guard.')");
    }
  }

  if (!tableExists('turn_health_checks')) {
    exec(`
      CREATE TABLE IF NOT EXISTS turn_health_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        turn_server_id INTEGER NOT NULL,
        status TEXT NOT NULL, -- ok, warning, failed
        udp_reachable INTEGER DEFAULT 0,
        tcp_reachable INTEGER DEFAULT 0,
        tls_reachable INTEGER DEFAULT 0,
        latency_ms INTEGER,
        error_message TEXT,
        checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (turn_server_id) REFERENCES turn_servers(id)
      )
    `);
    console.log('[MIGRATION] Created turn_health_checks table');
  }

  if (!tableExists('relay_usage_stats')) {
    exec(`
      CREATE TABLE IF NOT EXISTS relay_usage_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        country_iso TEXT,
        connection_type TEXT, -- call, media
        relay_mode TEXT, -- direct, turn_udp, turn_tcp, turn_tls
        bytes_estimated INTEGER DEFAULT 0,
        duration_seconds INTEGER DEFAULT 0,
        session_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATION] Created relay_usage_stats table');
  }

  if (!tableExists('relay_cost_guard_rules')) {
    exec(`
      CREATE TABLE IF NOT EXISTS relay_cost_guard_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_name TEXT NOT NULL,
        country_iso TEXT, -- NULL for global
        max_relay_minutes_per_user_daily INTEGER DEFAULT 60,
        max_media_mb_per_user_daily INTEGER DEFAULT 500,
        force_turn_allowed INTEGER DEFAULT 1,
        alert_threshold_percent INTEGER DEFAULT 80,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[MIGRATION] Created relay_cost_guard_rules table');
    
    // Seed global rule
    run("INSERT INTO relay_cost_guard_rules (rule_name, country_iso) VALUES ('Global Default Guard', NULL)");
  }

  console.log('[MIGRATION] Database migrations complete');
};

export const getMigrationStatus = () => {
  const migrations = [];
  
  migrations.push({ name: 'users table', exists: tableExists('users') });
  migrations.push({ name: 'messages table', exists: tableExists('messages') });
  migrations.push({ name: 'admin_audit_logs table', exists: tableExists('admin_audit_logs') });
  migrations.push({ name: 'users.role column', exists: columnExists('users', 'role') });
  migrations.push({ name: 'users.is_banned column', exists: columnExists('users', 'is_banned') });
  migrations.push({ name: 'messages.is_read column', exists: columnExists('messages', 'is_read') });
  
  return migrations;
};