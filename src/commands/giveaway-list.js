const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-list')
    .setDescription('List active giveaways in this server'),

  async execute(interaction) {
    const giveaways = db.prepare(`
      SELECT * FROM giveaways 
      WHERE guild_id = ? AND status = 'active'
      ORDER BY end_time ASC
    `).all(interaction.guildId);

    if (giveaways.length === 0) {
      return interaction.reply({
        content: '📭 No active giveaways in this server.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('🎉 Active Giveaways')
      .setDescription(`Found ${giveaways.length} active giveaway(s)`);

    for (const giveaway of giveaways.slice(0, 10)) {
      const entries = db.prepare('SELECT COUNT(*) as count FROM giveaway_entries WHERE giveaway_id = ?').get(giveaway.id).count;
      const timeLeft = Math.max(0, giveaway.end_time * 1000 - Date.now());
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

      embed.addFields({
        name: `#${giveaway.id}: ${giveaway.prize}`,
        value: `🏆 ${giveaway.winner_count} winner(s) • 👥 ${entries} entries • ⏰ ${hoursLeft}h ${minutesLeft}m left`,
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
