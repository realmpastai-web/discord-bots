const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Configure auto-moderation settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('View current auto-moderation status')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Enable or disable auto-moderation')
        .addBooleanOption(option =>
          option
            .setName('enabled')
            .setDescription('Enable auto-moderation')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('logchannel')
        .setDescription('Set the moderation log channel')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel for moderation logs')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('muterole')
        .setDescription('Set the mute role')
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('The role to use for mutes')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // Ensure guild settings exist
    const existingSettings = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
    if (!existingSettings) {
      db.prepare('INSERT INTO guild_settings (guild_id) VALUES (?)').run(guildId);
      db.prepare('INSERT INTO filter_settings (guild_id) VALUES (?)').run(guildId);
    }

    switch (subcommand) {
      case 'status':
        await this.showStatus(interaction, guildId);
        break;
      case 'toggle':
        await this.toggleAutoMod(interaction, guildId);
        break;
      case 'logchannel':
        await this.setLogChannel(interaction, guildId);
        break;
      case 'muterole':
        await this.setMuteRole(interaction, guildId);
        break;
    }
  },

  async showStatus(interaction, guildId) {
    const settings = db.prepare(`
      SELECT gs.*, fs.* 
      FROM guild_settings gs
      LEFT JOIN filter_settings fs ON gs.guild_id = fs.guild_id
      WHERE gs.guild_id = ?
    `).get(guildId);

    if (!settings) {
      return interaction.reply({
        content: '❌ No settings found. Run `/automod toggle` to initialize.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(settings.automod_enabled ? 0x00FF00 : 0xFF0000)
      .setTitle('🤖 Auto-Moderation Status')
      .addFields(
        { name: 'Status', value: settings.automod_enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
        { name: 'Anti-Spam', value: settings.anti_spam_enabled ? '✅ On' : '❌ Off', inline: true },
        { name: 'Anti-Link', value: settings.anti_link_enabled ? '✅ On' : '❌ Off', inline: true },
        { name: 'Anti-Invite', value: settings.anti_invite_enabled ? '✅ On' : '❌ Off', inline: true },
        { name: 'Profanity Filter', value: settings.profanity_filter_enabled ? '✅ On' : '❌ Off', inline: true },
        { name: 'Caps Filter', value: settings.caps_filter_enabled ? '✅ On' : '❌ Off', inline: true },
        { name: 'Log Channel', value: settings.log_channel_id ? `<#${settings.log_channel_id}>` : 'Not set', inline: false }
      )
      .setFooter({ text: 'Use /automod filters to configure individual filters' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  async toggleAutoMod(interaction, guildId) {
    const enabled = interaction.options.getBoolean('enabled');
    
    db.prepare('UPDATE guild_settings SET automod_enabled = ? WHERE guild_id = ?')
      .run(enabled ? 1 : 0, guildId);

    await interaction.reply({
      content: `✅ Auto-moderation has been ${enabled ? 'enabled' : 'disabled'}.`,
      ephemeral: true
    });
  },

  async setLogChannel(interaction, guildId) {
    const channel = interaction.options.getChannel('channel');
    
    db.prepare('UPDATE guild_settings SET log_channel_id = ? WHERE guild_id = ?')
      .run(channel.id, guildId);

    await interaction.reply({
      content: `✅ Moderation log channel set to ${channel}.`,
      ephemeral: true
    });
  },

  async setMuteRole(interaction, guildId) {
    const role = interaction.options.getRole('role');
    
    db.prepare('UPDATE guild_settings SET mute_role_id = ? WHERE guild_id = ?')
      .run(role.id, guildId);

    await interaction.reply({
      content: `✅ Mute role set to ${role.name}.`,
      ephemeral: true
    });
  }
};