const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/connection');
const ms = require('ms');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option.setName('user').setDescription('The user to ban').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for banning').setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('days')
        .setDescription('Days of message history to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
    )
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Duration for temporary ban (e.g., 7d, 1w, 30d). Leave empty for permanent.')
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('days') || 0;
    const durationStr = interaction.options.getString('duration');
    const guildId = interaction.guild.id;

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot ban yourself.', ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (member && !member.bannable) {
      return interaction.reply({ content: '❌ I cannot ban this user. They may have higher permissions.', ephemeral: true });
    }

    try {
      // DM user before banning
      try {
        const isTemp = durationStr ? `\n**Duration:** ${durationStr}` : '';
        await target.send({
          embeds: [{
            color: 0x8B0000,
            title: `🔨 Banned from ${interaction.guild.name}`,
            description: `**Reason:** ${reason}${isTemp}`
          }]
        });
      } catch (error) {
        // DMs closed
      }

      await interaction.guild.members.ban(target, { 
        reason, 
        deleteMessageDays: deleteDays 
      });

      // Calculate expiration for temp bans
      let expiresAt = null;
      let isTempBan = 0;
      if (durationStr) {
        const duration = ms(durationStr);
        if (duration) {
          expiresAt = new Date(Date.now() + duration);
          isTempBan = 1;
        }
      }

      // Log to database
      db.prepare(`
        INSERT INTO bans (guild_id, user_id, moderator_id, reason, is_tempban, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(guildId, target.id, interaction.user.id, reason, isTempBan, expiresAt?.toISOString() || null);

      // Log violation
      db.prepare(`
        INSERT INTO violations (guild_id, user_id, moderator_id, type, reason, action_taken, points)
        VALUES (?, ?, ?, 'manual_ban', ?, 'ban', 5)
      `).run(guildId, target.id, interaction.user.id, reason);

      // Log to mod channel
      const settings = db.prepare('SELECT log_channel_id FROM guild_settings WHERE guild_id = ?').get(guildId);
      if (settings?.log_channel_id) {
        const channel = interaction.guild.channels.cache.get(settings.log_channel_id);
        if (channel) {
          const durationText = durationStr ? `\n**Duration:** ${durationStr}` : '\n**Duration:** Permanent';
          await channel.send({
            embeds: [{
              color: 0x8B0000,
              title: '🔨 User Banned',
              description: `**User:** ${target.tag} (${target.id})\n**Reason:** ${reason}${durationText}`,
              footer: { text: `Banned by ${interaction.user.tag}` },
              timestamp: new Date().toISOString()
            }]
          });
        }
      }

      const durationText = durationStr ? ` for ${durationStr}` : ' permanently';
      await interaction.reply({
        content: `✅ ${target.tag} has been banned${durationText}.`,
        ephemeral: true
      });

    } catch (error) {
      await interaction.reply({
        content: `❌ Failed to ban user: ${error.message}`,
        ephemeral: true
      });
    }
  }
};