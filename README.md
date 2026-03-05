# 🏠 Real Estate Lead Management Bot

A complete lead management system for real estate wholesalers built for Discord. Track leads, schedule follow-ups, and manage your sales pipeline - all within your Discord server.

## ✨ Features

### Lead Management
- 📝 **Add Leads** - Capture lead information with name, phone, email, address
- 📋 **Lead Pipeline** - Track leads through your sales funnel
- 🔍 **View Details** - See complete lead history and notes
- ✏️ **Update Status** - Move leads through stages (New → Contacted → Qualified → Offer → Contract → Closed)

### Follow-up System
- ⏰ **Schedule Follow-ups** - Never miss a follow-up with scheduled reminders
- 📅 **Daily View** - See all follow-ups scheduled for today
- 📞 **Multiple Types** - Phone, email, text, property visits, offers, contracts

### Analytics & Reporting
- 📊 **Pipeline Dashboard** - Visual overview of your sales funnel
- 📈 **Conversion Tracking** - See your win rates and deal flow
- 📣 **Source Tracking** - Know which marketing channels work best

### Lead Status Workflow
| Status | Emoji | Description |
|--------|-------|-------------|
| New | 🆕 | Just added, no contact yet |
| Contacted | 📞 | Initial contact made |
| Qualified | ✅ | Motivated seller confirmed |
| Offer Made | 💰 | Offer submitted |
| Under Contract | 📄 | Deal in progress |
| Closed | 🎉 | Deal completed! |
| Dead | ❌ | Lead no longer viable |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Discord Bot Token ([Get one here](https://discord.com/developers/applications))

### Installation

1. **Clone or download this repository**
```bash
git clone https://github.com/realmpastai-web/discord-bots.git
cd realestate-lead-bot
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
npm run deploy
```

5. **Start the bot**
```bash
npm start
```

## 🐳 Docker Deployment

```bash
docker-compose up -d
```

## 🚄 Railway Deployment

1. Connect your GitHub repo to Railway
2. Add environment variables
3. Deploy!

## 📋 Commands

| Command | Description |
|---------|-------------|
| `/lead-add` | Add a new lead |
| `/lead-list [status]` | View leads, optionally filtered by status |
| `/lead-view <id>` | View detailed lead information |
| `/lead-update <id>` | Update lead status or add notes |
| `/followup-schedule` | Schedule a follow-up for a lead |
| `/followup-today` | View today's scheduled follow-ups |
| `/pipeline` | View sales pipeline dashboard |
| `/help` | Show all commands |

## 💰 Pricing

**Single License:** $200
- Use on one Discord server
- Lifetime updates
- Community support

**Commercial License:** $350
- Use on unlimited servers
- White-label rights
- Priority support
- Source code included

## 🏆 Perfect For

- Real Estate Wholesalers
- Property Investors
- Real Estate Agents
- Virtual Wholesaling Businesses
- House Flippers

## 🛠️ Tech Stack

- **Discord.js v14** - Modern Discord API
- **Better-SQLite3** - Fast local database
- **Node.js 18+** - Runtime
- **Docker** - Containerization

## 📞 Support

- Discord: @quantbitrealm
- Email: quantbitrealm@gmail.com

---

Built with ❤️ by [QuantBitRealm](https://github.com/realmpastai-web)
