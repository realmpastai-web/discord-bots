module.exports = {
  name: 'ready',
  once: true,

  execute(client, services) {
    const { logger } = services;
    logger.info(`✓ Bot logged in as ${client.user.tag}`);
    
    client.user.setActivity('/help for commands', { type: 'LISTENING' });
    
    console.log(`
╔════════════════════════════════════════════════════════╗
║  🏠 Real Estate Lead Bot v1.0.0                        ║
║  Logged in as: ${client.user.tag.padEnd(39)}║
║  Guilds: ${String(client.guilds.cache.size).padEnd(48)}║
╚════════════════════════════════════════════════════════╝
    `);
  },
};
