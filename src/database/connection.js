const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'automod.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  -- Guild settings
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    automod_enabled INTEGER DEFAULT 1,
    log_channel_id TEXT,
    mute_role_id TEXT,
    warn_threshold INTEGER DEFAULT 3,
    mute_duration INTEGER DEFAULT 3600,
    ban_threshold INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Filter settings
  CREATE TABLE IF NOT EXISTS filter_settings (
    guild_id TEXT PRIMARY KEY,
    anti_spam_enabled INTEGER DEFAULT 1,
    anti_spam_sensitivity INTEGER DEFAULT 3,
    anti_link_enabled INTEGER DEFAULT 0,
    anti_link_whitelist TEXT,
    anti_invite_enabled INTEGER DEFAULT 1,
    anti_mention_enabled INTEGER DEFAULT 1,
    anti_mention_limit INTEGER DEFAULT 5,
    profanity_filter_enabled INTEGER DEFAULT 1,
    profanity_filter_strictness INTEGER DEFAULT 2,
    caps_filter_enabled INTEGER DEFAULT 1,
    caps_filter_threshold INTEGER DEFAULT 70,
    zalgo_filter_enabled INTEGER DEFAULT 1,
    emoji_spam_enabled INTEGER DEFAULT 1,
    emoji_spam_limit INTEGER DEFAULT 10,
    FOREIGN KEY (guild_id) REFERENCES guild_settings(guild_id) ON DELETE CASCADE
  );

  -- User violations
  CREATE TABLE IF NOT EXISTS violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    moderator_id TEXT,
    type TEXT NOT NULL,
    reason TEXT,
    message_content TEXT,
    action_taken TEXT,
    points INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (guild_id) REFERENCES guild_settings(guild_id) ON DELETE CASCADE
  );

  -- Muted users
  CREATE TABLE IF NOT EXISTS mutes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guild_id) REFERENCES guild_settings(guild_id) ON DELETE CASCADE
  );

  -- Banned users
  CREATE TABLE IF NOT EXISTS bans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason TEXT,
    is_tempban INTEGER DEFAULT 0,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guild_id) REFERENCES guild_settings(guild_id) ON DELETE CASCADE
  );

  -- Message cache for spam detection
  CREATE TABLE IF NOT EXISTS message_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Raid protection
  CREATE TABLE IF NOT EXISTS raid_protection (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 1,
    join_threshold INTEGER DEFAULT 10,
    time_window INTEGER DEFAULT 10,
    action TEXT DEFAULT 'lockdown',
    verification_level INTEGER DEFAULT 2,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Join history for raid detection
  CREATE TABLE IF NOT EXISTS join_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    account_age_days INTEGER,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_violations_guild_user ON violations(guild_id, user_id);
  CREATE INDEX IF NOT EXISTS idx_violations_created ON violations(created_at);
  CREATE INDEX IF NOT EXISTS idx_mutes_guild_user ON mutes(guild_id, user_id);
  CREATE INDEX IF NOT EXISTS idx_mutes_expires ON mutes(expires_at);
  CREATE INDEX IF NOT EXISTS idx_message_cache_user ON message_cache(guild_id, user_id);
  CREATE INDEX IF NOT EXISTS idx_message_cache_created ON message_cache(created_at);
  CREATE INDEX IF NOT EXISTS idx_join_history_guild ON join_history(guild_id, joined_at);
`);

logger.info('Database initialized successfully');

module.exports = db;