const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('raid')
    .setDescription('Configure raid protection settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('View raid protection status')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Enable or disable raid protection')
        .addBooleanOption(option =>
          option.setName('enabled').setDescription('Enable raid protection').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('settings')
        .setDescription('Configure raid detection settings')
        .addIntegerOption(option =>
          option.setName('threshold')
            .setDescription('Number of joins to trigger (5-50)')
            .setMinValue(5)
            .setMaxValue(50)
        )
        .addIntegerOption(option =>
          option.setName('window')
            .setDescription('Time window in seconds (10-300)')
            .setMinValue(10)
            .setMaxValue(300)
        )
        .addStringOption(option =>
          option.setName('action')
            .setDescription('Action to take during raid')
            .addChoices(
              { name: 'Lockdown Only', value: 'lockdown' },
              { name: 'Lockdown + Kick New Accounts', value: 'kick' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('lockdown')
        .setDescription('Manually toggle server lockdown')
        .addBooleanOption(option =>
          option.setName('enabled').setDescription('Enable lockdown').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('reason').setDescription('Reason for lockdown')
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // Ensure settings exist
    const existing = db.prepare('SELECT guild_id FROM raid_protection WHERE guild_id = ?').get(guildId);
    if (!existing) {
      db.prepare('INSERT INTO raid_protection (guild_id) VALUES (?)').run(guildId);
    }

    switch (subcommand) {
      case 'status':
        await this.showStatus(interaction, guildId);
        break;
      case 'toggle':
        await this.toggleRaidProtection(interaction, guildId);
        break;
      case 'settings':
        await this.configureSettings(interaction, guildId);
        break;
      case 'lockdown':
        await this.toggleLockdown(interaction, guildId);
        break;
    }
  },

  async showStatus(interaction, guildId) {
    const settings = db.prepare('SELECT * FROM raid_protection WHERE guild_id = ?').get(guildId);
    const recentJoins = db.prepare(`
      SELECT COUNT(*) as count FROM join_history
      WHERE guild_id = ? AND joined_at > datetime('now', '-1 minute')
    `).get(guildId);

    const embed = new EmbedBuilder()
      .setColor(settings?.enabled ? 0x00FF00 : 0xFF0000)
      .setTitle('🛡️ Raid Protection Status')
      .addFields(
        { name: 'Status', value: settings?.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
        { name: 'Join Threshold', value: String(settings?.join_threshold || 10), inline: true },
        { name: 'Time Window', value: `${settings?.time_window || 60}s`, inline: true },
        { name: 'Action', value: settings?.action || 'lockdown', inline: true },
        { name: 'Joins (Last 1m)', value: String(recentJoins?.count || 0), inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  async toggleRaidProtection(interaction, guildId) {
    const enabled = interaction.options.getBoolean('enabled');

    db.prepare('UPDATE raid_protection SET enabled = ? WHERE guild_id = ?')
      .run(enabled ? 1 : 0, guildId);

    await interaction.reply({
      content: `✅ Raid protection ${enabled ? 'enabled' : 'disabled'}.`,
      ephemeral: true
    });
  },

  async configureSettings(interaction, guildId) {
    const threshold = interaction.options.getInteger('threshold');
    const window = interaction.options.getInteger('window');
    const action = interaction.options.getString('action');

    const updates = [];
    if (threshold !== null) {
      db.prepare('UPDATE raid_protection SET join_threshold = ? WHERE guild_id = ?')
        .run(threshold, guildId);
      updates.push(`threshold: ${threshold}`);
    }
    if (window !== null) {
      db.prepare('UPDATE raid_protection SET time_window = ? WHERE guild_id = ?')
        .run(window, guildId);
      updates.push(`window: ${window}s`);
    }
    if (action !== null) {
      db.prepare('UPDATE raid_protection SET action = ? WHERE guild_id = ?')
        .run(action, guildId);
      updates.push(`action: ${action}`);
    }

    await interaction.reply({
      content: `✅ Raid protection settings updated: ${updates.join(', ') || 'no changes'}`,
      ephemeral: true
    });
  },

  async toggleLockdown(interaction, guildId) {
    const enabled = interaction.options.getBoolean('enabled');
    const reason = interaction.options.getString('reason') || 'Manual lockdown';

    if (enabled) {
      // Enable lockdown
      try {
        await interaction.guild.setVerificationLevel(4); // Highest
        
        // Log to mod channel
        const settings = db.prepare('SELECT log_channel_id FROM guild_settings WHERE guild_id = ?').get(guildId);
        if (settings?.log_channel_id) {
          const channel = interaction.guild.channels.cache.get(settings.log_channel_id);
          if (channel) {
            await channel.send({
              embeds: [{
                color: 0xFF0000,
                title: '🚨 SERVER LOCKDOWN ACTIVATED',
                description: `**Reason:** ${reason}\n**Activated by:** ${interaction.user.tag}\n\nVerification level set to Highest.`,
                timestamp: new Date().toISOString()
              }]
            });
          }
        }

        await interaction.reply({
          content: `🚨 Server lockdown activated. Verification level set to Highest.`,
          ephemeral: true
        });
      } catch (error) {
        await interaction.reply({
          content: `❌ Failed to activate lockdown: ${error.message}`,
          ephemeral: true
        });
      }
    } else {
      // Disable lockdown
      try {
        await interaction.guild.setVerificationLevel(2); // Medium

        // Log to mod channel
        const settings = db.prepare('SELECT log_channel_id FROM guild_settings WHERE guild_id = ?').get(guildId);
        if (settings?.log_channel_id) {
          const channel = interaction.guild.channels.cache.get(settings.log_channel_id);
          if (channel) {
            await channel.send({
              embeds: [{
                color: 0x00FF00,
                title: '✅ SERVER LOCKDOWN LIFTED',
                description: `**Lifted by:** ${interaction.user.tag}\n\nVerification level restored.`,
                timestamp: new Date().toISOString()
              }]
            });
          }
        }

        await interaction.reply({
          content: `✅ Server lockdown lifted. Verification level restored.`,
          ephemeral: true
        });
      } catch (error) {
        await interaction.reply({
          content: `❌ Failed to lift lockdown: ${error.message}`,
          ephemeral: true
        });
      }
    }
  }
};