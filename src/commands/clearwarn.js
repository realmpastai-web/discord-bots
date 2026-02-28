const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarn')
    .setDescription('Clear warnings for a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to clear warnings for')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('index')
        .setDescription('Warning number to clear (leave empty to clear all)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const index = interaction.options.getInteger('index');

    try {
      if (index !== null) {
        // Clear specific warning
        await interaction.client.db.clearWarning(interaction.guild.id, user.id, index - 1);
        await interaction.reply({
          content: `✅ Warning #${index} cleared for **${user.tag}**.`,
        });
      } else {
        // Clear all warnings
        await interaction.client.db.clearAllWarnings(interaction.guild.id, user.id);
        await interaction.reply({
          content: `✅ All warnings cleared for **${user.tag}**.`,
        });
      }

      await interaction.client.db.logAction({
        guildId: interaction.guild.id,
        action: 'clearwarn',
        targetId: user.id,
        targetTag: user.tag,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        reason: index ? `Cleared warning #${index}` : 'Cleared all warnings',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Clearwarn error:', error);
      await interaction.reply({
        content: '❌ Failed to clear warnings.',
        ephemeral: true,
      });
    }
  },
};
