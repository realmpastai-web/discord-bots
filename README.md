# 🎉 Giveaway Pro Bot

A professional Discord giveaway bot with advanced requirements, verification, and analytics.

## Features

- 🎁 **Easy Giveaway Creation** - Simple slash commands to create giveaways
- ✅ **Requirements System** - Role requirements, account age verification
- 🏆 **Multiple Winners** - Support for up to 10 winners per giveaway
- 🎲 **Reroll Functionality** - Pick new winners if needed
- 📊 **Statistics & Analytics** - Track entries and view detailed stats
- ⏰ **Flexible Duration** - Support for minutes, hours, days
- 🔒 **Secure** - SQLite database with WAL mode
- 🐳 **Docker Ready** - One-command deployment

## Commands

### Admin Commands
- `/giveaway-create` - Create a new giveaway with optional requirements
- `/giveaway-end` - End a giveaway early
- `/giveaway-reroll` - Reroll winners for an ended giveaway
- `/giveaway-list` - List all active giveaways
- `/giveaway-stats` - View detailed statistics for a giveaway

### User Commands
- Click the 🎉 button on any giveaway to enter!

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your bot token
```

### 3. Deploy Commands
```bash
npm run deploy
```

### 4. Start the Bot
```bash
npm start
```

## Docker Deployment

```bash
docker-compose up -d
```

## Railway Deployment

1. Connect your GitHub repo to Railway
2. Add environment variables
3. Deploy!

## Requirements

- Node.js 18+
- Discord Bot Token
- Manage Events permission

## License

MIT

Built with ❤️ by QuantBitRealm
