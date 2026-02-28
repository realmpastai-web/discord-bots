module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Shield Bot is online! Logged in as ${client.user.tag}`);
    console.log(`🌐 Serving ${client.guilds.cache.size} servers`);
    
    // Set bot activity
    client.user.setActivity('/help for commands', { type: 2 }); // Listening
    
    // Register slash commands globally
    try {
      const commands = [];
      const { REST, Routes } = require('discord.js');
      
      for (const [name, command] of client.commands) {
        commands.push(command.data.toJSON());
      }

      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
      
      console.log('🔄 Registering slash commands...');
      
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands }
      );
      
      console.log(`✅ Registered ${commands.length} slash commands globally`);
    } catch (error) {
      console.error('❌ Error registering commands:', error);
    }
  },
};
