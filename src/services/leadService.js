class LeadService {
  constructor(db) {
    this.db = db.getDb();
  }

  createLead({ name, phone, email, address, source, notes, createdBy, guildId }) {
    const stmt = this.db.prepare(`
      INSERT INTO leads (name, phone, email, address, source, notes, created_by, guild_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(name, phone, email, address, source, notes, createdBy, guildId);
    
    // Log activity
    this.logActivity(result.lastInsertRowid, 'lead_created', `Lead created: ${name}`, createdBy);
    
    return this.getLeadById(result.lastInsertRowid);
  }

  getLeadById(id) {
    return this.db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  }

  getLeads({ guildId, status, limit = 25 }) {
    let query = 'SELECT * FROM leads WHERE guild_id = ?';
    const params = [guildId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    return this.db.prepare(query).all(...params);
  }

  updateLead(id, updates) {
    const fields = [];
    const values = [];

    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.notes) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.phone) {
      fields.push('phone = ?');
      values.push(updates.phone);
    }
    if (updates.email) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.address) {
      fields.push('address = ?');
      values.push(updates.address);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE leads SET ${fields.join(', ')} WHERE id = ?`;
    this.db.prepare(query).run(...values);

    return this.getLeadById(id);
  }

  getPipelineStats(guildId) {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM leads WHERE guild_id = ?').get(guildId).count;
    
    const byStatus = {};
    const statusRows = this.db.prepare(`
      SELECT status, COUNT(*) as count FROM leads WHERE guild_id = ? GROUP BY status
    `).all(guildId);
    statusRows.forEach(row => byStatus[row.status] = row.count);

    const bySource = {};
    const sourceRows = this.db.prepare(`
      SELECT source, COUNT(*) as count FROM leads WHERE guild_id = ? GROUP BY source
    `).all(guildId);
    sourceRows.forEach(row => bySource[row.source] = row.count);

    const active = this.db.prepare(`
      SELECT COUNT(*) as count FROM leads 
      WHERE guild_id = ? AND status NOT IN ('closed', 'dead')
    `).get(guildId).count;

    return { total, byStatus, bySource, active };
  }

  getRecentLeads(guildId, limit = 5) {
    return this.db.prepare(`
      SELECT * FROM leads WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?
    `).all(guildId, limit);
  }

  getFollowUps(leadId) {
    return this.db.prepare(`
      SELECT * FROM follow_ups WHERE lead_id = ? ORDER BY scheduled_at ASC
    `).all(leadId);
  }

  logActivity(leadId, action, details, performedBy) {
    this.db.prepare(`
      INSERT INTO activity_log (lead_id, action, details, performed_by)
      VALUES (?, ?, ?, ?)
    `).run(leadId, action, details, performedBy);
  }
}

module.exports = LeadService;
