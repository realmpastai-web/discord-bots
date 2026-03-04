const { Events } = require('discord.js');
const { AnalyticsRepository } = require('../database/repository');

module.exports = {
  name: Events.GuildMemberAdd,

  execute(member) {
    AnalyticsRepository.recordMemberEvent(
      member.guild.id,
      member.id,
      member.user.username,
      'join'
    );
  }
};
