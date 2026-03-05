const logger = require('./logger');
const db = require('../database/connection');

class AutoModEngine {
  constructor(client) {
    this.client = client;
    this.spamCache = new Map(); // In-memory cache for fast spam detection
    this.profanityList = this.loadProfanityList();
    this.linkRegex = /(https?:\/\/|www\.)[^\s]+/gi;
    this.inviteRegex = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9]+/gi;
    this.mentionRegex = /<@!?\d+>/g;
    this.emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    this.zalgoRegex = /[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u0a01-\u0a03\u0a3c]/g;
  }

  loadProfanityList() {
    // Basic profanity list - can be expanded
    return [
      'badword1', 'badword2', 'badword3', // Placeholder - real implementation would have full list
    ];
  }

  async processMessage(message) {
    if (message.author.bot) return { flagged: false };
    if (!message.guild) return { flagged: false };

    const guildId = message.guild.id;
    const userId = message.author.id;

    // Get guild filter settings
    const settings = this.getFilterSettings(guildId);
    if (!settings || !settings.anti_spam_enabled) return { flagged: false };

    const violations = [];

    // Check each filter
    if (settings.anti_spam_enabled) {
      const spamResult = this.checkSpam(message, settings);
      if (spamResult.flagged) violations.push(spamResult);
    }

    if (settings.anti_link_enabled) {
      const linkResult = this.checkLinks(message, settings);
      if (linkResult.flagged) violations.push(linkResult);
    }

    if (settings.anti_invite_enabled) {
      const inviteResult = this.checkInvites(message);
      if (inviteResult.flagged) violations.push(inviteResult);
    }

    if (settings.anti_mention_enabled) {
      const mentionResult = this.checkMentions(message, settings);
      if (mentionResult.flagged) violations.push(mentionResult);
    }

    if (settings.profanity_filter_enabled) {
      const profanityResult = this.checkProfanity(message, settings);
      if (profanityResult.flagged) violations.push(profanityResult);
    }

    if (settings.caps_filter_enabled) {
      const capsResult = this.checkCaps(message, settings);
      if (capsResult.flagged) violations.push(capsResult);
    }

    if (settings.zalgo_filter_enabled) {
      const zalgoResult = this.checkZalgo(message);
      if (zalgoResult.flagged) violations.push(zalgoResult);
    }

    if (settings.emoji_spam_enabled) {
      const emojiResult = this.checkEmojiSpam(message, settings);
      if (emojiResult.flagged) violations.push(emojiResult);
    }

    // Take action if violations found
    if (violations.length > 0) {
      await this.takeAction(message, violations);
      return { flagged: true, violations };
    }

    return { flagged: false };
  }

  getFilterSettings(guildId) {
    try {
      const stmt = db.prepare('SELECT * FROM filter_settings WHERE guild_id = ?');
      return stmt.get(guildId);
    } catch (error) {
      logger.error('Error getting filter settings:', error);
      return null;
    }
  }

  checkSpam(message, settings) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    const now = Date.now();
    const windowMs = 10000; // 10 second window

    // Get or create user cache
    if (!this.spamCache.has(userId)) {
      this.spamCache.set(userId, []);
    }

    const userMessages = this.spamCache.get(userId);
    
    // Clean old messages
    const validMessages = userMessages.filter(m => now - m.timestamp < windowMs);
    
    // Add current message
    validMessages.push({
      timestamp: now,
      content: message.content,
      channelId: message.channel.id
    });

    this.spamCache.set(userId, validMessages);

    // Check if spamming
    const sensitivity = settings.anti_spam_sensitivity || 3;
    if (validMessages.length >= sensitivity) {
      // Check for repeated content
      const contentCounts = {};
      validMessages.forEach(m => {
        contentCounts[m.content] = (contentCounts[m.content] || 0) + 1;
      });

      const maxRepeat = Math.max(...Object.values(contentCounts));
      
      if (maxRepeat >= 2 || validMessages.length >= sensitivity + 2) {
        return {
          flagged: true,
          type: 'spam',
          reason: `Sent ${validMessages.length} messages in 10 seconds`,
          severity: validMessages.length >= sensitivity + 3 ? 'high' : 'medium'
        };
      }
    }

    return { flagged: false };
  }

  checkLinks(message, settings) {
    const links = message.content.match(this.linkRegex);
    if (!links) return { flagged: false };

    // Check whitelist
    if (settings.anti_link_whitelist) {
      const whitelist = settings.anti_link_whitelist.split(',');
      const hasWhitelistedLink = links.some(link => 
        whitelist.some(allowed => link.includes(allowed.trim()))
      );
      if (hasWhitelistedLink) return { flagged: false };
    }

    return {
      flagged: true,
      type: 'link',
      reason: `Posted unauthorized link(s): ${links.join(', ').substring(0, 100)}`,
      severity: 'medium'
    };
  }

  checkInvites(message) {
    const invites = message.content.match(this.inviteRegex);
    if (!invites) return { flagged: false };

    return {
      flagged: true,
      type: 'invite',
      reason: `Posted Discord invite: ${invites[0]}`,
      severity: 'medium'
    };
  }

  checkMentions(message, settings) {
    const mentions = message.content.match(this.mentionRegex);
    const limit = settings.anti_mention_limit || 5;

    if (mentions && mentions.length > limit) {
      return {
        flagged: true,
        type: 'mass_mention',
        reason: `Mentioned ${mentions.length} users (limit: ${limit})`,
        severity: mentions.length > limit * 2 ? 'high' : 'medium'
      };
    }

    return { flagged: false };
  }

  checkProfanity(message, settings) {
    const content = message.content.toLowerCase();
    const strictness = settings.profanity_filter_strictness || 2;

    // Simple profanity check - can be enhanced with AI
    const foundWords = this.profanityList.filter(word => content.includes(word));

    if (foundWords.length > 0) {
      return {
        flagged: true,
        type: 'profanity',
        reason: `Used inappropriate language`,
        severity: strictness >= 3 ? 'high' : 'medium'
      };
    }

    return { flagged: false };
  }

  checkCaps(message, settings) {
    const content = message.content.replace(/[^a-zA-Z]/g, '');
    if (content.length < 10) return { flagged: false };

    const capsCount = content.replace(/[^A-Z]/g, '').length;
    const capsPercentage = (capsCount / content.length) * 100;
    const threshold = settings.caps_filter_threshold || 70;

    if (capsPercentage > threshold) {
      return {
        flagged: true,
        type: 'excessive_caps',
        reason: `${Math.round(capsPercentage)}% capital letters (threshold: ${threshold}%)`,
        severity: 'low'
      };
    }

    return { flagged: false };
  }

  checkZalgo(message) {
    const zalgoMatches = message.content.match(this.zalgoRegex);
    if (zalgoMatches && zalgoMatches.length > 5) {
      return {
        flagged: true,
        type: 'zalgo_text',
        reason: 'Used zalgo/obfuscated text',
        severity: 'low'
      };
    }

    return { flagged: false };
  }

  checkEmojiSpam(message, settings) {
    const emojis = message.content.match(this.emojiRegex) || [];
    const customEmojis = message.content.match(/<a?:\w+:\d+>/g) || [];
    const totalEmojis = emojis.length + customEmojis.length;
    const limit = settings.emoji_spam_limit || 10;

    if (totalEmojis > limit) {
      return {
        flagged: true,
        type: 'emoji_spam',
        reason: `Used ${totalEmojis} emojis (limit: ${limit})`,
        severity: 'low'
      };
    }

    return { flagged: false };
  }

  async takeAction(message, violations) {
    const guildId = message.guild.id;
    const userId = message.author.id;

    // Delete the message
    try {
      await message.delete();
    } catch (error) {
      logger.error('Failed to delete message:', error);
    }

    // Calculate total points
    const severityPoints = { low: 1, medium: 2, high: 3 };
    const totalPoints = violations.reduce((sum, v) => sum + severityPoints[v.severity], 0);

    // Log violation
    this.logViolation(guildId, userId, violations, totalPoints, message.content);

    // Get user total violations
    const userViolations = this.getUserViolationCount(guildId, userId);
    const guildSettings = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);

    if (!guildSettings) return;

    // Determine action
    let action = 'warn';
    if (userViolations >= (guildSettings.ban_threshold || 5)) {
      action = 'ban';
    } else if (userViolations >= (guildSettings.warn_threshold || 3)) {
      action = 'mute';
    }

    // Execute action
    const member = message.member;
    if (!member) return;

    switch (action) {
      case 'ban':
        await this.banUser(member, violations, guildSettings);
        break;
      case 'mute':
        await this.muteUser(member, violations, guildSettings);
        break;
      default:
        await this.warnUser(member, violations);
    }

    // Log to mod log channel
    this.logToModChannel(message.guild, message.author, violations, action);
  }

  logViolation(guildId, userId, violations, points, content) {
    try {
      const stmt = db.prepare(`
        INSERT INTO violations (guild_id, user_id, type, reason, message_content, action_taken, points)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      violations.forEach(v => {
        stmt.run(guildId, userId, v.type, v.reason, content.substring(0, 500), 'auto', points);
      });
    } catch (error) {
      logger.error('Error logging violation:', error);
    }
  }

  getUserViolationCount(guildId, userId, hours = 24) {
    try {
      const stmt = db.prepare(`
        SELECT SUM(points) as total FROM violations 
        WHERE guild_id = ? AND user_id = ? 
        AND created_at > datetime('now', '-${hours} hours')
      `);
      const result = stmt.get(guildId, userId);
      return result?.total || 0;
    } catch (error) {
      logger.error('Error getting violation count:', error);
      return 0;
    }
  }

  async warnUser(member, violations) {
    try {
      await member.send({
        embeds: [{
          color: 0xFFA500,
          title: '⚠️ Warning',
          description: `Your message in **${member.guild.name}** was removed for violating server rules.`,
          fields: violations.map(v => ({
            name: v.type.replace('_', ' ').toUpperCase(),
            value: v.reason
          })),
          footer: { text: 'Repeated violations may result in mutes or bans.' }
        }]
      });
    } catch (error) {
      logger.error('Failed to DM user:', error);
    }
  }

  async muteUser(member, violations, settings) {
    try {
      const muteRole = member.guild.roles.cache.get(settings.mute_role_id);
      if (!muteRole) {
        logger.error('Mute role not found');
        return;
      }

      await member.roles.add(muteRole);

      // Schedule unmute
      const duration = settings.mute_duration || 3600;
      const expiresAt = new Date(Date.now() + duration * 1000);

      db.prepare(`
        INSERT INTO mutes (guild_id, user_id, moderator_id, reason, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(member.guild.id, member.id, this.client.user.id, 'Auto-mod violation', expiresAt.toISOString());

      await member.send({
        embeds: [{
          color: 0xFF0000,
          title: '🔇 Muted',
          description: `You have been muted in **${member.guild.name}** for ${Math.floor(duration / 60)} minutes.`,
          fields: [
            { name: 'Reason', value: 'Multiple rule violations detected by auto-moderation' },
            { name: 'Expires', value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>` }
          ]
        }]
      });
    } catch (error) {
      logger.error('Failed to mute user:', error);
    }
  }

  async banUser(member, violations, settings) {
    try {
      await member.ban({ reason: 'Auto-mod: Excessive violations', deleteMessageDays: 1 });

      db.prepare(`
        INSERT INTO bans (guild_id, user_id, moderator_id, reason)
        VALUES (?, ?, ?, ?)
      `).run(member.guild.id, member.id, this.client.user.id, 'Auto-mod: Excessive violations');
    } catch (error) {
      logger.error('Failed to ban user:', error);
    }
  }

  async logToModChannel(guild, user, violations, action) {
    const settings = db.prepare('SELECT log_channel_id FROM guild_settings WHERE guild_id = ?').get(guild.id);
    if (!settings?.log_channel_id) return;

    const channel = guild.channels.cache.get(settings.log_channel_id);
    if (!channel) return;

    const colors = { warn: 0xFFA500, mute: 0xFF0000, ban: 0x8B0000 };

    try {
      await channel.send({
        embeds: [{
          color: colors[action] || 0x808080,
          title: `🤖 Auto-Moderation: ${action.toUpperCase()}`,
          description: `**User:** ${user.tag} (${user.id})\n**Action:** ${action}`,
          fields: violations.map(v => ({
            name: `${v.severity.toUpperCase()}: ${v.type.replace('_', ' ')}`,
            value: v.reason
          })),
          timestamp: new Date().toISOString()
        }]
      });
    } catch (error) {
      logger.error('Failed to log to mod channel:', error);
    }
  }
}

module.exports = AutoModEngine;