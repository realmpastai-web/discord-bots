const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to kick')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (user.id === interaction.user.id) {
      return interaction.reply({
        content: '❌ You cannot kick yourself!',
        ephemeral: true,
      });
    }

    if (user.id === interaction.client.user.id) {
      return interaction.reply({
        content: '❌ You cannot kick me!',
        ephemeral: true,
      });
    }

    try {
      const member = await interaction.guild.members.fetch(user.id);
      
      // Check if member is kickable
      if (!member.kickable) {
        return interaction.reply({
          content: '❌ I cannot kick this user. They may have higher permissions.',
          ephemeral: true,
        });
      }

      await member.kick(`${reason} | Kicked by ${interaction.user.tag}`);

      await interaction.client.db.logAction({
        guildId: interaction.guild.id,
        action: 'kick',
        targetId: user.id,
        targetTag: user.tag,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        reason: reason,
        timestamp: new Date().toISOString(),
      });

      await interaction.reply({
        content: `✅ **${user.tag}** has been kicked.\n📋 **Reason:** ${reason}`,
      });
    } catch (error) {
      console.error('Kick error:', error);
      await interaction.reply({
        content: '❌ Failed to kick user. Check my permissions.',
        ephemeral: true,
      });
    }
  },
};
