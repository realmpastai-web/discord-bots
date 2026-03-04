# 🚀 ServerStats Pro - Deployment Package

Complete deployment package for ServerStats Pro Discord Bot.

## 📦 Package Contents

```
server-stats-pro/
├── src/                    # Source code
├── data/                   # Database directory
├── logs/                   # Log files
├── .env.example           # Environment template
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose setup
├── package.json           # Node.js dependencies
├── README.md              # Documentation
├── DEPLOY.md              # This file
└── railway.json           # Railway deployment config
```

## 🎯 Quick Deploy Options

### Option 1: Railway (Recommended - 5 minutes)

1. **Fork/Clone the repository**
   ```bash
   git clone https://github.com/realmpastai-web/discord-bots.git
   cd discord-bots/server-stats-pro
   ```

2. **Create Discord Bot Application**
   - Go to https://discord.com/developers/applications
   - Click "New Application"
   - Name: "ServerStats Pro Demo"
   - Go to "Bot" → "Add Bot"
   - Copy the TOKEN (save it!)
   - Enable Intents:
     - [x] SERVER MEMBERS INTENT
     - [x] MESSAGE CONTENT INTENT
   - Go to OAuth2 → URL Generator
   - Select scopes: `bot`, `applications.commands`
   - Permissions: View Channels, Send Messages, Read Message History, Embed Links
   - Copy the invite URL

3. **Deploy to Railway**
   - Go to https://railway.app
   - Sign up/login with GitHub
   - New Project → Deploy from GitHub repo
   - Select `server-stats-pro`
   - Add environment variables:
     ```
     DISCORD_TOKEN=your_token_here
     CLIENT_ID=your_client_id_here
     NODE_ENV=production
     ```
   - Deploy!

### Option 2: Docker (Self-hosted)

```bash
# 1. Clone repo
git clone https://github.com/realmpastai-web/discord-bots.git
cd discord-bots/server-stats-pro

# 2. Configure
cp .env.example .env
# Edit .env with your Discord token

# 3. Deploy
docker-compose up -d

# 4. Check logs
docker-compose logs -f
```

### Option 3: VPS with PM2

```bash
# 1. Clone and setup
git clone https://github.com/realmpastai-web/discord-bots.git
cd discord-bots/server-stats-pro
npm install

# 2. Configure
cp .env.example .env
nano .env  # Add your token

# 3. Deploy commands (one-time)
npm run deploy-commands

# 4. Start with PM2
npm install -g pm2
pm2 start src/index.js --name "serverstats-pro"
pm2 save
pm2 startup
```

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Bot token from Discord Developer Portal |
| `CLIENT_ID` | Yes | Application ID from Discord Developer Portal |
| `DATABASE_PATH` | No | SQLite database path (default: ./data/analytics.db) |
| `LOG_LEVEL` | No | Logging level: debug, info, warn, error (default: info) |
| `NODE_ENV` | No | Set to 'production' for deployments |

## 📊 Post-Deployment Checklist

- [ ] Bot shows as "Online" in Discord
- [ ] `/ping` command responds
- [ ] `/stats` shows server overview
- [ ] Messages are being tracked
- [ ] Database file is growing
- [ ] Logs show no errors

## 🐛 Troubleshooting

### Bot not responding to commands
1. Check if slash commands were deployed: `npm run deploy-commands`
2. Verify DISCORD_TOKEN is correct
3. Check logs for errors

### Database errors
1. Ensure `data/` directory exists and is writable
2. Check disk space

### Rate limiting
- The bot has built-in rate limiting
- If Discord rate limits: wait 1 hour and restart

## 📈 Monitoring

### Health Check Endpoint
When deployed with Docker/Railway, visit:
```
https://your-app-url/health
```

### Logs
```bash
# Docker
docker-compose logs -f

# PM2
pm2 logs serverstats-pro

# Railway
railway logs
```

## 💰 Monetization Setup

To enable premium features with Instamojo:

1. Add to `.env`:
   ```
   INSTAMOJO_API_KEY=your_key
   INSTAMOJO_API_SECRET=your_secret
   ```

2. Configure webhook URL in Instamojo dashboard:
   ```
   https://your-bot-url/webhooks/instamojo
   ```

## 📞 Support

For deployment help:
- Email: quantbitrealm@gmail.com
- Discord: @quantzen

---

**Built by QuantBitRealm Studios** 🚀
