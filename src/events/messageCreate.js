const logger = require('../utils/logger');

module.exports = {
  name: 'messageCreate',

  async execute(message, client) {
    // Skip bot messages and DMs
    if (message.author.bot || !message.guild) return;

    // Process through auto-mod engine
    try {
      const result = await client.autoMod.processMessage(message);
      
      if (result.flagged) {
        logger.info(`Message flagged in ${message.guild.name}: ${result.violations.map(v => v.type).join(', ')}`);
      }
    } catch (error) {
      logger.error('Error in auto-mod processing:', error);
    }
  }
};