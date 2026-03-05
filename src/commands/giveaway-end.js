const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-end')
    .setDescription('End a giveaway early')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addIntegerOption(option =>
      option.setName('id')
        .setDescription('Giveaway ID')
        .setRequired(true)),

  async execute(interaction, client) {
    const giveawayId = interaction.options.getInteger('id');

    const giveaway = db.prepare('SELECT * FROM giveaways WHERE id = ? AND guild_id = ?').get(giveawayId, interaction.guildId);

    if (!giveaway) {
      return interaction.reply({
        content: '❌ Giveaway not found.',
        ephemeral: true
      });
    }

    if (giveaway.status !== 'active') {
      return interaction.reply({
        content: '❌ This giveaway is already ended or cancelled.',
        ephemeral: true
      });
    }

    if (giveaway.host_id !== interaction.user.id && !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Only the host or administrators can end this giveaway.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      await client.giveaways.endGiveaway(giveawayId);
      await interaction.editReply({
        content: `✅ Giveaway #${giveawayId} ended successfully!`
      });
    } catch (error) {
      console.error('Error ending giveaway:', error);
      await interaction.editReply({
        content: '❌ Failed to end giveaway.'
      });
    }
  }
};
