const { Events } = require('discord.js');
const { logger } = require('../utils/logger');
const { AnalyticsRepository } = require('../database/repository');

module.exports = {
  name: Events.ClientReady,
  once: true,

  execute(client) {
    logger.info(`✓ Bot logged in as ${client.user.tag}`);
    client.user.setActivity('/stats | Server Analytics', { type: 'WATCHING' });

    // Create daily snapshots for all guilds
    setInterval(() => {
      for (const guild of client.guilds.cache.values()) {
        AnalyticsRepository.createSnapshot(guild.id, guild.memberCount);
        logger.info(`Created snapshot for ${guild.name}`);
      }
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    // Initial snapshot
    for (const guild of client.guilds.cache.values()) {
      AnalyticsRepository.upsertGuild(guild.id, guild.name);
      AnalyticsRepository.createSnapshot(guild.id, guild.memberCount);
    }
  }
};
