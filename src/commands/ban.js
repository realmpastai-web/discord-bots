const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedUtil = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for banning')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('delete_messages')
        .setDescription('Delete messages from the last X days (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    const target = interaction.options.getMember('user') || interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_messages') || 0;

    if (!target) {
      return interaction.reply({ 
        embeds: [EmbedUtil.error('Invalid User', 'Could not find that user.')],
        ephemeral: true 
      });
    }

    // If it's a member object, check permissions
    if (target.roles) {
      if (!target.bannable) {
        return interaction.reply({ 
          embeds: [EmbedUtil.error('Cannot Ban', 'I cannot ban this user. They may have higher permissions than me.')],
          ephemeral: true 
        });
      }

      if (target.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({ 
          embeds: [EmbedUtil.error('Permission Denied', 'You cannot ban someone with a higher or equal role.')],
          ephemeral: true 
        });
      }
    }

    try {
      // DM the user if they're in the server
      if (target.send) {
        try {
          await target.send({
            embeds: [EmbedUtil.error('You have been banned', `You were banned from **${interaction.guild.name}**\n**Reason:** ${reason}`)]
          });
        } catch (err) {
          // User has DMs disabled
        }
      }

      // Ban the user
      await interaction.guild.members.ban(target.id, { 
        deleteMessageDays: deleteDays,
        reason: `${interaction.user.tag}: ${reason}` 
      });

      // Log to database
      await client.db.addModLog('BAN', target.id, interaction.guild.id, interaction.user.id, reason);

      // Send success message
      const embed = EmbedUtil.success('User Banned', `${target.tag || target.user?.tag} has been banned from the server.`)
        .addFields(
          { name: 'User', value: `${target.tag || target.user?.tag} (${target.id})`, inline: true },
          { name: 'Reason', value: reason, inline: true },
          { name: 'Moderator', value: interaction.user.tag, inline: true }
        );

      if (deleteDays > 0) {
        embed.addFields({ name: 'Message Deletion', value: `Deleted messages from last ${deleteDays} day(s)`, inline: true });
      }

      await interaction.reply({ embeds: [embed] });

      // Send to mod log channel if configured
      if (client.config.modLogChannelId) {
        const logChannel = interaction.guild.channels.cache.get(client.config.modLogChannelId);
        if (logChannel) {
          await logChannel.send({ 
            embeds: [EmbedUtil.modLog('BAN', interaction.user, target.user || target, reason)] 
          });
        }
      }
    } catch (error) {
      console.error('Ban error:', error);
      await interaction.reply({ 
        embeds: [EmbedUtil.error('Error', 'An error occurred while trying to ban this user.')],
        ephemeral: true 
      });
    }
  }
};
