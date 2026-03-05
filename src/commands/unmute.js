const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('user').setDescription('The user to unmute').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for unmuting').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guildId = interaction.guild.id;

    if (!target) {
      return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
    }

    // Get mute role
    const settings = db.prepare('SELECT mute_role_id, log_channel_id FROM guild_settings WHERE guild_id = ?').get(guildId);
    if (!settings?.mute_role_id) {
      return interaction.reply({ 
        content: '❌ No mute role configured.', 
        ephemeral: true 
      });
    }

    const muteRole = interaction.guild.roles.cache.get(settings.mute_role_id);
    if (!muteRole) {
      return interaction.reply({ 
        content: '❌ Mute role not found.', 
        ephemeral: true 
      });
    }

    if (!target.roles.cache.has(muteRole.id)) {
      return interaction.reply({ 
        content: '❌ This user is not muted.', 
        ephemeral: true 
      });
    }

    try {
      await target.roles.remove(muteRole);

      // Remove from database
      db.prepare('DELETE FROM mutes WHERE guild_id = ? AND user_id = ?').run(guildId, target.id);

      // DM user
      try {
        await target.send({
          embeds: [{
            color: 0x00FF00,
            title: `🔊 Unmuted in ${interaction.guild.name}`,
            description: `**Reason:** ${reason}`
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
              color: 0x00FF00,
              title: '🔊 User Unmuted',
              description: `**User:** ${target.user.tag} (${target.id})\n**Reason:** ${reason}`,
              footer: { text: `Unmuted by ${interaction.user.tag}` },
              timestamp: new Date().toISOString()
            }]
          });
        }
      }

      await interaction.reply({
        content: `✅ ${target.user.tag} has been unmuted.`,
        ephemeral: true
      });

    } catch (error) {
      await interaction.reply({
        content: `❌ Failed to unmute user: ${error.message}`,
        ephemeral: true
      });
    }
  }
};