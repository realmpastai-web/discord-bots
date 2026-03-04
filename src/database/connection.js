const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');

const DB_PATH = process.env.DATABASE_PATH || './data/analytics.db';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database tables
function initializeDatabase() {
  try {
    // Guild settings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        guild_name TEXT NOT NULL,
        joined_at INTEGER DEFAULT (strftime('%s', 'now')),
        settings TEXT DEFAULT '{}',
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Member statistics table
    db.exec(`
      CREATE TABLE IF NOT EXISTS member_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT,
        message_count INTEGER DEFAULT 0,
        character_count INTEGER DEFAULT 0,
        voice_minutes INTEGER DEFAULT 0,
        joined_at INTEGER,
        last_active INTEGER,
        UNIQUE(guild_id, user_id),
        FOREIGN KEY (guild_id) REFERENCES guild_settings(guild_id) ON DELETE CASCADE
      )
    `);

    // Create index for faster queries
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_member_stats_guild ON member_stats(guild_id);
      CREATE INDEX IF NOT EXISTS idx_member_stats_user ON member_stats(guild_id, user_id);
    `);

    // Message activity table (daily stats)
    db.exec(`
      CREATE TABLE IF NOT EXISTS message_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        message_count INTEGER DEFAULT 1,
        character_count INTEGER DEFAULT 0,
        date INTEGER NOT NULL,
        FOREIGN KEY (guild_id) REFERENCES guild_settings(guild_id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_message_activity_guild_date ON message_activity(guild_id, date);
      CREATE INDEX IF NOT EXISTS idx_message_activity_channel ON message_activity(guild_id, channel_id, date);
    `);

    // Channel statistics table
    db.exec(`
      CREATE TABLE IF NOT EXISTS channel_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        channel_name TEXT,
        message_count INTEGER DEFAULT 0,
        date INTEGER NOT NULL,
        UNIQUE(guild_id, channel_id, date),
        FOREIGN KEY (guild_id) REFERENCES guild_settings(guild_id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_channel_stats_guild_date ON channel_stats(guild_id, date);
    `);

    // Member join/leave tracking
    db.exec(`
      CREATE TABLE IF NOT EXISTS member_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT,
        event_type TEXT NOT NULL,
        event_date INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (guild_id) REFERENCES guild_settings(guild_id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_member_events_guild ON member_events(guild_id, event_date);
    `);

    // Daily snapshots for growth tracking
    db.exec(`
      CREATE TABLE IF NOT EXISTS daily_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        snapshot_date INTEGER NOT NULL,
        member_count INTEGER DEFAULT 0,
        message_count INTEGER DEFAULT 0,
        active_users INTEGER DEFAULT 0,
        UNIQUE(guild_id, snapshot_date),
        FOREIGN KEY (guild_id) REFERENCES guild_settings(guild_id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_daily_snapshots_guild ON daily_snapshots(guild_id, snapshot_date);
    `);

    // Voice activity tracking
    db.exec(`
      CREATE TABLE IF NOT EXISTS voice_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        join_time INTEGER NOT NULL,
        leave_time INTEGER,
        duration_minutes INTEGER DEFAULT 0,
        FOREIGN KEY (guild_id) REFERENCES guild_settings(guild_id) ON DELETE CASCADE
      )
    `);

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

function closeDatabase() {
  db.close();
  logger.info('Database connection closed');
}

module.exports = { db, initializeDatabase, closeDatabase };
