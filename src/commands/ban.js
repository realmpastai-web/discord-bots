const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('days')
        .setDescription('Days of messages to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('days') || 0;

    // Prevent self-ban
    if (user.id === interaction.user.id) {
      return interaction.reply({
        content: '❌ You cannot ban yourself!',
        ephemeral: true,
      });
    }

    // Prevent banning the bot
    if (user.id === interaction.client.user.id) {
      return interaction.reply({
        content: '❌ You cannot ban me!',
        ephemeral: true,
      });
    }

    try {
      await interaction.guild.members.ban(user, {
        deleteMessageDays: deleteDays,
        reason: `${reason} | Banned by ${interaction.user.tag}`,
      });

      // Log to database
      await interaction.client.db.logAction({
        guildId: interaction.guild.id,
        action: 'ban',
        targetId: user.id,
        targetTag: user.tag,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        reason: reason,
        timestamp: new Date().toISOString(),
      });

      await interaction.reply({
        content: `✅ **${user.tag}** has been banned.\n📋 **Reason:** ${reason}`,
      });
    } catch (error) {
      console.error('Ban error:', error);
      await interaction.reply({
        content: '❌ Failed to ban user. Check my permissions and role hierarchy.',
        ephemeral: true,
      });
    }
  },
};
