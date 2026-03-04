const { db } = require('./connection');
const { logger } = require('../utils/logger');

class AnalyticsRepository {
  // Guild operations
  static upsertGuild(guildId, guildName) {
    const stmt = db.prepare(`
      INSERT INTO guild_settings (guild_id, guild_name) 
      VALUES (?, ?)
      ON CONFLICT(guild_id) DO UPDATE SET 
        guild_name = excluded.guild_name,
        updated_at = strftime('%s', 'now')
    `);
    return stmt.run(guildId, guildName);
  }

  // Member stats operations
  static incrementMessageCount(guildId, userId, username, charCount) {
    const stmt = db.prepare(`
      INSERT INTO member_stats (guild_id, user_id, username, message_count, character_count, last_active)
      VALUES (?, ?, ?, 1, ?, strftime('%s', 'now'))
      ON CONFLICT(guild_id, user_id) DO UPDATE SET
        username = excluded.username,
        message_count = message_count + 1,
        character_count = character_count + excluded.character_count,
        last_active = strftime('%s', 'now')
    `);
    return stmt.run(guildId, userId, username, charCount);
  }

  static getTopUsers(guildId, limit = 10) {
    const stmt = db.prepare(`
      SELECT user_id, username, message_count, character_count
      FROM member_stats
      WHERE guild_id = ?
      ORDER BY message_count DESC
      LIMIT ?
    `);
    return stmt.all(guildId, limit);
  }

  // Daily activity tracking
  static recordMessageActivity(guildId, channelId, userId, charCount) {
    const today = Math.floor(Date.now() / 1000 / 86400) * 86400;
    const stmt = db.prepare(`
      INSERT INTO message_activity (guild_id, channel_id, user_id, message_count, character_count, date)
      VALUES (?, ?, ?, 1, ?, ?)
      ON CONFLICT(guild_id, channel_id, user_id, date) DO UPDATE SET
        message_count = message_count + 1,
        character_count = character_count + excluded.character_count
    `);
    return stmt.run(guildId, channelId, userId, charCount, today);
  }

  static getDailyStats(guildId, days = 7) {
    const cutoff = Math.floor(Date.now() / 1000) - (days * 86400);
    const stmt = db.prepare(`
      SELECT 
        date(datetime(date, 'unixepoch')) as day,
        SUM(message_count) as messages,
        COUNT(DISTINCT user_id) as active_users
      FROM message_activity
      WHERE guild_id = ? AND date >= ?
      GROUP BY date
      ORDER BY date DESC
    `);
    return stmt.all(guildId, cutoff);
  }

  // Channel stats
  static getChannelStats(guildId, days = 7) {
    const cutoff = Math.floor(Date.now() / 1000) - (days * 86400);
    const stmt = db.prepare(`
      SELECT 
        channel_id,
        SUM(message_count) as total_messages,
        COUNT(DISTINCT user_id) as unique_users
      FROM message_activity
      WHERE guild_id = ? AND date >= ?
      GROUP BY channel_id
      ORDER BY total_messages DESC
    `);
    return stmt.all(guildId, cutoff);
  }

  // Member events
  static recordMemberEvent(guildId, userId, username, eventType) {
    const stmt = db.prepare(`
      INSERT INTO member_events (guild_id, user_id, username, event_type)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(guildId, userId, username, eventType);
  }

  static getMemberEvents(guildId, days = 30) {
    const cutoff = Math.floor(Date.now() / 1000) - (days * 86400);
    const joins = db.prepare(`
      SELECT COUNT(*) as count FROM member_events 
      WHERE guild_id = ? AND event_type = 'join' AND event_date >= ?
    `).get(guildId, cutoff);
    
    const leaves = db.prepare(`
      SELECT COUNT(*) as count FROM member_events 
      WHERE guild_id = ? AND event_type = 'leave' AND event_date >= ?
    `).get(guildId, cutoff);

    return { joins: joins.count, leaves: leaves.count };
  }

  // Snapshots for growth tracking
  static createSnapshot(guildId, memberCount) {
    const today = Math.floor(Date.now() / 1000 / 86400) * 86400;
    const stmt = db.prepare(`
      INSERT INTO daily_snapshots (guild_id, snapshot_date, member_count)
      VALUES (?, ?, ?)
      ON CONFLICT(guild_id, snapshot_date) DO UPDATE SET
        member_count = excluded.member_count
    `);
    return stmt.run(guildId, today, memberCount);
  }

  static getSnapshots(guildId, days = 30) {
    const cutoff = Math.floor(Date.now() / 1000) - (days * 86400);
    const stmt = db.prepare(`
      SELECT * FROM daily_snapshots
      WHERE guild_id = ? AND snapshot_date >= ?
      ORDER BY snapshot_date ASC
    `);
    return stmt.all(guildId, cutoff);
  }

  // Server stats summary
  static getServerStats(guildId) {
    const totalMessages = db.prepare(`
      SELECT SUM(message_count) as total FROM member_stats WHERE guild_id = ?
    `).get(guildId);

    const activeUsers = db.prepare(`
      SELECT COUNT(*) as count FROM member_stats WHERE guild_id = ? AND message_count > 0
    `).get(guildId);

    return {
      totalMessages: totalMessages.total || 0,
      activeUsers: activeUsers.count || 0
    };
  }
}

module.exports = { AnalyticsRepository };
