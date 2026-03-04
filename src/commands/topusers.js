const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AnalyticsRepository } = require('../../database/repository');
const { formatNumber } = require('../../utils/formatters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topusers')
    .setDescription('View the most active users leaderboard')
    .addIntegerOption(option =>
      option
        .setName('limit')
        .setDescription('Number of users to show')
        .setRequired(false)
        .setMinValue(5)
        .setMaxValue(25)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply('This command can only be used in a server.');
      return;
    }

    const limit = interaction.options.getInteger('limit') || 10;
    const topUsers = AnalyticsRepository.getTopUsers(guild.id, limit);

    if (topUsers.length === 0) {
      await interaction.editReply('No activity data available yet. Users will appear here once they start chatting!');
      return;
    }

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    
    const leaderboardText = topUsers.map((user, index) => {
      const medal = medals[index] || `${index + 1}.`;
      const bar = '█'.repeat(Math.min(10, Math.ceil(user.message_count / 100))) + 
                  '░'.repeat(10 - Math.min(10, Math.ceil(user.message_count / 100)));
      return `${medal} <@${user.user_id}> - ${formatNumber(user.message_count)} msgs\n   ${bar}`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setTitle(`🏆 ${guild.name} Leaderboard`)
      .setColor('#f1c40f')
      .setDescription(leaderboardText)
      .setFooter({ text: `ServerStats Pro • Top ${limit} Most Active Users` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
