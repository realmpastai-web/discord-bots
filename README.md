# QuantBit Moderation Bot

Professional Discord moderation bot with auto-mod, logging, and warning system.

## Features

- 🔨 **Ban/Kick** - Remove problematic users
- ⏱️ **Timeout** - Temporary mutes
- ⚠️ **Warning System** - Track user infractions with auto-timeout on threshold
- 🗑️ **Purge** - Bulk delete messages
- 🤖 **Auto-Mod** - Spam detection and banned word filtering
- 📋 **Mod Logs** - All actions logged to configured channel

## Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" → Name it "QuantBit Moderator"
3. Go to "Bot" tab → Click "Add Bot"
4. Enable intents: **Server Members Intent**, **Message Content Intent**
5. Copy your **Bot Token** (keep it secret!)

### 2. Invite Bot to Server

Go to OAuth2 → URL Generator:
- Scope: `bot`, `applications.commands`
- Bot Permissions: `Ban Members`, `Kick Members`, `Moderate Members`, `Manage Messages`, `Send Messages`, `Embed Links`, `Read Message History`

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274877910032&scope=bot%20applications.commands
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 4. Install & Run

```bash
npm install
npm start
```

Or with Docker:
```bash
docker-compose up -d
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DISCORD_TOKEN` | Your bot token | Required |
| `LOG_CHANNEL_ID` | Channel ID for mod logs | Optional |
| `WARN_THRESHOLD` | Warnings before auto-timeout | 3 |
| `SPAM_THRESHOLD` | Messages in spam window to trigger | 5 |
| `SPAM_WINDOW` | Time window for spam (ms) | 5000 |
| `BANNED_WORDS` | Comma-separated banned words | None |

## Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/ban @user [reason] [days]` | Ban a user | Ban Members |
| `/kick @user [reason]` | Kick a user | Kick Members |
| `/timeout @user <minutes> [reason]` | Timeout a user | Moderate Members |
| `/warn @user <reason>` | Issue a warning | Moderate Members |
| `/warnings @user` | View user warnings | Moderate Members |
| `/clearwarns @user` | Clear all warnings | Moderate Members |
| `/purge <amount> [@user]` | Delete messages | Manage Messages |
| `/modsettings` | View bot settings | Moderate Members |
| `/help` | Show help | Everyone |

## Deploy to Railway

```bash
railway login
railway init
railway up
```

Set environment variables in Railway dashboard.

## License

MIT © QuantBitRealm
