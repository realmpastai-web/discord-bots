const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user (mute temporarily)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to timeout')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('minutes')
        .setDescription('Duration in minutes')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320)) // Max 28 days
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the timeout')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const target = interaction.options.getMember('user');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
    }

    if (!target.moderatable) {
      return interaction.reply({ content: '❌ I cannot timeout this user. They may have higher permissions.', ephemeral: true });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot timeout yourself!', ephemeral: true });
    }

    try {
      const duration = minutes * 60 * 1000;
      await target.timeout(duration, `${reason} | By: ${interaction.user.tag}`);
      
      await interaction.reply({ 
        content: `⏱️ **${target.user.tag}** has been timed out for ${minutes} minute(s).\n📌 Reason: ${reason}`, 
        ephemeral: true 
      });
      
      await logAction(client, interaction.guild, '⏱️ Timeout', target.user, interaction.user, `${reason} (${minutes} min)`);
    } catch (error) {
      console.error('Timeout error:', error);
      await interaction.reply({ content: '❌ Failed to timeout user. Check my permissions.', ephemeral: true });
    }
  }
};

async function logAction(client, guild, action, target, moderator, reason) {
  if (!client.config.logChannelId) return;
  
  const logChannel = guild.channels.cache.get(client.config.logChannelId);
  if (!logChannel) return;

  const { EmbedBuilder } = require('discord.js');
  const embed = new EmbedBuilder()
    .setColor('#ffaa00')
    .setTitle(action)
    .addFields(
      { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
      { name: 'Moderator', value: `${moderator.tag}`, inline: true },
      { name: 'Reason', value: reason, inline: false }
    )
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
}
