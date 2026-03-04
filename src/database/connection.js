const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class Connection {
  constructor() {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'tickets.db');
    this.db = new Database(dbPath);
    
    this.initTables();
    logger.info('Database initialized');
  }

  initTables() {
    // Guild settings
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        ticket_counter INTEGER DEFAULT 0,
        transcript_channel_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ticket categories
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ticket_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        emoji TEXT DEFAULT '🎫',
        role_id TEXT,
        parent_channel_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (guild_id) REFERENCES guild_settings(guild_id)
      )
    `);

    // Support team members
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS support_team (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT DEFAULT 'agent',
        added_by TEXT,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(guild_id, user_id)
      )
    `);

    // Tickets
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_number INTEGER NOT NULL,
        guild_id TEXT NOT NULL,
        channel_id TEXT UNIQUE NOT NULL,
        creator_id TEXT NOT NULL,
        category_id INTEGER,
        claimed_by TEXT,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'open',
        subject TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        closed_at DATETIME,
        closed_by TEXT,
        transcript_url TEXT,
        FOREIGN KEY (category_id) REFERENCES ticket_categories(id)
      )
    `);

    // Ticket messages for transcripts
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL,
        message_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        author_tag TEXT NOT NULL,
        content TEXT,
        attachments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id)
      )
    `);

    // Ticket notes (internal)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ticket_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL,
        author_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id)
      )
    `);
  }

  // Guild settings
  getGuildSettings(guildId) {
    return this.db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
  }

  createGuildSettings(guildId) {
    return this.db.prepare('INSERT OR IGNORE INTO guild_settings (guild_id) VALUES (?)').run(guildId);
  }

  incrementTicketCounter(guildId) {
    return this.db.prepare('UPDATE guild_settings SET ticket_counter = ticket_counter + 1 WHERE guild_id = ?').run(guildId);
  }

  getTicketCounter(guildId) {
    const result = this.db.prepare('SELECT ticket_counter FROM guild_settings WHERE guild_id = ?').get(guildId);
    return result ? result.ticket_counter : 0;
  }

  // Categories
  createCategory(guildId, name, description, emoji, roleId, parentChannelId) {
    return this.db.prepare(`
      INSERT INTO ticket_categories (guild_id, name, description, emoji, role_id, parent_channel_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(guildId, name, description, emoji, roleId, parentChannelId);
  }

  getCategories(guildId) {
    return this.db.prepare('SELECT * FROM ticket_categories WHERE guild_id = ?').all(guildId);
  }

  getCategory(id) {
    return this.db.prepare('SELECT * FROM ticket_categories WHERE id = ?').get(id);
  }

  deleteCategory(id) {
    return this.db.prepare('DELETE FROM ticket_categories WHERE id = ?').run(id);
  }

  // Support team
  addSupportMember(guildId, userId, role, addedBy) {
    return this.db.prepare(`
      INSERT OR REPLACE INTO support_team (guild_id, user_id, role, added_by)
      VALUES (?, ?, ?, ?)
    `).run(guildId, userId, role, addedBy);
  }

  removeSupportMember(guildId, userId) {
    return this.db.prepare('DELETE FROM support_team WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
  }

  getSupportTeam(guildId) {
    return this.db.prepare('SELECT * FROM support_team WHERE guild_id = ?').all(guildId);
  }

  isSupportMember(guildId, userId) {
    const result = this.db.prepare('SELECT 1 FROM support_team WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
    return !!result;
  }

  // Tickets
  createTicket(ticketNumber, guildId, channelId, creatorId, categoryId, subject) {
    return this.db.prepare(`
      INSERT INTO tickets (ticket_number, guild_id, channel_id, creator_id, category_id, subject)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(ticketNumber, guildId, channelId, creatorId, categoryId, subject);
  }

  getTicketByChannel(channelId) {
    return this.db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(channelId);
  }

  getTicketById(id) {
    return this.db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  }

  getGuildTickets(guildId, status = 'open') {
    return this.db.prepare('SELECT * FROM tickets WHERE guild_id = ? AND status = ? ORDER BY created_at DESC').all(guildId, status);
  }

  claimTicket(channelId, userId) {
    return this.db.prepare('UPDATE tickets SET claimed_by = ? WHERE channel_id = ?').run(userId, channelId);
  }

  setPriority(channelId, priority) {
    return this.db.prepare('UPDATE tickets SET priority = ? WHERE channel_id = ?').run(priority, channelId);
  }

  closeTicket(channelId, closedBy, transcriptUrl = null) {
    return this.db.prepare(`
      UPDATE tickets 
      SET status = 'closed', closed_at = CURRENT_TIMESTAMP, closed_by = ?, transcript_url = ?
      WHERE channel_id = ?
    `).run(closedBy, transcriptUrl, channelId);
  }

  // Messages
  addMessage(ticketId, messageId, authorId, authorTag, content, attachments = null) {
    return this.db.prepare(`
      INSERT INTO ticket_messages (ticket_id, message_id, author_id, author_tag, content, attachments)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(ticketId, messageId, authorId, authorTag, content, attachments);
  }

  getTicketMessages(ticketId) {
    return this.db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC').all(ticketId);
  }

  // Notes
  addNote(ticketId, authorId, content) {
    return this.db.prepare('INSERT INTO ticket_notes (ticket_id, author_id, content) VALUES (?, ?, ?)').run(ticketId, authorId, content);
  }

  getTicketNotes(ticketId) {
    return this.db.prepare('SELECT * FROM ticket_notes WHERE ticket_id = ? ORDER BY created_at DESC').all(ticketId);
  }

  // Stats
  getTicketStats(guildId, days = 30) {
    const openCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM tickets WHERE guild_id = ? AND status = 'open'
    `).get(guildId);
    
    const closedCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM tickets 
      WHERE guild_id = ? AND status = 'closed' 
      AND closed_at >= datetime('now', '-${days} days')
    `).get(guildId);

    const avgResponseTime = this.db.prepare(`
      SELECT AVG(julianday(closed_at) - julianday(created_at)) as avg_days
      FROM tickets WHERE guild_id = ? AND status = 'closed'
    `).get(guildId);

    return {
      open: openCount.count,
      closed: closedCount.count,
      avgResponseDays: avgResponseTime.avg_days || 0
    };
  }
}

module.exports = Connection;