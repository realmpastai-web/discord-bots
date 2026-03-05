class FollowUpService {
  constructor(db) {
    this.db = db.getDb();
  }

  createFollowUp({ leadId, type, scheduledAt, notes, createdBy }) {
    const stmt = this.db.prepare(`
      INSERT INTO follow_ups (lead_id, type, scheduled_at, notes, created_by)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(leadId, type, scheduledAt, notes, createdBy);
    
    // Log activity
    this.db.prepare(`
      INSERT INTO activity_log (lead_id, action, details, performed_by)
      VALUES (?, 'follow_up_scheduled', ?, ?)
    `).run(leadId, `Follow-up scheduled: ${type} on ${scheduledAt}`, createdBy);
    
    return {
      id: result.lastInsertRowid,
      leadId,
      type,
      scheduledAt,
      notes,
      createdBy
    };
  }

  getFollowUpsByLead(leadId) {
    return this.db.prepare(`
      SELECT * FROM follow_ups WHERE lead_id = ? ORDER BY scheduled_at ASC
    `).all(leadId);
  }

  getFollowUpsByDate({ guildId, startDate, endDate, completed = false }) {
    return this.db.prepare(`
      SELECT f.*, l.name as lead_name, l.guild_id 
      FROM follow_ups f
      JOIN leads l ON f.lead_id = l.id
      WHERE l.guild_id = ? 
        AND f.scheduled_at >= ? 
        AND f.scheduled_at < ?
        AND f.completed = ?
      ORDER BY f.scheduled_at ASC
    `).all(guildId, startDate, endDate, completed ? 1 : 0);
  }

  markCompleted(followUpId, userId) {
    this.db.prepare(`
      UPDATE follow_ups SET completed = 1 WHERE id = ?
    `).run(followUpId);

    const followUp = this.db.prepare('SELECT * FROM follow_ups WHERE id = ?').get(followUpId);
    
    this.db.prepare(`
      INSERT INTO activity_log (lead_id, action, details, performed_by)
      VALUES (?, 'follow_up_completed', ?, ?)
    `).run(followUp.lead_id, `Follow-up completed: ${followUp.type}`, userId);

    return followUp;
  }

  getOverdueFollowUps(guildId) {
    const now = new Date().toISOString();
    return this.db.prepare(`
      SELECT f.*, l.name as lead_name
      FROM follow_ups f
      JOIN leads l ON f.lead_id = l.id
      WHERE l.guild_id = ? AND f.scheduled_at < ? AND f.completed = 0
      ORDER BY f.scheduled_at ASC
    `).all(guildId, now);
  }
}

module.exports = FollowUpService;
