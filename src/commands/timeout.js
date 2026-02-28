const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedUtil = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member (mute them temporarily)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to timeout')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Duration of the timeout')
        .setRequired(true)
        .addChoices(
          { name: '60 seconds', value: '60' },
          { name: '5 minutes', value: '300' },
          { name: '10 minutes', value: '600' },
          { name: '1 hour', value: '3600' },
          { name: '1 day', value: '86400' },
          { name: '1 week', value: '604800' }
        ))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the timeout')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const target = interaction.options.getMember('user');
    const duration = parseInt(interaction.options.getString('duration'));
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      return interaction.reply({ 
        embeds: [EmbedUtil.error('Invalid User', 'Could not find that user in this server.')],
        ephemeral: true 
      });
    }

    // Check if target is moderatable
    if (!target.moderatable) {
      return interaction.reply({ 
        embeds: [EmbedUtil.error('Cannot Timeout', 'I cannot timeout this user. They may have higher permissions than me.')],
        ephemeral: true 
      });
    }

    // Check if moderator is trying to timeout someone with higher role
    if (target.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ 
        embeds: [EmbedUtil.error('Permission Denied', 'You cannot timeout someone with a higher or equal role.')],
        ephemeral: true 
      });
    }

    try {
      // Calculate timeout duration
      const timeoutUntil = new Date(Date.now() + duration * 1000);

      // Timeout the user
      await target.timeout(duration * 1000, `${interaction.user.tag}: ${reason}`);

      // Log to database
      const durationText = formatDuration(duration);
      await client.db.addModLog('TIMEOUT', target.id, interaction.guild.id, interaction.user.id, reason, durationText);

      // Send success message
      const embed = EmbedUtil.success('User Timed Out', `${target.user.tag} has been timed out.`)
        .addFields(
          { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
          { name: 'Duration', value: durationText, inline: true },
          { name: 'Expires', value: `<t:${Math.floor(timeoutUntil.getTime() / 1000)}:R>`, inline: true },
          { name: 'Reason', value: reason }
        );

      await interaction.reply({ embeds: [embed] });

      // Send to mod log channel if configured
      if (client.config.modLogChannelId) {
        const logChannel = interaction.guild.channels.cache.get(client.config.modLogChannelId);
        if (logChannel) {
          await logChannel.send({ 
            embeds: [EmbedUtil.modLog('TIMEOUT', interaction.user, target.user, reason, durationText)] 
          });
        }
      }

      // DM the user
      try {
        await target.send({
          embeds: [EmbedUtil.warning('You have been timed out', `You were timed out in **${interaction.guild.name}** for ${durationText}\n**Reason:** ${reason}\n**Expires:** <t:${Math.floor(timeoutUntil.getTime() / 1000)}:R>`)]
        });
      } catch (err) {
        // User has DMs disabled
      }
    } catch (error) {
      console.error('Timeout error:', error);
      await interaction.reply({ 
        embeds: [EmbedUtil.error('Error', 'An error occurred while trying to timeout this user.')],
        ephemeral: true 
      });
    }
  }
};

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
}
