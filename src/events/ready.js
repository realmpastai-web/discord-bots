module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} guild(s) with ${client.users.cache.size} users`);
    
    // Set bot activity
    client.user.setActivity('/help for commands', { type: 2 }); // 2 = Listening
    
    // Log guilds the bot is in
    if (client.guilds.cache.size > 0) {
      console.log('\n📋 Guilds:');
      client.guilds.cache.forEach(guild => {
        console.log(`   • ${guild.name} (${guild.id}) - ${guild.memberCount} members`);
      });
    }
  }
};
