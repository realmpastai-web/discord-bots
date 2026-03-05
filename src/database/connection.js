const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'giveaways.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS giveaways (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT UNIQUE,
    channel_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    prize TEXT NOT NULL,
    description TEXT,
    winner_count INTEGER DEFAULT 1,
    end_time INTEGER NOT NULL,
    host_id TEXT NOT NULL,
    requirements TEXT, -- JSON: {roleId, minAccountAge, minMessages}
    status TEXT DEFAULT 'active', -- active, ended, cancelled
    created_at INTEGER DEFAULT (unixepoch()),
    ended_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS giveaway_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    giveaway_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT,
    joined_at INTEGER DEFAULT (unixepoch()),
    requirements_met INTEGER DEFAULT 0,
    UNIQUE(giveaway_id, user_id),
    FOREIGN KEY (giveaway_id) REFERENCES giveaways(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS giveaway_winners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    giveaway_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT,
    claimed INTEGER DEFAULT 0,
    claimed_at INTEGER,
    FOREIGN KEY (giveaway_id) REFERENCES giveaways(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS giveaway_settings (
    guild_id TEXT PRIMARY KEY,
    default_duration_hours INTEGER DEFAULT 24,
    default_winner_count INTEGER DEFAULT 1,
    require_role_id TEXT,
    min_account_age_days INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_giveaways_status ON giveaways(status);
  CREATE INDEX IF NOT EXISTS idx_giveaways_end_time ON giveaways(end_time);
  CREATE INDEX IF NOT EXISTS idx_entries_giveaway ON giveaway_entries(giveaway_id);
`);

module.exports = db;
