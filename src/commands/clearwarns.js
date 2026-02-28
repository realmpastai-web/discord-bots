const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const warnings = require('../utils/warnings.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('Clear all warnings for a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to clear warnings for')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const target = interaction.options.getUser('user');
    const cleared = warnings.clear(interaction.guild.id, target.id);

    if (cleared === 0) {
      return interaction.reply({ content: `✅ **${target.tag}** had no warnings to clear.`, ephemeral: true });
    }

    await interaction.reply({ 
      content: `🗑️ Cleared ${cleared} warning(s) for **${target.tag}**.`, 
      ephemeral: true 
    });

    await logAction(client, interaction.guild, '🗑️ Warnings Cleared', target, interaction.user, `${cleared} warning(s) cleared`);
  }
};

async function logAction(client, guild, action, target, moderator, reason) {
  if (!client.config.logChannelId) return;
  
  const logChannel = guild.channels.cache.get(client.config.logChannelId);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle(action)
    .addFields(
      { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
      { name: 'Moderator', value: `${moderator.tag}`, inline: true },
      { name: 'Details', value: reason, inline: false }
    )
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
}
