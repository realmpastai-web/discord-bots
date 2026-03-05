const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-stats')
    .setDescription('View statistics for a giveaway')
    .addIntegerOption(option =>
      option.setName('id')
        .setDescription('Giveaway ID')
        .setRequired(true)),

  async execute(interaction) {
    const giveawayId = interaction.options.getInteger('id');
    const stats = client.giveaways.getGiveawayStats(giveawayId);

    if (!stats) {
      return interaction.reply({
        content: '❌ Giveaway not found.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(`📊 Giveaway #${giveawayId} Stats`)
      .addFields(
        { name: '🎁 Prize', value: stats.prize, inline: true },
        { name: '🏆 Winners', value: `${stats.winner_count}`, inline: true },
        { name: '📊 Status', value: stats.status, inline: true },
        { name: '👥 Total Entries', value: `${stats.entryCount}`, inline: true },
        { name: '👤 Hosted by', value: `<@${stats.host_id}>`, inline: true },
        { name: '📅 Created', value: `<t:${stats.created_at}:R>`, inline: true }
      );

    if (stats.winners && stats.winners.length > 0) {
      const winnerList = stats.winners.map(w => `<@${w.user_id}> ${w.claimed ? '✅' : '⏳'}`).join('\n');
      embed.addFields({ name: '🏆 Winners', value: winnerList });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
