# 📊 ServerStats Pro

A premium Discord server analytics bot that tracks member activity, message statistics, and server growth. Built with discord.js v14 and SQLite.

## ✨ Features

- **📈 Real-time Analytics**
  - Message count tracking per user and channel
  - Member join/leave monitoring
  - Daily activity tracking

- **📊 Comprehensive Commands**
  - `/stats` - View server overview with top channels and users
  - `/activity` - Daily activity charts with visual text graphs
  - `/growth` - Server growth trends over 30 days
  - `/topusers` - Leaderboard of most active members
  - `/export` - Export data as CSV or JSON (Admin only)

- **💾 Data Management**
  - SQLite database with WAL mode
  - Automated daily snapshots
  - CSV/JSON export functionality

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- A Discord Bot Token ([Get one here](https://discord.com/developers/applications))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/realmpastai-web/discord-bots.git
cd discord-bots/server-stats-pro
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your Discord token and client ID
```

4. **Deploy slash commands**
```bash
npm run deploy-commands
```

5. **Start the bot**
```bash
npm start
```

## 🐳 Docker Deployment

```bash
docker-compose up -d
```

## ⚙️ Configuration

Create a `.env` file:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id_here
DATABASE_PATH=./data/analytics.db
LOG_LEVEL=info
```

### Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and enable:
   - **Server Members Intent**
   - **Message Content Intent**
4. Generate OAuth2 URL with scopes: `bot`, `applications.commands`
5. Add permissions: View Channels, Send Messages, Read Message History

## 📖 Commands

| Command | Description | Permissions |
|---------|-------------|-------------|
| `/stats` | Server overview | Everyone |
| `/activity` [days] | Activity charts | Everyone |
| `/growth` | Growth trends | Everyone |
| `/topusers` [limit] | Leaderboard | Everyone |
| `/export` <format> | Export data | Administrator |
| `/help` | Help information | Everyone |

## 📄 License

MIT License

---

<p align="center">Built with ❤️ by QuantBitRealm</p>
