const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help information for Auto-Moderator Pro'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🤖 Auto-Moderator Pro - Help')
      .setDescription('Advanced auto-moderation and community management bot')
      .addFields(
        {
          name: '🛡️ Auto-Moderation',
          value: '`/automod status` - View current settings\n' +
                 '`/automod toggle` - Enable/disable auto-mod\n' +
                 '`/automod logchannel` - Set log channel\n' +
                 '`/automod muterole` - Set mute role'
        },
        {
          name: '🔧 Filters',
          value: '`/filters antispam` - Configure spam protection\n' +
                 '`/filters antilink` - Configure link filtering\n' +
                 '`/filters antiinvite` - Toggle invite blocking\n' +
                 '`/filters profanity` - Configure profanity filter\n' +
                 '`/filters caps` - Configure caps filter\n' +
                 '`/filters antimention` - Configure mention spam protection'
        },
        {
          name: '⚡ Moderation Commands',
          value: '`/warn` - Warn a user\n' +
                 '`/mute` - Mute a user temporarily\n' +
                 '`/unmute` - Unmute a user\n' +
                 '`/kick` - Kick a user\n' +
                 '`/ban` - Ban a user (supports temp bans)\n' +
                 '`/unban` - Unban a user'
        },
        {
          name: '🛡️ Raid Protection',
          value: '`/raid status` - View raid protection status\n' +
                 '`/raid toggle` - Enable/disable raid protection\n' +
                 '`/raid settings` - Configure detection settings\n' +
                 '`/raid lockdown` - Manual server lockdown'
        },
        {
          name: '📊 Statistics',
          value: '`/modstats user` - View user moderation history\n' +
                 '`/modstats server` - View server-wide stats\n' +
                 '`/modstats violations` - View recent violations'
        },
        {
          name: '🤖 Automatic Features',
          value: '• **Anti-Spam** - Detects and removes spam messages\n' +
                 '• **Anti-Link** - Blocks unauthorized links\n' +
                 '• **Anti-Invite** - Blocks Discord invite links\n' +
                 '• **Profanity Filter** - Filters inappropriate language\n' +
                 '• **Caps Filter** - Limits excessive capitalization\n' +
                 '• **Zalgo Filter** - Blocks obfuscated text\n' +
                 '• **Emoji Spam** - Limits excessive emoji usage\n' +
                 '• **Raid Protection** - Automatic raid detection and lockdown'
        }
      )
      .setFooter({ text: 'Auto-Moderator Pro v1.0.0 | QuantBitRealm' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};