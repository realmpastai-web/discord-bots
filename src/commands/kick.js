const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedUtil = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for kicking')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction, client) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      return interaction.reply({ 
        embeds: [EmbedUtil.error('Invalid User', 'Could not find that user in this server.')],
        ephemeral: true 
      });
    }

    // Check if target is kickable
    if (!target.kickable) {
      return interaction.reply({ 
        embeds: [EmbedUtil.error('Cannot Kick', 'I cannot kick this user. They may have higher permissions than me.')],
        ephemeral: true 
      });
    }

    // Check if moderator is trying to kick someone with higher role
    if (target.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ 
        embeds: [EmbedUtil.error('Permission Denied', 'You cannot kick someone with a higher or equal role.')],
        ephemeral: true 
      });
    }

    try {
      // DM the user
      try {
        await target.send({
          embeds: [EmbedUtil.warning('You have been kicked', `You were kicked from **${interaction.guild.name}**\n**Reason:** ${reason}`)]
        });
      } catch (err) {
        // User has DMs disabled
      }

      // Kick the user
      await target.kick(reason);

      // Log to database
      await client.db.addModLog('KICK', target.id, interaction.guild.id, interaction.user.id, reason);

      // Send success message
      const embed = EmbedUtil.success('User Kicked', `${target.user.tag} has been kicked from the server.`)
        .addFields(
          { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
          { name: 'Reason', value: reason, inline: true },
          { name: 'Moderator', value: interaction.user.tag, inline: true }
        );

      await interaction.reply({ embeds: [embed] });

      // Send to mod log channel if configured
      if (client.config.modLogChannelId) {
        const logChannel = interaction.guild.channels.cache.get(client.config.modLogChannelId);
        if (logChannel) {
          await logChannel.send({ 
            embeds: [EmbedUtil.modLog('KICK', interaction.user, target.user, reason)] 
          });
        }
      }
    } catch (error) {
      console.error('Kick error:', error);
      await interaction.reply({ 
        embeds: [EmbedUtil.error('Error', 'An error occurred while trying to kick this user.')],
        ephemeral: true 
      });
    }
  }
};
