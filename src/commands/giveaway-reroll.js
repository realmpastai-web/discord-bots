const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-reroll')
    .setDescription('Reroll winners for an ended giveaway')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addIntegerOption(option =>
      option.setName('id')
        .setDescription('Giveaway ID')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('winners')
        .setDescription('Number of new winners to pick')
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(false)),

  async execute(interaction, client) {
    const giveawayId = interaction.options.getInteger('id');
    const winnerCount = interaction.options.getInteger('winners') || 1;

    const result = await client.giveaways.rerollGiveaway(giveawayId, interaction.user.id);

    if (!result.success) {
      return interaction.reply({
        content: `❌ ${result.error}`,
        ephemeral: true
      });
    }

    // Pick new winners
    const entries = db.prepare('SELECT * FROM giveaway_entries WHERE giveaway_id = ?').all(giveawayId);
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    const newWinners = shuffled.slice(0, Math.min(winnerCount, shuffled.length));

    const winnerMentions = newWinners.length > 0
      ? newWinners.map(w => `<@${w.user_id}>`).join(', ')
      : 'No valid entries';

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🎲 Giveaway Rerolled!')
      .setDescription(`New winner(s) for giveaway #${giveawayId}:`)
      .addFields({ name: '🏆 New Winner(s)', value: winnerMentions })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
