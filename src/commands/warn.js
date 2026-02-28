const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedUtil = require('../utils/embeds');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issue a warning to a member')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to warn')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason');

    if (!target) {
      return interaction.reply({ 
        embeds: [EmbedUtil.error('Invalid User', 'Could not find that user in this server.')],
        ephemeral: true 
      });
    }

    // Prevent self-warnings
    if (target.id === interaction.user.id) {
      return interaction.reply({ 
        embeds: [EmbedUtil.error('Nice Try', 'You cannot warn yourself!')],
        ephemeral: true 
      });
    }

    // Check bot permissions
    if (target.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({ 
        embeds: [EmbedUtil.error('Cannot Warn', 'I cannot warn this user. They have a higher role than me.')],
        ephemeral: true 
      });
    }

    // Check moderator permissions
    if (target.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ 
        embeds: [EmbedUtil.error('Permission Denied', 'You cannot warn someone with a higher or equal role.')],
        ephemeral: true 
      });
    }

    try {
      // Add warning to database
      const warningId = await client.db.addWarning(target.id, interaction.guild.id, interaction.user.id, reason);
      
      // Get current warning count
      const warnings = await client.db.getWarnings(target.id, interaction.guild.id);
      const warningCount = warnings.length;

      // Log to mod logs
      await client.db.addModLog('WARN', target.id, interaction.guild.id, interaction.user.id, reason);

      // Send success message
      const embed = EmbedUtil.warning('User Warned', `${target.user.tag} has been warned.`)
        .addFields(
          { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
          { name: 'Warning #', value: `${warningCount}`, inline: true },
          { name: 'Reason', value: reason },
          { name: 'Moderator', value: interaction.user.tag, inline: true }
        );

      // Add auto-action warning if applicable
      if (config.autoMod.enabled && warningCount >= config.autoMod.maxWarnings) {
        embed.addFields({ 
          name: '⚠️ Auto-Action Triggered', 
          value: `User has reached ${config.autoMod.maxWarnings} warnings. Consider taking further action.` 
        });
      }

      await interaction.reply({ embeds: [embed] });

      // Send to mod log channel if configured
      if (client.config.modLogChannelId) {
        const logChannel = interaction.guild.channels.cache.get(client.config.modLogChannelId);
        if (logChannel) {
          await logChannel.send({ 
            embeds: [EmbedUtil.modLog('WARNING', interaction.user, target.user, reason)] 
          });
        }
      }

      // DM the user
      try {
        const dmEmbed = EmbedUtil.warning('You have been warned', `You received a warning in **${interaction.guild.name}**`)
          .addFields(
            { name: 'Reason', value: reason },
            { name: 'Warning Count', value: `You now have ${warningCount} warning(s)` }
          );
        
        if (config.autoMod.enabled && warningCount >= config.autoMod.maxWarnings) {
          dmEmbed.addFields({ 
            name: '⚠️ Important', 
            value: 'You have reached the warning limit. Further violations may result in a timeout or ban.' 
          });
        }

        await target.send({ embeds: [dmEmbed] });
      } catch (err) {
        // User has DMs disabled
        await interaction.followUp({ 
          embeds: [EmbedUtil.warning('DM Failed', `Could not send warning DM to ${target.user.tag}. They may have DMs disabled.`)],
          ephemeral: true 
        });
      }

      // Auto-timeout if enabled and threshold reached
      if (config.autoMod.enabled && warningCount >= config.autoMod.maxWarnings && target.moderatable) {
        try {
          await target.timeout(config.autoMod.autoTimeoutDuration * 1000, `Automatic timeout: Reached ${config.autoMod.maxWarnings} warnings`);
          
          await interaction.followUp({ 
            embeds: [EmbedUtil.warning('Auto-Timeout Applied', `${target.user.tag} has been automatically timed out for ${formatDuration(config.autoMod.autoTimeoutDuration)} due to reaching the warning threshold.`)]
          });

          // Log auto-timeout
          await client.db.addModLog('AUTO_TIMEOUT', target.id, interaction.guild.id, client.user.id, 'Automatic: Reached warning threshold', formatDuration(config.autoMod.autoTimeoutDuration));
        } catch (err) {
          console.error('Auto-timeout failed:', err);
        }
      }

    } catch (error) {
      console.error('Warn error:', error);
      await interaction.reply({ 
        embeds: [EmbedUtil.error('Error', 'An error occurred while trying to warn this user.')],
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
