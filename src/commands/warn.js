const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const warnings = require('../utils/warnings.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
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
      return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot warn yourself!', ephemeral: true });
    }

    try {
      const warningCount = warnings.add(interaction.guild.id, target.id, reason, interaction.user.id);
      
      await interaction.reply({ 
        content: `⚠️ **${target.user.tag}** has been warned.\n📌 Reason: ${reason}\n📊 Total warnings: ${warningCount}/${client.config.warnThreshold}`, 
        ephemeral: true 
      });

      // Auto-timeout if threshold reached
      if (warningCount >= client.config.warnThreshold && target.moderatable) {
        await target.timeout(3600000, `Auto-timeout: Reached ${warningCount} warnings`);
        await interaction.followUp({ 
          content: `🚫 **${target.user.tag}** has been automatically timed out for 1 hour due to reaching the warning threshold.`, 
          ephemeral: true 
        });
      }
      
      await logAction(client, interaction.guild, '⚠️ Warning', target.user, interaction.user, `${reason} (#${warningCount})`);
    } catch (error) {
      console.error('Warn error:', error);
      await interaction.reply({ content: '❌ Failed to warn user.', ephemeral: true });
    }
  }
};

async function logAction(client, guild, action, target, moderator, reason) {
  if (!client.config.logChannelId) return;
  
  const logChannel = guild.channels.cache.get(client.config.logChannelId);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor('#ffff00')
    .setTitle(action)
    .addFields(
      { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
      { name: 'Moderator', value: `${moderator.tag}`, inline: true },
      { name: 'Reason', value: reason, inline: false }
    )
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
}
