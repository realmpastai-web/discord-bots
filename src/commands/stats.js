const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AnalyticsRepository } = require('../../database/repository');
const { formatNumber } = require('../../utils/formatters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View comprehensive server statistics'),

  async execute(interaction) {
    await interaction.deferReply();
    
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply('This command can only be used in a server.');
      return;
    }

    // Ensure guild is tracked
    AnalyticsRepository.upsertGuild(guild.id, guild.name);

    const serverStats = AnalyticsRepository.getServerStats(guild.id);
    const topUsers = AnalyticsRepository.getTopUsers(guild.id, 5);
    const channelStats = AnalyticsRepository.getChannelStats(guild.id, 7);

    const topUsersText = topUsers.length > 0 
      ? topUsers.map((u, i) => `${i + 1}. <@${u.user_id}> - ${formatNumber(u.message_count)} msgs`).join('\n')
      : 'No data yet';

    const topChannelsText = channelStats.length > 0
      ? channelStats.slice(0, 5).map((c, i) => {
          const channel = guild.channels.cache.get(c.channel_id);
          return `${i + 1}. ${channel ? channel.name : 'Unknown'} - ${formatNumber(c.total_messages)} msgs`;
        }).join('\n')
      : 'No data yet';

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${guild.name} Statistics`)
      .setColor('#5865F2')
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { 
          name: '👥 Members', 
          value: `Total: **${formatNumber(guild.memberCount)}**\nActive: **${formatNumber(serverStats.activeUsers)}**`,
          inline: true 
        },
        { 
          name: '💬 Messages', 
          value: `Total: **${formatNumber(serverStats.totalMessages)}**`,
          inline: true 
        },
        { 
          name: '📝 Channels', 
          value: `Text: **${guild.channels.cache.filter(c => c.isTextBased()).size}**\nVoice: **${guild.channels.cache.filter(c => c.isVoiceBased()).size}**`,
          inline: true 
        },
        { 
          name: '🏆 Top Users (All Time)', 
          value: topUsersText,
          inline: false 
        },
        { 
          name: '📢 Top Channels (7 days)', 
          value: topChannelsText,
          inline: false 
        }
      )
      .setFooter({ text: 'ServerStats Pro • Use /help for more commands' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
