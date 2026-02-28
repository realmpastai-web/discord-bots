# 🛡️ QuantBit Moderation Bot

A professional, feature-rich Discord moderation bot built with **discord.js v14** and **Node.js**. Designed for server administrators who need reliable, comprehensive moderation tools.

![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blue)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## ✨ Features

### Core Moderation Commands
- 🚪 **Kick** - Remove members from the server
- 🔨 **Ban/Unban** - Permanently remove members
- ⏱️ **Timeout** - Temporary mutes with duration options
- ⚠️ **Warn** - Issue warnings with automatic escalation
- 🧹 **Purge** - Bulk delete messages (with user filter)
- 🔒 **Lock/Unlock** - Channel lockdown for emergencies

### Advanced Features
- **Persistent Warnings** - SQLite database stores all warnings
- **Warning System** - Track, view, and clear warnings
- **Auto-Mod** - Automatic timeout after reaching warning threshold
- **Mod Logging** - All actions logged to configurable channel
- **DM Notifications** - Users are notified of actions against them
- **Permission Checks** - Prevents abuse with role hierarchy validation

### Technical
- 🐳 **Docker Ready** - One-command deployment
- 💾 **SQLite Database** - No external DB required
- ⚡ **Slash Commands** - Modern Discord interface
- 🔒 **Secure** - Input validation and error handling
- 📊 **Statistics** - Built-in ping/uptime monitoring

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ installed
- A Discord account and a server where you have admin rights

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** and give it a name
3. Navigate to **Bot** tab on the left
4. Click **"Add Bot"**
5. Under **Privileged Gateway Intents**, enable:
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT
6. Copy your **Token** (keep this secret!)

### 2. Get Application ID

1. In the Developer Portal, go to **General Information**
2. Copy the **Application ID**

### 3. Invite Bot to Server

Replace `YOUR_APPLICATION_ID` in this URL:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_APPLICATION_ID&permissions=1099511627775&scope=bot%20applications.commands
```

Click the link and select your server.

### 4. Installation

**Option A: Local Installation**

```bash
# Clone the repository
git clone https://github.com/quantbitrealmSimon/discord-bots.git
cd discord-bots/moderation-bot

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Discord token and application ID

# Deploy slash commands
npm run deploy

# Start the bot
npm start
```

**Option B: Docker (Recommended)**

```bash
# Clone the repository
git clone https://github.com/quantbitrealmSimon/discord-bots.git
cd discord-bots/moderation-bot

# Configure environment
cp .env.example .env
# Edit .env with your Discord token and application ID

# Deploy commands and start
npm run deploy
docker-compose up -d
```

---

## ⚙️ Configuration

Create a `.env` file with the following:

```env
# Required
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here

# Optional
GUILD_ID=your_test_server_id          # For testing slash commands quickly
MOD_LOG_CHANNEL_ID=your_log_channel   # Channel for mod action logs

# Auto-Mod Settings
ENABLE_AUTOMOD=true                   # Enable auto-timeout after warnings
MAX_WARNINGS_BEFORE_ACTION=3          # Warnings before auto-action
AUTO_TIMEOUT_DURATION=3600            # Auto-timeout duration in seconds

# Database
DATABASE_PATH=./data/moderation.db    # SQLite database location
```

---

## 📋 Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/ping` | Check bot status and latency | Everyone |
| `/help [command]` | Display help information | Everyone |
| `/kick @user [reason]` | Kick a member | Kick Members |
| `/ban @user [reason] [delete_messages]` | Ban a member | Ban Members |
| `/unban user_id [reason]` | Unban a user | Ban Members |
| `/timeout @user duration [reason]` | Timeout a member | Moderate Members |
| `/warn @user reason` | Issue a warning | Moderate Members |
| `/warnings view @user` | View user's warnings | Moderate Members |
| `/warnings clear @user [reason]` | Clear all warnings | Manage Server |
| `/warnings remove id [reason]` | Remove specific warning | Moderate Members |
| `/purge amount [@user]` | Delete messages | Manage Messages |
| `/lock [channel] [reason] [role]` | Lock a channel | Manage Channels |
| `/unlock [channel] [reason] [role]` | Unlock a channel | Manage Channels |
| `/modlogs @user [limit]` | View moderation history | Moderate Members |

---

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Start the bot
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the bot
docker-compose down

# Restart
docker-compose restart
```

### Using Docker Directly

```bash
# Build the image
docker build -t quantbit-moderation-bot .

# Run the container
docker run -d \
  --name moderation-bot \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  quantbit-moderation-bot
```

---

## 📁 Project Structure

```
moderation-bot/
├── src/
│   ├── commands/          # Slash command handlers
│   │   ├── ping.js
│   │   ├── kick.js
│   │   ├── ban.js
│   │   └── ...
│   ├── events/            # Discord event handlers
│   │   ├── ready.js
│   │   ├── interactionCreate.js
│   │   └── guildMemberAdd.js
│   ├── utils/             # Helper utilities
│   │   ├── embeds.js
│   │   └── database.js
│   ├── config.js          # Configuration loader
│   ├── deploy-commands.js # Command deployment script
│   └── index.js           # Bot entry point
├── data/                  # SQLite database (created at runtime)
├── .env.example           # Environment template
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

---

## 🔐 Required Bot Permissions

When inviting the bot, ensure it has these permissions:

- ✅ Kick Members
- ✅ Ban Members
- ✅ Manage Messages
- ✅ Manage Channels
- ✅ Moderate Members
- ✅ Read Messages
- ✅ Send Messages
- ✅ Embed Links
- ✅ Attach Files
- ✅ Read Message History
- ✅ Use Slash Commands

---

## 🚨 Troubleshooting

### "Privileged intent provided is not enabled"
Go to Developer Portal → Bot → Privileged Gateway Intents → Enable SERVER MEMBERS INTENT and MESSAGE CONTENT INTENT.

### Commands not appearing
Run `npm run deploy` after adding the bot to a new server or updating commands.

### "Interaction has already been acknowledged"
This is a timing issue. The bot handles this automatically.

### Database errors
Ensure the `data/` directory exists and is writable: `mkdir -p data`

---

## 📝 License

MIT License - See [LICENSE](../LICENSE) for details.

---

## 🤝 Support

- **GitHub Issues**: Report bugs or request features
- **Discord**: [Add to your server](https://discord.com/api/oauth2/authorize?client_id=YOUR_APPLICATION_ID&permissions=1099511627775&scope=bot%20applications.commands)

---

Built with ❤️ by [QuantBitRealm](https://github.com/quantbitrealmSimon)
