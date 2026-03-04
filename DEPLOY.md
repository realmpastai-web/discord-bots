# 🚀 Deployment Guide - Ticket Support Bot

## Quick Deploy to Railway (Recommended)

1. Fork/clone this repo to your GitHub
2. Sign up at [Railway.app](https://railway.app)
3. Create New Project → Deploy from GitHub
4. Select this repository
5. Add environment variables:
   - `DISCORD_TOKEN` - Your bot token
   - `DISCORD_CLIENT_ID` - Your bot's client ID
6. Deploy!

## Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Go to "Bot" section and click "Add Bot"
4. Copy the token (you'll need this)
5. Enable these Privileged Gateway Intents:
   - SERVER MEMBERS INTENT
   - MESSAGE CONTENT INTENT
6. Go to OAuth2 → URL Generator
7. Select scopes: `bot`, `applications.commands`
8. Select permissions:
   - Manage Channels
   - View Channels
   - Send Messages
   - Manage Messages
   - Embed Links
   - Read Message History
   - Mention Everyone
9. Copy the generated URL and invite the bot to your server

## Initial Configuration

1. Use `/ticket-config add` to create categories:
   ```
   /ticket-config add name:Support description:General support questions emoji:🎫
   /ticket-config add name:Sales description:Sales inquiries emoji:💰
   /ticket-config add name:Bug Reports description:Report bugs emoji:🐛
   ```

2. Add support team members:
   ```
   /ticket-team add user:@UserName role:agent
   /ticket-team add user:@ManagerName role:manager
   ```

3. Create a ticket panel:
   ```
   /ticket-setup title:"Support Tickets" description:"Select a category to get help"
   ```

## Docker Deployment

```bash
# Clone the repository
git clone <repo-url>
cd ticket-support-bot

# Create environment file
cp .env.example .env
# Edit .env with your tokens

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

## VPS Deployment with PM2

```bash
# Install PM2
npm install -g pm2

# Clone and setup
git clone <repo-url>
cd ticket-support-bot
npm install

# Create .env file with your tokens

# Start with PM2
pm2 start src/index.js --name "ticket-bot"
pm2 save
pm2 startup

# Monitor
pm2 logs ticket-bot
pm2 monit
```

## Troubleshooting

### Bot not responding to commands
- Check if commands are registered: Run `npm run deploy`
- Verify bot token is correct
- Check bot has proper permissions in Discord

### Database errors
- Ensure `data/` directory exists and is writable
- For Docker: Check volume mount is correct

### Ticket channels not creating
- Bot needs "Manage Channels" permission
- Check category parent channel exists (if set)

## Support

Email: quantbitrealm@gmail.com