const logger = require('../utils/logger');
const db = require('../database/connection');

module.exports = {
  name: 'guildMemberAdd',

  async execute(member, client) {
    // Process through raid protection
    try {
      await client.raidProtection.handleMemberJoin(member);
    } catch (error) {
      logger.error('Error in raid protection:', error);
    }

    // Initialize guild settings if new
    try {
      const existing = db.prepare('SELECT guild_id FROM guild_settings WHERE guild_id = ?')
        .get(member.guild.id);
      
      if (!existing) {
        db.prepare('INSERT INTO guild_settings (guild_id) VALUES (?)').run(member.guild.id);
        db.prepare('INSERT INTO filter_settings (guild_id) VALUES (?)').run(member.guild.id);
        db.prepare('INSERT INTO raid_protection (guild_id) VALUES (?)').run(member.guild.id);
        logger.info(`Initialized settings for new guild: ${member.guild.name}`);
      }
    } catch (error) {
      logger.error('Error initializing guild settings:', error);
    }
  }
};