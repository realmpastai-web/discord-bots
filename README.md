# Ticket Support Bot - Professional Discord Support System

A complete ticket management system for Discord servers with categories, team assignment, transcripts, and more.

## ✨ Features

- 🎫 **Ticket Categories** - Support, Sales, Report, General
- 👥 **Team Assignment** - Auto or manual ticket assignment
- 📝 **Transcripts** - Full conversation history saved
- 🔒 **Private Channels** - Secure ticket channels
- ⏰ **Response Time Tracking** - Monitor team performance
- 📊 **Analytics** - Ticket volume and resolution stats
- 🔔 **Notifications** - Ping roles when tickets created
- 🏷️ **Priority System** - Low, Medium, High, Critical

## 🚀 Quick Start

1. Copy `.env.example` to `.env` and fill in your bot token
2. Run `npm install`
3. Run `npm run deploy` to register slash commands
4. Run `npm start` to start the bot

## 🛠️ Commands

### Admin Commands
- `/ticket-setup` - Create ticket panel in a channel
- `/ticket-config` - Configure categories and roles
- `/ticket-team` - Manage support team members

### User Commands
- `/ticket` - Create a new ticket
- `/ticket-close` - Close current ticket
- `/ticket-add` - Add user to ticket
- `/ticket-remove` - Remove user from ticket

### Team Commands
- `/claim` - Claim a ticket
- `/transfer` - Transfer to another team member
- `/priority` - Set ticket priority
- `/note` - Add internal note

## 📦 Deployment

See DEPLOY.md for Railway, Docker, and VPS deployment options.

## 💰 Pricing

- **Personal License**: $150 (use on your own servers)
- **Commercial License**: $250 (use for client projects)

## 📞 Support

Email: quantbitrealm@gmail.com