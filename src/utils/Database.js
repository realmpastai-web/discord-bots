const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor(dbPath) {
    // Ensure data directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('✅ Connected to SQLite database');
        this.initTables();
      }
    });
  }

  initTables() {
    // Warnings table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Moderation log table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS mod_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        reason TEXT,
        duration TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Muted users table (for tracking mutes across restarts)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS muted_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        role_id TEXT NOT NULL,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // Warning methods
  addWarning(userId, guildId, moderatorId, reason) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES (?, ?, ?, ?)',
        [userId, guildId, moderatorId, reason],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getWarnings(userId, guildId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM warnings WHERE user_id = ? AND guild_id = ? ORDER BY created_at DESC',
        [userId, guildId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  clearWarnings(userId, guildId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM warnings WHERE user_id = ? AND guild_id = ?',
        [userId, guildId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  removeWarning(warningId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM warnings WHERE id = ?',
        [warningId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  // Mod log methods
  addModLog(action, userId, guildId, moderatorId, reason, duration = null) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO mod_logs (action, user_id, guild_id, moderator_id, reason, duration) VALUES (?, ?, ?, ?, ?, ?)',
        [action, userId, guildId, moderatorId, reason, duration],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getModLogs(userId, guildId, limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM mod_logs WHERE user_id = ? AND guild_id = ? ORDER BY created_at DESC LIMIT ?',
        [userId, guildId, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = Database;
