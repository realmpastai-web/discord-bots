const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filters')
    .setDescription('Configure individual filter settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand
        .setName('antispam')
        .setDescription('Configure anti-spam settings')
        .addBooleanOption(option =>
          option.setName('enabled').setDescription('Enable anti-spam').setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('sensitivity')
            .setDescription('Messages allowed in 10 seconds (1-10)')
            .setMinValue(1)
            .setMaxValue(10)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('antilink')
        .setDescription('Configure anti-link settings')
        .addBooleanOption(option =>
          option.setName('enabled').setDescription('Enable anti-link').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('whitelist')
            .setDescription('Comma-separated list of allowed domains (e.g., github.com, google.com)')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('antiinvite')
        .setDescription('Toggle Discord invite blocking')
        .addBooleanOption(option =>
          option.setName('enabled').setDescription('Enable anti-invite').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('profanity')
        .setDescription('Configure profanity filter')
        .addBooleanOption(option =>
          option.setName('enabled').setDescription('Enable profanity filter').setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('strictness')
            .setDescription('Filter strictness (1-3)')
            .addChoices(
              { name: 'Low', value: 1 },
              { name: 'Medium', value: 2 },
              { name: 'High', value: 3 }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('caps')
        .setDescription('Configure caps lock filter')
        .addBooleanOption(option =>
          option.setName('enabled').setDescription('Enable caps filter').setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('threshold')
            .setDescription('Caps percentage threshold (50-100)')
            .setMinValue(50)
            .setMaxValue(100)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('antimention')
        .setDescription('Configure mention spam protection')
        .addBooleanOption(option =>
          option.setName('enabled').setDescription('Enable anti-mention').setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('limit')
            .setDescription('Max mentions per message (3-20)')
            .setMinValue(3)
            .setMaxValue(20)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // Ensure settings exist
    const existing = db.prepare('SELECT guild_id FROM filter_settings WHERE guild_id = ?').get(guildId);
    if (!existing) {
      db.prepare('INSERT INTO filter_settings (guild_id) VALUES (?)').run(guildId);
    }

    switch (subcommand) {
      case 'antispam':
        await this.configureAntiSpam(interaction, guildId);
        break;
      case 'antilink':
        await this.configureAntiLink(interaction, guildId);
        break;
      case 'antiinvite':
        await this.configureAntiInvite(interaction, guildId);
        break;
      case 'profanity':
        await this.configureProfanity(interaction, guildId);
        break;
      case 'caps':
        await this.configureCaps(interaction, guildId);
        break;
      case 'antimention':
        await this.configureAntiMention(interaction, guildId);
        break;
    }
  },

  async configureAntiSpam(interaction, guildId) {
    const enabled = interaction.options.getBoolean('enabled');
    const sensitivity = interaction.options.getInteger('sensitivity') || 3;

    db.prepare(`
      UPDATE filter_settings 
      SET anti_spam_enabled = ?, anti_spam_sensitivity = ?
      WHERE guild_id = ?
    `).run(enabled ? 1 : 0, sensitivity, guildId);

    await interaction.reply({
      content: `✅ Anti-spam ${enabled ? 'enabled' : 'disabled'} (sensitivity: ${sensitivity} messages/10s)`,
      ephemeral: true
    });
  },

  async configureAntiLink(interaction, guildId) {
    const enabled = interaction.options.getBoolean('enabled');
    const whitelist = interaction.options.getString('whitelist') || '';

    db.prepare(`
      UPDATE filter_settings 
      SET anti_link_enabled = ?, anti_link_whitelist = ?
      WHERE guild_id = ?
    `).run(enabled ? 1 : 0, whitelist, guildId);

    const whitelistMsg = whitelist ? `\nWhitelisted: ${whitelist}` : '';
    await interaction.reply({
      content: `✅ Anti-link ${enabled ? 'enabled' : 'disabled'}${whitelistMsg}`,
      ephemeral: true
    });
  },

  async configureAntiInvite(interaction, guildId) {
    const enabled = interaction.options.getBoolean('enabled');

    db.prepare('UPDATE filter_settings SET anti_invite_enabled = ? WHERE guild_id = ?')
      .run(enabled ? 1 : 0, guildId);

    await interaction.reply({
      content: `✅ Anti-invite ${enabled ? 'enabled' : 'disabled'}`,
      ephemeral: true
    });
  },

  async configureProfanity(interaction, guildId) {
    const enabled = interaction.options.getBoolean('enabled');
    const strictness = interaction.options.getInteger('strictness') || 2;

    db.prepare(`
      UPDATE filter_settings 
      SET profanity_filter_enabled = ?, profanity_filter_strictness = ?
      WHERE guild_id = ?
    `).run(enabled ? 1 : 0, strictness, guildId);

    const levels = ['Low', 'Medium', 'High'];
    await interaction.reply({
      content: `✅ Profanity filter ${enabled ? 'enabled' : 'disabled'} (strictness: ${levels[strictness - 1]})`,
      ephemeral: true
    });
  },

  async configureCaps(interaction, guildId) {
    const enabled = interaction.options.getBoolean('enabled');
    const threshold = interaction.options.getInteger('threshold') || 70;

    db.prepare(`
      UPDATE filter_settings 
      SET caps_filter_enabled = ?, caps_filter_threshold = ?
      WHERE guild_id = ?
    `).run(enabled ? 1 : 0, threshold, guildId);

    await interaction.reply({
      content: `✅ Caps filter ${enabled ? 'enabled' : 'disabled'} (threshold: ${threshold}%)`,
      ephemeral: true
    });
  },

  async configureAntiMention(interaction, guildId) {
    const enabled = interaction.options.getBoolean('enabled');
    const limit = interaction.options.getInteger('limit') || 5;

    db.prepare(`
      UPDATE filter_settings 
      SET anti_mention_enabled = ?, anti_mention_limit = ?
      WHERE guild_id = ?
    `).run(enabled ? 1 : 0, limit, guildId);

    await interaction.reply({
      content: `✅ Anti-mention ${enabled ? 'enabled' : 'disabled'} (limit: ${limit} mentions/message)`,
      ephemeral: true
    });
  }
};