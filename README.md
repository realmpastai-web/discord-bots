# 🛡️ Shield — Discord Moderation Bot

A professional, production-ready Discord moderation bot with auto-moderation, warning system, and comprehensive logging. Built for server admins who want reliable moderation tools.

![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 🔨 Punishment Commands
- `/ban` — Ban users with optional message deletion
- `/kick` — Remove users from the server
- `/unban` — Unban users by ID
- `/timeout` — Temporarily mute users (up to 28 days)

### ⚠️ Warning System
- `/warn` — Issue warnings with automatic DMs
- `/warnings` — View all warnings for a user
- `/clearwarn` — Clear specific or all warnings

### 🧹 Message Management
- `/purge` — Bulk delete messages (1-100)
- `/slowmode` — Set channel rate limits

### 🤖 Auto-Moderation
- Block Discord invite links
- Block external URLs
- Limit mentions per message
- Limit emoji usage
- Automatic violation logging

### 📊 Utilities
- `/userinfo` — Detailed user information
- `/modlogs` — View moderation history
- `/automod` — Configure auto-mod settings
- `/help` — Command reference

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Docker
- Discord Bot Token ([Get one here](https://discord.com/developers/applications))

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/quantbitrealmSimon/discord-bots.git
cd discord-bots/moderation-bot

# Create environment file
cp .env.example .env
# Edit .env and add your Discord token

# Start with Docker Compose
docker-compose up -d
```

### Option 2: Node.js

```bash
# Clone and enter directory
git clone https://github.com/quantbitrealmSimon/discord-bots.git
cd discord-bots/moderation-bot

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env and add your Discord token

# Create directories
mkdir -p data logs

# Start the bot
npm start
```

## ⚙️ Configuration

Create a `.env` file:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
NODE_ENV=production
```

### Getting Your Credentials

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create New Application → Name it "Shield"
3. Go to "Bot" section → Add Bot → Copy Token
4. Go to "General Information" → Copy Application ID

## 🔗 Invite Link Template

Replace `YOUR_CLIENT_ID` with your bot's Application ID:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=1099511627775&scope=bot%20applications.commands
```

**Required Permissions:**
- Ban Members
- Kick Members
- Moderate Members (timeout)
- Manage Messages
- Manage Channels (slowmode)
- Read Messages / Send Messages
- Embed Links
- Read Message History

## 📁 Project Structure

```
moderation-bot/
├── src/
│   ├── commands/          # Slash commands
│   ├── events/            # Event handlers
│   ├── services/          # Database & utilities
│   └── index.js           # Entry point
├── data/                  # SQLite database
├── logs/                  # Log files
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## 💰 Pricing

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Basic moderation commands |
| **Premium** | $10/mo | Advanced auto-mod, custom logs, priority support |
| **Enterprise** | $50/mo | Multi-server dashboard, API access, white-label |

## 🛠️ Tech Stack

- **Framework:** Discord.js v14
- **Database:** SQLite3
- **Logging:** Winston
- **Deployment:** Docker + Docker Compose

## 📝 Commands Reference

| Command | Permission | Description |
|---------|-----------|-------------|
| `/ban` | Ban Members | Ban a user |
| `/kick` | Kick Members | Kick a user |
| `/timeout` | Moderate Members | Timeout a user |
| `/unban` | Ban Members | Unban by ID |
| `/warn` | Moderate Members | Issue warning |
| `/warnings` | Moderate Members | View warnings |
| `/clearwarn` | Moderate Members | Clear warnings |
| `/purge` | Manage Messages | Delete messages |
| `/slowmode` | Manage Channels | Set rate limit |
| `/automod` | Administrator | Configure auto-mod |
| `/modlogs` | Moderate Members | View action logs |
| `/userinfo` | Moderate Members | User details |
| `/help` | Everyone | Show commands |

## 🔒 Security

- All actions logged to database
- Permission checks on every command
- Non-root Docker user
- Input validation and sanitization

## 📄 License

MIT License — see LICENSE file for details.

---

**Built by [QuantBitRealm](https://github.com/quantbitrealmSimon)** 🚀
