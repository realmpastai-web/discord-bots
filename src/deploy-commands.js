const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load all commands
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`📦 Loaded command for deployment: ${command.data.name}`);
  } else {
    console.warn(`⚠️ Command at ${filePath} is missing required properties.`);
  }
}

// Validate config
if (!config.token) {
  console.error('❌ ERROR: DISCORD_TOKEN is required!');
  process.exit(1);
}

if (!config.clientId) {
  console.error('❌ ERROR: CLIENT_ID is required!');
  process.exit(1);
}

const rest = new REST().setToken(config.token);

(async () => {
  try {
    console.log(`\n🚀 Started refreshing ${commands.length} application (/) commands.`);

    let data;
    
    if (config.guildId) {
      // Deploy to specific guild (faster, for testing)
      console.log(`📍 Deploying to guild: ${config.guildId}`);
      data = await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
    } else {
      // Deploy globally (takes up to 1 hour to propagate)
      console.log('🌍 Deploying globally...');
      data = await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands }
      );
    }

    console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
    console.log('\n📋 Deployed commands:');
    data.forEach(cmd => console.log(`   • /${cmd.name} - ${cmd.description}`));
    
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
    if (error.message?.includes('401')) {
      console.error('💡 Hint: Check that your DISCORD_TOKEN is valid.');
    }
    if (error.message?.includes('10002')) {
      console.error('💡 Hint: Check that your CLIENT_ID is valid.');
    }
  }
})();
