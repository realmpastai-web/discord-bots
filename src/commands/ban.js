const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('days')
        .setDescription('Days of messages to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('days') || 0;

    if (!target) {
      return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
    }

    if (!target.bannable) {
      return interaction.reply({ content: '❌ I cannot ban this user. They may have higher permissions.', ephemeral: true });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot ban yourself!', ephemeral: true });
    }

    try {
      await target.ban({ deleteMessageDays: deleteDays, reason: `${reason} | By: ${interaction.user.tag}` });
      
      await interaction.reply({ content: `✅ **${target.user.tag}** has been banned.\n📌 Reason: ${reason}`, ephemeral: true });
      
      // Log to mod log channel
      await logAction(client, interaction.guild, '🔨 Ban', target.user, interaction.user, reason);
    } catch (error) {
      console.error('Ban error:', error);
      await interaction.reply({ content: '❌ Failed to ban user. Check my permissions.', ephemeral: true });
    }
  }
};

async function logAction(client, guild, action, target, moderator, reason) {
  if (!client.config.logChannelId) return;
  
  const logChannel = guild.channels.cache.get(client.config.logChannelId);
  if (!logChannel) return;

  const { EmbedBuilder } = require('discord.js');
  const embed = new EmbedBuilder()
    .setColor('#ff4444')
    .setTitle(action)
    .addFields(
      { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
      { name: 'Moderator', value: `${moderator.tag}`, inline: true },
      { name: 'Reason', value: reason, inline: false }
    )
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
}
