const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database/connection');
const logger = require('./logger');

class GiveawayManager {
  constructor(client) {
    this.client = client;
    this.activeGiveaways = new Map();
    this.checkInterval = null;
    this.startChecking();
  }

  startChecking() {
    // Check for ended giveaways every 10 seconds
    this.checkInterval = setInterval(() => this.checkEndedGiveaways(), 10000);
    logger.info('Giveaway manager started');
  }

  stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getActiveCount() {
    return this.activeGiveaways.size;
  }

  async createGiveaway({ channelId, guildId, prize, description, winnerCount, durationMs, hostId, requirements = {} }) {
    const endTime = Date.now() + durationMs;
    
    const stmt = db.prepare(`
      INSERT INTO giveaways (channel_id, guild_id, prize, description, winner_count, end_time, host_id, requirements)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      channelId,
      guildId,
      prize,
      description || null,
      winnerCount,
      Math.floor(endTime / 1000),
      hostId,
      JSON.stringify(requirements)
    );

    const giveawayId = result.lastInsertRowid;
    
    // Schedule the giveaway
    this.scheduleGiveaway(giveawayId, endTime);
    
    logger.info(`Created giveaway ${giveawayId}: ${prize}`);
    return giveawayId;
  }

  scheduleGiveaway(giveawayId, endTime) {
    this.activeGiveaways.set(giveawayId, endTime);
  }

  async checkEndedGiveaways() {
    const now = Date.now();
    
    for (const [giveawayId, endTime] of this.activeGiveaways) {
      if (now >= endTime) {
        await this.endGiveaway(giveawayId);
      }
    }
  }

  async endGiveaway(giveawayId) {
    try {
      this.activeGiveaways.delete(giveawayId);
      
      const giveaway = db.prepare('SELECT * FROM giveaways WHERE id = ?').get(giveawayId);
      if (!giveaway || giveaway.status !== 'active') return;

      // Get all entries
      const entries = db.prepare('SELECT * FROM giveaway_entries WHERE giveaway_id = ?').all(giveawayId);
      
      // Select winners
      const winners = this.selectWinners(entries, giveaway.winner_count);
      
      // Update database
      db.prepare("UPDATE giveaways SET status = 'ended', ended_at = unixepoch() WHERE id = ?").run(giveawayId);
      
      // Save winners
      const winnerStmt = db.prepare('INSERT INTO giveaway_winners (giveaway_id, user_id, username) VALUES (?, ?, ?)');
      for (const winner of winners) {
        winnerStmt.run(giveawayId, winner.user_id, winner.username);
      }

      // Send result message
      await this.sendResultMessage(giveaway, winners);
      
      logger.info(`Ended giveaway ${giveawayId} with ${winners.length} winners`);
    } catch (error) {
      logger.error(`Error ending giveaway ${giveawayId}:`, error);
    }
  }

  selectWinners(entries, winnerCount) {
    if (entries.length === 0) return [];
    if (entries.length <= winnerCount) return entries;

    // Fisher-Yates shuffle
    const shuffled = [...entries];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, winnerCount);
  }

  async sendResultMessage(giveaway, winners) {
    try {
      const channel = await this.client.channels.fetch(giveaway.channel_id);
      if (!channel) return;

      const winnerMentions = winners.length > 0 
        ? winners.map(w => `<@${w.user_id}>`).join(', ')
        : 'No valid entries';

      const embed = new EmbedBuilder()
        .setColor(winners.length > 0 ? 0x00FF00 : 0xFF0000)
        .setTitle('🎉 Giveaway Ended!')
        .setDescription(`**${giveaway.prize}**`)
        .addFields(
          { name: '🏆 Winner(s)', value: winnerMentions },
          { name: '👥 Total Entries', value: `${db.prepare('SELECT COUNT(*) as count FROM giveaway_entries WHERE giveaway_id = ?').get(giveaway.id).count}` }
        )
        .setFooter({ text: `Hosted by ${giveaway.host_id}` })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      
      // Update original message
      try {
        const message = await channel.messages.fetch(giveaway.message_id);
        if (message) {
          const endedEmbed = EmbedBuilder.from(message.embeds[0])
            .setColor(0x808080)
            .setTitle('🎉 Giveaway Ended')
            .setDescription(`**${giveaway.prize}**\n\nWinner(s): ${winnerMentions}`);
          
          await message.edit({ embeds: [endedEmbed], components: [] });
        }
      } catch (e) {
        // Message might be deleted
      }
    } catch (error) {
      logger.error('Error sending result message:', error);
    }
  }

  async addEntry(giveawayId, userId, username) {
    try {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO giveaway_entries (giveaway_id, user_id, username)
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(giveawayId, userId, username);
      return result.changes > 0;
    } catch (error) {
      logger.error('Error adding entry:', error);
      return false;
    }
  }

  async removeEntry(giveawayId, userId) {
    try {
      const stmt = db.prepare('DELETE FROM giveaway_entries WHERE giveaway_id = ? AND user_id = ?');
      const result = stmt.run(giveawayId, userId);
      return result.changes > 0;
    } catch (error) {
      logger.error('Error removing entry:', error);
      return false;
    }
  }

  async rerollGiveaway(giveawayId, hostId) {
    const giveaway = db.prepare('SELECT * FROM giveaways WHERE id = ?').get(giveawayId);
    if (!giveaway || giveaway.status !== 'ended') {
      return { success: false, error: 'Giveaway not found or not ended' };
    }

    if (giveaway.host_id !== hostId) {
      return { success: false, error: 'Only the host can reroll' };
    }

    const entries = db.prepare('SELECT * FROM giveaway_entries WHERE giveaway_id = ?').all(giveawayId);
    const winners = this.selectWinners(entries, giveaway.winner_count);

    return { success: true, winners };
  }

  getGiveawayStats(giveawayId) {
    const giveaway = db.prepare('SELECT * FROM giveaways WHERE id = ?').get(giveawayId);
    if (!giveaway) return null;

    const entries = db.prepare('SELECT COUNT(*) as count FROM giveaway_entries WHERE giveaway_id = ?').get(giveawayId).count;
    const winners = db.prepare('SELECT * FROM giveaway_winners WHERE giveaway_id = ?').all(giveawayId);

    return {
      ...giveaway,
      entryCount: entries,
      winners
    };
  }

  getGuildStats(guildId) {
    const totalGiveaways = db.prepare('SELECT COUNT(*) as count FROM giveaways WHERE guild_id = ?').get(guildId).count;
    const activeGiveaways = db.prepare("SELECT COUNT(*) as count FROM giveaways WHERE guild_id = ? AND status = 'active'").get(guildId).count;
    const totalEntries = db.prepare(`
      SELECT COUNT(*) as count FROM giveaway_entries 
      WHERE giveaway_id IN (SELECT id FROM giveaways WHERE guild_id = ?)
    `).get(guildId).count;

    return { totalGiveaways, activeGiveaways, totalEntries };
  }
}

module.exports = GiveawayManager;
