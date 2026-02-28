const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedUtil = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('The ID of the user to unban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for unbanning')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    const userId = interaction.options.getString('user_id');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    // Validate user ID format
    if (!/^\d{17,19}$/.test(userId)) {
      return interaction.reply({ 
        embeds: [EmbedUtil.error('Invalid ID', 'Please provide a valid Discord user ID.')],
        ephemeral: true 
      });
    }

    try {
      // Check if user is actually banned
      const banList = await interaction.guild.bans.fetch();
      const bannedUser = banList.find(ban => ban.user.id === userId);

      if (!bannedUser) {
        return interaction.reply({ 
          embeds: [EmbedUtil.error('Not Banned', 'This user is not banned from the server.')],
          ephemeral: true 
        });
      }

      // Unban the user
      await interaction.guild.members.unban(userId, `${interaction.user.tag}: ${reason}`);

      // Log to database
      await client.db.addModLog('UNBAN', userId, interaction.guild.id, interaction.user.id, reason);

      // Send success message
      const embed = EmbedUtil.success('User Unbanned', `${bannedUser.user.tag} has been unbanned.`)
        .addFields(
          { name: 'User', value: `${bannedUser.user.tag} (${userId})`, inline: true },
          { name: 'Reason', value: reason, inline: true },
          { name: 'Unbanned By', value: interaction.user.tag, inline: true }
        );

      await interaction.reply({ embeds: [embed] });

      // Send to mod log channel if configured
      if (client.config.modLogChannelId) {
        const logChannel = interaction.guild.channels.cache.get(client.config.modLogChannelId);
        if (logChannel) {
          await logChannel.send({ 
            embeds: [EmbedUtil.modLog('UNBAN', interaction.user, bannedUser.user, reason)] 
          });
        }
      }

    } catch (error) {
      console.error('Unban error:', error);
      
      if (error.code === 10026) {
        return interaction.reply({ 
          embeds: [EmbedUtil.error('Not Banned', 'This user is not banned from the server.')],
          ephemeral: true 
        });
      }

      await interaction.reply({ 
        embeds: [EmbedUtil.error('Error', 'An error occurred while trying to unban this user.')],
        ephemeral: true 
      });
    }
  }
};
