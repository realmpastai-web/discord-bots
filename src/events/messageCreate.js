const { Events } = require('discord.js');
const { AnalyticsRepository } = require('../database/repository');

module.exports = {
  name: Events.MessageCreate,

  execute(message) {
    // Ignore bot messages and DMs
    if (message.author.bot || !message.guild) return;

    // Track message
    AnalyticsRepository.incrementMessageCount(
      message.guild.id,
      message.author.id,
      message.author.username,
      message.content.length
    );

    // Track daily activity
    AnalyticsRepository.recordMessageActivity(
      message.guild.id,
      message.channel.id,
      message.author.id,
      message.content.length
    );
  }
};
