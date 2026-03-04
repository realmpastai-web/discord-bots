const { Events } = require('discord.js');
const { AnalyticsRepository } = require('../database/repository');

module.exports = {
  name: Events.GuildMemberRemove,

  execute(member) {
    AnalyticsRepository.recordMemberEvent(
      member.guild.id,
      member.id,
      member.user.username,
      'leave'
    );
  }
};
