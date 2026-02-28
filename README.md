# Discord Moderation Bot

A professional Discord moderation bot with warnings, auto-moderation, and comprehensive logging.

## Features

- **Moderation Commands**: `/ban`, `/kick`, `/timeout`, `/warn`, `/warnings`, `/clearwarns`
- **Auto-Moderation**: Word filter, spam detection, mention spam protection
- **Logging**: All moderation actions logged to designated channel
- **Persistent Warnings**: SQLite database for warning history
- **Clean Architecture**: Modular, extensible codebase

## Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/quantbitrealmSimon/discord-bots.git
cd discord-bots/moderation-bot
npm install
```

### 2. Configure
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Required:
- `DISCORD_TOKEN` - Your bot token from [Discord Developer Portal](https://discord.com/developers/applications)
- `CLIENT_ID` - Your application's client ID
- `GUILD_ID` - Your test server's ID (for development)

### 3. Invite Bot to Server
Use this URL (replace `YOUR_CLIENT_ID`):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274878024770&scope=bot%20applications.commands
```

Required permissions:
- Ban Members
- Kick Members  
- Moderate Members (timeout)
- Manage Messages
- View Audit Log
- Send Messages
- Read Message History

### 4. Run
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Docker Deployment

```bash
docker-compose up -d
```

## Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/ban @user [reason] [days]` | Ban a user | Ban Members |
| `/kick @user [reason]` | Kick a user | Kick Members |
| `/timeout @user duration [reason]` | Timeout a user | Moderate Members |
| `/warn @user [reason]` | Issue a warning | Kick Members |
| `/warnings @user` | View user warnings | Kick Members |
| `/clearwarns @user` | Clear all warnings | Ban Members |
| `/setmodlog #channel` | Set moderation log channel | Administrator |
| `/automod` | Configure auto-mod settings | Administrator |
| `/modstats` | View moderation statistics | Kick Members |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DISCORD_TOKEN` | Bot token from Discord | Yes |
| `CLIENT_ID` | Application client ID | Yes |
| `GUILD_ID` | Test server ID (dev only) | No |
| `MOD_LOG_CHANNEL` | Default mod log channel ID | No |
| `DATABASE_PATH` | SQLite database path | No (default: ./data/moderation.db) |

## Support

For support, contact: support@quantbitrealm.dev

## License

MIT License - See [LICENSE](LICENSE)