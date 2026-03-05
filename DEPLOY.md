# Deployment Guide - Real Estate Lead Bot

## Option 1: Railway (Easiest - 5 minutes)

1. **Fork/Clone the repository to GitHub**

2. **Sign up at [Railway.app](https://railway.app)**
   - Connect your GitHub account

3. **Create new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

4. **Add environment variables**
   - Go to Variables tab
   - Add `DISCORD_TOKEN` = your bot token
   - Add `DISCORD_CLIENT_ID` = your application ID

5. **Deploy**
   - Railway will auto-deploy
   - Bot comes online automatically

## Option 2: Docker (Self-hosted)

1. **Install Docker** on your VPS/server

2. **Clone the repository**
```bash
git clone https://github.com/realmpastai-web/discord-bots.git
cd realestate-lead-bot
```

3. **Create .env file**
```bash
cp .env.example .env
nano .env  # Add your tokens
```

4. **Run with Docker Compose**
```bash
docker-compose up -d
```

5. **View logs**
```bash
docker-compose logs -f
```

## Option 3: VPS with PM2

1. **SSH into your VPS**
```bash
ssh user@your-server
```

2. **Install Node.js 18+**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Clone and install**
```bash
git clone https://github.com/realmpastai-web/discord-bots.git
cd realestate-lead-bot
npm install
```

4. **Configure**
```bash
cp .env.example .env
nano .env  # Add your tokens
```

5. **Install PM2**
```bash
npm install -g pm2
```

6. **Start bot**
```bash
pm2 start src/index.js --name "realestate-bot"
pm2 save
pm2 startup
```

7. **Monitor**
```bash
pm2 logs realestate-bot
pm2 monit
```

## Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "Real Estate Lead Bot"
4. Go to "Bot" → "Add Bot"
5. Copy the token (save to .env)
6. Enable intents: SERVER MEMBERS, MESSAGE CONTENT
7. Go to OAuth2 → URL Generator
8. Select scopes: `bot`, `applications.commands`
9. Select permissions:
   - Send Messages
   - Read Messages/View Channels
   - Embed Links
   - Attach Files
   - Read Message History
   - Add Reactions
   - Use Slash Commands
10. Copy the URL and invite to your server

## Post-Deployment

1. **Deploy commands**
```bash
npm run deploy
```

2. **Test the bot**
- Type `/help` in your Discord server
- Try `/lead-add` to add a test lead
- Check `/pipeline` to see the dashboard

3. **Backup data**
- Data is stored in `data/leads.db`
- Back up this file regularly

## Troubleshooting

**Bot doesn't come online**
- Check DISCORD_TOKEN is correct
- Check logs: `docker-compose logs` or `pm2 logs`

**Commands don't appear**
- Run `npm run deploy` to register commands
- May take up to 1 hour for global commands

**Database errors**
- Ensure `data/` directory exists and is writable
- Check disk space

## Support

Need help? Contact:
- Discord: @quantbitrealm
- Email: quantbitrealm@gmail.com
