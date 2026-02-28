const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .addStringOption(option =>
      option
        .setName('userid')
        .setDescription('The ID of the user to unban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for unban')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      await interaction.guild.members.unban(userId, `${reason} | By ${interaction.user.tag}`);

      await interaction.client.db.logAction({
        guildId: interaction.guild.id,
        action: 'unban',
        targetId: userId,
        targetTag: 'Unknown (unbanned by ID)',
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        reason: reason,
        timestamp: new Date().toISOString(),
      });

      await interaction.reply({
        content: `✅ User with ID **${userId}** has been unbanned.\n📋 **Reason:** ${reason}`,
      });
    } catch (error) {
      console.error('Unban error:', error);
      await interaction.reply({
        content: '❌ Failed to unban user. They may not be banned or the ID is invalid.',
        ephemeral: true,
      });
    }
  },
};
