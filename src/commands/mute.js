const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/connection');
const ms = require('ms');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('user').setDescription('The user to mute').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('duration').setDescription('Duration (e.g., 1h, 30m, 1d)').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for the mute').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guildId = interaction.guild.id;

    if (!target) {
      return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot mute yourself.', ephemeral: true });
    }

    if (!target.moderatable) {
      return interaction.reply({ content: '❌ I cannot mute this user. They may have higher permissions.', ephemeral: true });
    }

    // Parse duration
    const duration = ms(durationStr);
    if (!duration || duration < 1000) {
      return interaction.reply({ content: '❌ Invalid duration. Use format like: 1h, 30m, 1d', ephemeral: true });
    }

    // Get mute role
    const settings = db.prepare('SELECT mute_role_id FROM guild_settings WHERE guild_id = ?').get(guildId);
    if (!settings?.mute_role_id) {
      return interaction.reply({ 
        content: '❌ No mute role configured. Use `/automod muterole` to set one.', 
        ephemeral: true 
      });
    }

    const muteRole = interaction.guild.roles.cache.get(settings.mute_role_id);
    if (!muteRole) {
      return interaction.reply({ 
        content: '❌ Mute role not found. Please reconfigure with `/automod muterole`.', 
        ephemeral: true 
      });
    }

    // Apply mute
    try {
      await target.roles.add(muteRole);

      const expiresAt = new Date(Date.now() + duration);

      // Log to database
      db.prepare(`
        INSERT INTO mutes (guild_id, user_id, moderator_id, reason, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(guildId, target.id, interaction.user.id, reason, expiresAt.toISOString());

      // Log violation
      db.prepare(`
        INSERT INTO violations (guild_id, user_id, moderator_id, type, reason, action_taken, points)
        VALUES (?, ?, ?, 'manual_mute', ?, 'mute', 2)
      `).run(guildId, target.id, interaction.user.id, reason);

      // DM user
      try {
        await target.send({
          embeds: [{
            color: 0xFF0000,
            title: `🔇 Muted in ${interaction.guild.name}`,
            description: `**Duration:** ${durationStr}\n**Reason:** ${reason}`,
            footer: { text: `Muted by ${interaction.user.tag}` }
          }]
        });
      } catch (error) {
        // DMs closed
      }

      // Log to mod channel
      if (settings.log_channel_id) {
        const channel = interaction.guild.channels.cache.get(settings.log_channel_id);
        if (channel) {
          await channel.send({
            embeds: [{
              color: 0xFF0000,
              title: '🔇 User Muted',
              description: `**User:** ${target.user.tag} (${target.id})\n**Duration:** ${durationStr}\n**Reason:** ${reason}`,
              footer: { text: `Muted by ${interaction.user.tag}` },
              timestamp: new Date().toISOString()
            }]
          });
        }
      }

      await interaction.reply({
        content: `✅ ${target.user.tag} has been muted for ${durationStr}.`,
        ephemeral: true
      });

    } catch (error) {
      await interaction.reply({
        content: `❌ Failed to mute user: ${error.message}`,
        ephemeral: true
      });
    }
  }
};