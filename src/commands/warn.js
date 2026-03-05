const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('user').setDescription('The user to warn').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for the warning').setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const guildId = interaction.guild.id;

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot warn yourself.', ephemeral: true });
    }

    if (target.id === interaction.client.user.id) {
      return interaction.reply({ content: '❌ You cannot warn me!', ephemeral: true });
    }

    // Log the warning
    db.prepare(`
      INSERT INTO violations (guild_id, user_id, moderator_id, type, reason, action_taken, points)
      VALUES (?, ?, ?, 'manual_warn', ?, 'warn', 1)
    `).run(guildId, target.id, interaction.user.id, reason);

    // Get warning count
    const warningCount = db.prepare(`
      SELECT COUNT(*) as count FROM violations 
      WHERE guild_id = ? AND user_id = ? AND type = 'manual_warn'
    `).get(guildId, target.id);

    // Try to DM the user
    try {
      await target.send({
        embeds: [{
          color: 0xFFA500,
          title: `⚠️ Warning from ${interaction.guild.name}`,
          description: `**Reason:** ${reason}`,
          fields: [
            { name: 'Warning Count', value: `This is your ${warningCount.count} warning.` }
          ],
          footer: { text: `Warned by ${interaction.user.tag}` },
          timestamp: new Date().toISOString()
        }]
      });
    } catch (error) {
      // User has DMs closed
    }

    // Log to mod channel
    const settings = db.prepare('SELECT log_channel_id FROM guild_settings WHERE guild_id = ?').get(guildId);
    if (settings?.log_channel_id) {
      const channel = interaction.guild.channels.cache.get(settings.log_channel_id);
      if (channel) {
        await channel.send({
          embeds: [{
            color: 0xFFA500,
            title: '⚠️ User Warned',
            description: `**User:** ${target.tag} (${target.id})\n**Reason:** ${reason}\n**Warnings:** ${warningCount.count}`,
            footer: { text: `Warned by ${interaction.user.tag}` },
            timestamp: new Date().toISOString()
          }]
        });
      }
    }

    await interaction.reply({
      content: `✅ ${target.tag} has been warned. (Warning #${warningCount.count})`,
      ephemeral: true
    });
  }
};