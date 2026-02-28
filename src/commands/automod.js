const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Configure auto-moderation settings')
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Show current auto-mod settings')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Enable or disable auto-mod')
        .addBooleanOption(option =>
          option.setName('enabled').setDescription('Enable auto-mod').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('invites')
        .setDescription('Toggle Discord invite blocking')
        .addBooleanOption(option =>
          option.setName('block').setDescription('Block invite links').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('links')
        .setDescription('Toggle external link blocking')
        .addBooleanOption(option =>
          option.setName('block').setDescription('Block external links').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('mentions')
        .setDescription('Set max mentions per message')
        .addIntegerOption(option =>
          option.setName('limit').setDescription('Max mentions (0 to disable)').setMinValue(0).setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('logchannel')
        .setDescription('Set log channel for auto-mod')
        .addChannelOption(option =>
          option.setName('channel').setDescription('Channel for auto-mod logs').setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const settings = await interaction.client.db.getAutomodSettings(interaction.guild.id);

    switch (subcommand) {
      case 'status': {
        const embed = new EmbedBuilder()
          .setColor(settings.enabled ? 0x2ecc71 : 0xe74c3c)
          .setTitle('🤖 Auto-Moderation Settings')
          .addFields(
            { name: 'Status', value: settings.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
            { name: 'Block Invites', value: settings.block_invites ? '✅ Yes' : '❌ No', inline: true },
            { name: 'Block Links', value: settings.block_links ? '✅ Yes' : '❌ No', inline: true },
            { name: 'Max Mentions', value: settings.max_mentions.toString(), inline: true },
            { name: 'Max Emojis', value: settings.max_emojis.toString(), inline: true },
            { name: 'Log Channel', value: settings.log_channel_id ? `<#${settings.log_channel_id}>` : 'Not set', inline: true }
          )
          .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'toggle': {
        const enabled = interaction.options.getBoolean('enabled');
        await interaction.client.db.setAutomodSettings(interaction.guild.id, {
          ...settings,
          enabled: enabled ? 1 : 0,
        });
        await interaction.reply({
          content: `✅ Auto-moderation ${enabled ? 'enabled' : 'disabled'}.`,
        });
        break;
      }

      case 'invites': {
        const block = interaction.options.getBoolean('block');
        await interaction.client.db.setAutomodSettings(interaction.guild.id, {
          ...settings,
          blockInvites: block ? 1 : 0,
        });
        await interaction.reply({
          content: `✅ Discord invite links will ${block ? 'be blocked' : 'be allowed'}.`,
        });
        break;
      }

      case 'links': {
        const block = interaction.options.getBoolean('block');
        await interaction.client.db.setAutomodSettings(interaction.guild.id, {
          ...settings,
          blockLinks: block ? 1 : 0,
        });
        await interaction.reply({
          content: `✅ External links will ${block ? 'be blocked' : 'be allowed'}.`,
        });
        break;
      }

      case 'mentions': {
        const limit = interaction.options.getInteger('limit');
        await interaction.client.db.setAutomodSettings(interaction.guild.id, {
          ...settings,
          maxMentions: limit,
        });
        await interaction.reply({
          content: `✅ Maximum mentions per message set to **${limit}** (0 = disabled).`,
        });
        break;
      }

      case 'logchannel': {
        const channel = interaction.options.getChannel('channel');
        await interaction.client.db.setAutomodSettings(interaction.guild.id, {
          ...settings,
          logChannelId: channel.id,
        });
        await interaction.reply({
          content: `✅ Auto-mod log channel set to ${channel}.`,
        });
        break;
      }
    }
  },
};
