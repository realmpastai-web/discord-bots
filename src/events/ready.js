module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} guild(s)`);
    console.log('🤖 QuantBit Moderation Bot is online!');
  }
};
