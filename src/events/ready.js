const logger = require('../utils/logger');
const db = require('../database/connection');

module.exports = {
  name: 'ready',
  once: true,

  async execute(client) {
    logger.info(`Bot logged in as ${client.user.tag}`);
    logger.info(`Serving ${client.guilds.cache.size} guilds`);

    // Set bot activity
    client.user.setActivity('/help | Auto-Moderator Pro', { type: 'WATCHING' });

    // Start scheduled tasks
    this.startScheduledTasks(client);

    // Initialize guild settings for existing guilds
    client.guilds.cache.forEach(guild => {
      this.initializeGuild(guild.id);
    });
  },

  initializeGuild(guildId) {
    try {
      // Check if guild settings exist
      const existing = db.prepare('SELECT guild_id FROM guild_settings WHERE guild_id = ?').get(guildId);
      if (!existing) {
        db.prepare('INSERT INTO guild_settings (guild_id) VALUES (?)').run(guildId);
        db.prepare('INSERT INTO filter_settings (guild_id) VALUES (?)').run(guildId);
        db.prepare('INSERT INTO raid_protection (guild_id) VALUES (?)').run(guildId);
        logger.info(`Initialized settings for guild: ${guildId}`);
      }
    } catch (error) {
      logger.error(`Failed to initialize guild ${guildId}:`, error);
    }
  },

  startScheduledTasks(client) {
    // Clean up expired mutes every minute
    setInterval(() => {
      this.checkExpiredMutes(client);
    }, 60000);

    // Clean up old message cache every 5 minutes
    setInterval(() => {
      this.cleanMessageCache();
    }, 300000);

    // Clean up old join history every hour
    setInterval(() => {
      this.cleanJoinHistory();
    }, 3600000);

    logger.info('Scheduled tasks started');
  },

  async checkExpiredMutes(client) {
    try {
      const expiredMutes = db.prepare(`
        SELECT * FROM mutes WHERE expires_at < datetime('now')
      `).all();

      for (const mute of expiredMutes) {
        try {
          const guild = client.guilds.cache.get(mute.guild_id);
          if (!guild) continue;

          const member = await guild.members.fetch(mute.user_id).catch(() => null);
          if (!member) continue;

          const settings = db.prepare('SELECT mute_role_id FROM guild_settings WHERE guild_id = ?')
            .get(mute.guild_id);
          
          if (settings?.mute_role_id) {
            const muteRole = guild.roles.cache.get(settings.mute_role_id);
            if (muteRole && member.roles.cache.has(muteRole.id)) {
              await member.roles.remove(muteRole);
              logger.info(`Auto-unmuted ${member.user.tag} in ${guild.name}`);
            }
          }

          // Remove from database
          db.prepare('DELETE FROM mutes WHERE id = ?').run(mute.id);

        } catch (error) {
          logger.error('Error processing expired mute:', error);
        }
      }
    } catch (error) {
      logger.error('Error checking expired mutes:', error);
    }
  },

  cleanMessageCache() {
    try {
      const deleted = db.prepare(`
        DELETE FROM message_cache WHERE created_at < datetime('now', '-10 minutes')
      `).run();
      
      if (deleted.changes > 0) {
        logger.debug(`Cleaned ${deleted.changes} old messages from cache`);
      }
    } catch (error) {
      logger.error('Error cleaning message cache:', error);
    }
  },

  cleanJoinHistory() {
    try {
      const deleted = db.prepare(`
        DELETE FROM join_history WHERE joined_at < datetime('now', '-24 hours')
      `).run();
      
      if (deleted.changes > 0) {
        logger.debug(`Cleaned ${deleted.changes} old join records`);
      }
    } catch (error) {
      logger.error('Error cleaning join history:', error);
    }
  }
};