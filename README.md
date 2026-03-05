# Auto-Moderator Pro

Advanced AI-Powered Auto-Moderation Bot for Discord. Protect your community with intelligent spam detection, raid protection, and comprehensive moderation tools.

## Features

### 🤖 Auto-Moderation
- **Anti-Spam** - Detects and removes spam messages automatically
- **Anti-Link** - Blocks unauthorized links with whitelist support
- **Anti-Invite** - Blocks Discord invite links
- **Profanity Filter** - Filters inappropriate language (3 strictness levels)
- **Caps Filter** - Limits excessive capitalization
- **Zalgo Filter** - Blocks obfuscated/zalgo text
- **Emoji Spam** - Limits excessive emoji usage
- **Mass Mention** - Prevents mention spam

### 🛡️ Raid Protection
- **Join Rate Monitoring** - Detects unusual join patterns
- **Automatic Lockdown** - Activates during detected raids
- **New Account Detection** - Flags suspicious accounts
- **Manual Lockdown** - Emergency server lockdown command

### ⚡ Moderation Commands
- `/warn` - Issue warnings to users
- `/mute` - Temporary mutes with automatic unmute
- `/unmute` - Remove mute from user
- `/kick` - Remove users from server
- `/ban` - Ban users (supports temporary bans)
- `/unban` - Remove bans

### 📊 Statistics & Logging
- **Violation Tracking** - Complete moderation history
- **User Statistics** - Individual user violation counts
- **Server Analytics** - Server-wide moderation stats
- **Mod Log Channel** - All actions logged to configured channel

## Quick Start

### 1. Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name your bot
3. Go to "Bot" tab and click "Add Bot"
4. Enable these intents:
   - PRESENCE INTENT
   - SERVER MEMBERS INTENT
   - MESSAGE CONTENT INTENT
5. Copy your bot token

### 2. Invite Bot to Server
1. Go to "OAuth2" → "URL Generator"
2. Select scopes: `bot`, `applications.commands`
3. Select permissions:
   - Manage Roles
   - Kick Members
   - Ban Members
   - Manage Messages
   - Read Message History
   - Moderate Members
4. Copy and open the generated URL

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env and add your DISCORD_TOKEN and DISCORD_CLIENT_ID
```

### 4. Run the Bot

**With Docker:**
```bash
docker-compose up -d
```

**With Node.js:**
```bash
npm install
npm run deploy  # Deploy slash commands
npm start       # Start the bot
```

## Configuration

### Initial Setup
1. Use `/automod logchannel` to set moderation log channel
2. Use `/automod muterole` to set the mute role
3. Use `/automod toggle` to enable auto-mod
4. Configure filters with `/filters` commands

### Filter Configuration
```
/filters antispam enabled:true sensitivity:3
/filters antilink enabled:true whitelist:github.com,google.com
/filters antiinvite enabled:true
/filters profanity enabled:true strictness:2
/filters caps enabled:true threshold:70
/filters antimention enabled:true limit:5
```

### Raid Protection
```
/raid toggle enabled:true
/raid settings threshold:10 window:60 action:lockdown
```

## Deployment

### Railway (Recommended)
1. Fork this repository
2. Connect to Railway
3. Add environment variables
4. Deploy!

### VPS with PM2
```bash
npm install -g pm2
pm2 start src/index.js --name "auto-moderator"
pm2 save
pm2 startup
```

## Commands Reference

| Command | Description | Permission |
|---------|-------------|------------|
| `/help` | Show help information | Everyone |
| `/automod status` | View auto-mod status | Manage Server |
| `/automod toggle` | Enable/disable auto-mod | Manage Server |
| `/automod logchannel` | Set log channel | Manage Server |
| `/automod muterole` | Set mute role | Manage Server |
| `/filters` | Configure filters | Manage Server |
| `/warn` | Warn a user | Moderate Members |
| `/mute` | Mute a user | Moderate Members |
| `/unmute` | Unmute a user | Moderate Members |
| `/kick` | Kick a user | Kick Members |
| `/ban` | Ban a user | Ban Members |
| `/unban` | Unban a user | Ban Members |
| `/raid` | Raid protection settings | Manage Server |
| `/modstats` | View moderation stats | Moderate Members |

## License

MIT License - See LICENSE file for details

## Support

For support, contact: quantbitrealm@gmail.com

---

Built with ❤️ by QuantBitRealm