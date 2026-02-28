const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction, client) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
    }

    if (!target.kickable) {
      return interaction.reply({ content: '❌ I cannot kick this user. They may have higher permissions.', ephemeral: true });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot kick yourself!', ephemeral: true });
    }

    try {
      await target.kick(`${reason} | By: ${interaction.user.tag}`);
      
      await interaction.reply({ content: `👢 **${target.user.tag}** has been kicked.\n📌 Reason: ${reason}`, ephemeral: true });
      
      await logAction(client, interaction.guild, '👢 Kick', target.user, interaction.user, reason);
    } catch (error) {
      console.error('Kick error:', error);
      await interaction.reply({ content: '❌ Failed to kick user. Check my permissions.', ephemeral: true });
    }
  }
};

async function logAction(client, guild, action, target, moderator, reason) {
  if (!client.config.logChannelId) return;
  
  const logChannel = guild.channels.cache.get(client.config.logChannelId);
  if (!logChannel) return;

  const { EmbedBuilder } = require('discord.js');
  const embed = new EmbedBuilder()
    .setColor('#ff8800')
    .setTitle(action)
    .addFields(
      { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
      { name: 'Moderator', value: `${moderator.tag}`, inline: true },
      { name: 'Reason', value: reason, inline: false }
    )
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
}
