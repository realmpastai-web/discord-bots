require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  modLogChannelId: process.env.MOD_LOG_CHANNEL_ID,
  autoMod: {
    enabled: process.env.ENABLE_AUTOMOD === 'true',
    maxWarnings: parseInt(process.env.MAX_WARNINGS_BEFORE_ACTION) || 3,
    autoTimeoutDuration: parseInt(process.env.AUTO_TIMEOUT_DURATION) || 3600
  },
  databasePath: process.env.DATABASE_PATH || './data/moderation.db',
  colors: {
    primary: 0x5865F2,
    success: 0x57F287,
    warning: 0xFEE75C,
    error: 0xED4245,
    info: 0xEB459E
  }
};
