# Deployment Guide - Giveaway Pro Bot

## Option 1: Railway (Recommended)

1. Fork/push this repo to GitHub
2. Sign up at https://railway.app
3. Create New Project → Deploy from GitHub
4. Select this repository
5. Add environment variables:
   - `DISCORD_TOKEN` - Your bot token
   - `DISCORD_CLIENT_ID` - Your application ID
6. Deploy!

## Option 2: Docker

```bash
# Clone the repo
git clone <repo-url>
cd giveaway-pro-bot

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

## Option 3: VPS with PM2

```bash
# Install dependencies
npm install

# Deploy commands (first time only)
npm run deploy

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start src/index.js --name "giveaway-bot"
pm2 save
pm2 startup

# Monitor
pm2 logs giveaway-bot
pm2 monit
```

## Discord Setup

1. Go to https://discord.com/developers/applications
2. Create New Application
3. Go to "Bot" → "Add Bot"
4. Copy token to .env file
5. Enable intents:
   - Server Members
   - Message Content
   - Guild Messages
6. Generate OAuth2 URL with scopes: `bot`, `applications.commands`
7. Permissions needed:
   - Send Messages
   - Embed Links
   - Add Reactions
   - Manage Messages
   - Manage Events

## Troubleshooting

**Bot not responding:**
- Check DISCORD_TOKEN is correct
- Ensure commands are deployed
- Check logs for errors

**Database errors:**
- Ensure `data/` directory is writable
- Check disk space

**Giveaways not ending:**
- Check bot has permission to send messages
- Verify giveaway wasn't manually ended
