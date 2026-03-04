require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { logger } = require('./utils/logger');
const { initializeDatabase, closeDatabase } = require('./database/connection');

// Validate required environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]
});

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    logger.info(`Loaded command: ${command.data.name}`);
  } else {
    logger.warn(`Command at ${filePath} is missing required properties`);
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  logger.info(`Loaded event: ${event.name}`);
}

// Error handling
client.on('error', (error) => {
  logger.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection:', error);
});

process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  closeDatabase();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down gracefully...');
  closeDatabase();
  client.destroy();
  process.exit(0);
});

// Initialize database and login
initializeDatabase();

client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    logger.info('Bot login successful');
  })
  .catch((error) => {
    logger.error('Failed to login:', error);
    process.exit(1);
  });

// Health check server for Railway/Uptime monitoring
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    const health = {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      bot: client.user ? {
        username: client.user.username,
        id: client.user.id,
        status: client.ws.status === 0 ? 'connected' : 'disconnected'
      } : 'initializing'
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health, null, 2));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  logger.info(`Health check server running on port ${PORT}`);
});
