const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(option =>
      option.setName('user').setDescription('The user to kick').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for kicking').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guildId = interaction.guild.id;

    if (!target) {
      return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot kick yourself.', ephemeral: true });
    }

    if (!target.kickable) {
      return interaction.reply({ content: '❌ I cannot kick this user. They may have higher permissions.', ephemeral: true });
    }

    try {
      // DM user before kicking
      try {
        await target.send({
          embeds: [{
            color: 0xFFA500,
            title: `👢 Kicked from ${interaction.guild.name}`,
            description: `**Reason:** ${reason}`
          }]
        });
      } catch (error) {
        // DMs closed
      }

      await target.kick(reason);

      // Log violation
      db.prepare(`
        INSERT INTO violations (guild_id, user_id, moderator_id, type, reason, action_taken, points)
        VALUES (?, ?, ?, 'manual_kick', ?, 'kick', 3)
      `).run(guildId, target.id, interaction.user.id, reason);

      // Log to mod channel
      const settings = db.prepare('SELECT log_channel_id FROM guild_settings WHERE guild_id = ?').get(guildId);
      if (settings?.log_channel_id) {
        const channel = interaction.guild.channels.cache.get(settings.log_channel_id);
        if (channel) {
          await channel.send({
            embeds: [{
              color: 0xFFA500,
              title: '👢 User Kicked',
              description: `**User:** ${target.user.tag} (${target.id})\n**Reason:** ${reason}`,
              footer: { text: `Kicked by ${interaction.user.tag}` },
              timestamp: new Date().toISOString()
            }]
          });
        }
      }

      await interaction.reply({
        content: `✅ ${target.user.tag} has been kicked.`,
        ephemeral: true
      });

    } catch (error) {
      await interaction.reply({
        content: `❌ Failed to kick user: ${error.message}`,
        ephemeral: true
      });
    }
  }
};