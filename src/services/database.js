const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { logger } = require('../utils/logger');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, '../../data/shield.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error('Database connection error:', err);
      } else {
        logger.info('Connected to SQLite database');
        this.initTables();
      }
    });
  }

  initTables() {
    // Warnings table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_tag TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        moderator_tag TEXT NOT NULL,
        reason TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    // Moderation logs table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS mod_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        action TEXT NOT NULL,
        target_id TEXT NOT NULL,
        target_tag TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        moderator_tag TEXT NOT NULL,
        reason TEXT,
        timestamp TEXT NOT NULL
      )
    `);

    // Auto-mod settings table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS automod_settings (
        guild_id TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 0,
        block_invites INTEGER DEFAULT 1,
        block_links INTEGER DEFAULT 0,
        max_mentions INTEGER DEFAULT 5,
        max_emojis INTEGER DEFAULT 10,
        log_channel_id TEXT,
        mute_duration INTEGER DEFAULT 10
      )
    `);
  }

  // Warning methods
  addWarning(warning) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO warnings (guild_id, user_id, user_tag, moderator_id, moderator_tag, reason, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [warning.guildId, warning.userId, warning.userTag, warning.moderatorId, warning.moderatorTag, warning.reason, warning.timestamp],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getWarnings(guildId, userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC`,
        [guildId, userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  clearWarning(guildId, userId, index) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT id FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC`,
        [guildId, userId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          if (rows[index]) {
            this.db.run(
              `DELETE FROM warnings WHERE id = ?`,
              [rows[index].id],
              function(err) {
                if (err) reject(err);
                else resolve(this.changes);
              }
            );
          } else {
            reject(new Error('Warning not found'));
          }
        }
      );
    });
  }

  clearAllWarnings(guildId, userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM warnings WHERE guild_id = ? AND user_id = ?`,
        [guildId, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  // Moderation logs
  logAction(action) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO mod_logs (guild_id, action, target_id, target_tag, moderator_id, moderator_tag, reason, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [action.guildId, action.action, action.targetId, action.targetTag, action.moderatorId, action.moderatorTag, action.reason, action.timestamp],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getModLogs(guildId, userId = null, limit = 10) {
    return new Promise((resolve, reject) => {
      let query = `SELECT * FROM mod_logs WHERE guild_id = ?`;
      const params = [guildId];

      if (userId) {
        query += ` AND target_id = ?`;
        params.push(userId);
      }

      query += ` ORDER BY timestamp DESC LIMIT ?`;
      params.push(limit);

      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Auto-mod settings
  getAutomodSettings(guildId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM automod_settings WHERE guild_id = ?`,
        [guildId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row || { enabled: 0, block_invites: 1, block_links: 0, max_mentions: 5, max_emojis: 10 });
        }
      );
    });
  }

  setAutomodSettings(guildId, settings) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO automod_settings (guild_id, enabled, block_invites, block_links, max_mentions, max_emojis, log_channel_id, mute_duration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(guild_id) DO UPDATE SET
         enabled = excluded.enabled,
         block_invites = excluded.block_invites,
         block_links = excluded.block_links,
         max_mentions = excluded.max_mentions,
         max_emojis = excluded.max_emojis,
         log_channel_id = excluded.log_channel_id,
         mute_duration = excluded.mute_duration`,
        [guildId, settings.enabled, settings.blockInvites, settings.blockLinks, settings.maxMentions, settings.maxEmojis, settings.logChannelId, settings.muteDuration],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }
}

module.exports = { Database };
