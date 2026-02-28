const { Events } = require('discord.js');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member, client) {
    // Auto-moderation: Check if user is on a watchlist or has previous bans
    try {
      const warnings = await client.db.getWarnings(member.id, member.guild.id);
      
      if (warnings.length > 0) {
        console.log(`⚠️ User ${member.user.tag} (${member.id}) joined with ${warnings.length} previous warnings in ${member.guild.name}`);
        
        // Optional: Alert moderators about returning user with warnings
        const config = require('../config');
        if (config.modLogChannelId) {
          const logChannel = member.guild.channels.cache.get(config.modLogChannelId);
          if (logChannel) {
            const EmbedUtil = require('../utils/embeds');
            await logChannel.send({
              embeds: [EmbedUtil.warning('Returning User Alert', `${member.user.tag} has rejoined the server with ${warnings.length} previous warning(s).`)
                .addFields(
                  { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
                  { name: 'Previous Warnings', value: `${warnings.length}`, inline: true },
                  { name: 'Joined At', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                )]
            });
          }
        }
      }
    } catch (error) {
      console.error('GuildMemberAdd error:', error);
    }
  }
};
