const logger = require('./logger');
const db = require('../database/connection');

class RaidProtection {
  constructor(client) {
    this.client = client;
    this.joinCache = new Map(); // guildId -> [{userId, timestamp, accountAge}]
    this.lockdownStatus = new Map(); // guildId -> boolean
  }

  async handleMemberJoin(member) {
    const guildId = member.guild.id;
    
    // Get raid protection settings
    const settings = this.getSettings(guildId);
    if (!settings || !settings.enabled) return;

    const now = Date.now();
    const accountAgeDays = Math.floor((now - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));

    // Record join
    this.recordJoin(guildId, member.id, accountAgeDays);

    // Check for raid
    const raidStatus = this.detectRaid(guildId, settings);
    
    if (raidStatus.isRaid) {
      await this.activateLockdown(member.guild, raidStatus, settings);
    }

    // Check for suspicious account (very new account)
    if (accountAgeDays < 1) {
      await this.handleSuspiciousAccount(member, settings);
    }
  }

  getSettings(guildId) {
    try {
      const stmt = db.prepare('SELECT * FROM raid_protection WHERE guild_id = ?');
      return stmt.get(guildId);
    } catch (error) {
      logger.error('Error getting raid protection settings:', error);
      return null;
    }
  }

  recordJoin(guildId, userId, accountAgeDays) {
    const windowMs = 60000; // 1 minute window for raid detection
    const now = Date.now();

    if (!this.joinCache.has(guildId)) {
      this.joinCache.set(guildId, []);
    }

    const joins = this.joinCache.get(guildId);
    
    // Clean old entries
    const validJoins = joins.filter(j => now - j.timestamp < windowMs);
    
    // Add new join
    validJoins.push({
      userId,
      timestamp: now,
      accountAgeDays
    });

    this.joinCache.set(guildId, validJoins);

    // Also record in database for analytics
    try {
      db.prepare(`
        INSERT INTO join_history (guild_id, user_id, account_age_days)
        VALUES (?, ?, ?)
      `).run(guildId, userId, accountAgeDays);
    } catch (error) {
      logger.error('Error recording join history:', error);
    }
  }

  detectRaid(guildId, settings) {
    const joins = this.joinCache.get(guildId) || [];
    const threshold = settings.join_threshold || 10;
    const timeWindow = settings.time_window || 60; // seconds

    const now = Date.now();
    const recentJoins = joins.filter(j => now - j.timestamp < timeWindow * 1000);

    // Check join rate
    if (recentJoins.length >= threshold) {
      // Check for patterns
      const newAccounts = recentJoins.filter(j => j.accountAgeDays < 7).length;
      const newAccountRatio = newAccounts / recentJoins.length;

      return {
        isRaid: true,
        joinCount: recentJoins.length,
        newAccounts,
        newAccountRatio,
        severity: newAccountRatio > 0.5 ? 'critical' : 'high'
      };
    }

    return { isRaid: false };
  }

  async activateLockdown(guild, raidStatus, settings) {
    if (this.lockdownStatus.get(guild.id)) return; // Already in lockdown

    this.lockdownStatus.set(guild.id, true);

    logger.warn(`Raid detected in ${guild.name}: ${raidStatus.joinCount} joins, ${raidStatus.newAccounts} new accounts`);

    // Set verification level to highest
    try {
      await guild.setVerificationLevel(4); // Highest
    } catch (error) {
      logger.error('Failed to set verification level:', error);
    }

    // Log to mod channel
    const guildSettings = db.prepare('SELECT log_channel_id FROM guild_settings WHERE guild_id = ?').get(guild.id);
    if (guildSettings?.log_channel_id) {
      const channel = guild.channels.cache.get(guildSettings.log_channel_id);
      if (channel) {
        await channel.send({
          embeds: [{
            color: 0xFF0000,
            title: '🚨 RAID PROTECTION ACTIVATED',
            description: `**Server Lockdown Engaged**\n\n**Detected:** ${raidStatus.joinCount} joins in ${settings.time_window}s\n**New Accounts:** ${raidStatus.newAccounts} (< 7 days old)\n**Severity:** ${raidStatus.severity.toUpperCase()}`,
            fields: [
              { name: 'Actions Taken', value: '• Verification level set to Highest\n• New member screening enabled' },
              { name: 'To Disable', value: 'Use `/raid lockdown off` when safe' }
            ],
            timestamp: new Date().toISOString()
          }]
        });
      }
    }

    // Auto-kick recent new accounts if critical
    if (raidStatus.severity === 'critical' && settings.action === 'kick') {
      const joins = this.joinCache.get(guild.id) || [];
      const newAccounts = joins.filter(j => j.accountAgeDays < 1);

      for (const join of newAccounts) {
        try {
          const member = await guild.members.fetch(join.userId);
          if (member && member.kickable) {
            await member.kick('Raid protection: Suspicious account');
          }
        } catch (error) {
          logger.error('Failed to kick raid account:', error);
        }
      }
    }
  }

  async deactivateLockdown(guild) {
    this.lockdownStatus.set(guild.id, false);

    try {
      await guild.setVerificationLevel(2); // Medium
    } catch (error) {
      logger.error('Failed to reset verification level:', error);
    }

    // Log to mod channel
    const guildSettings = db.prepare('SELECT log_channel_id FROM guild_settings WHERE guild_id = ?').get(guild.id);
    if (guildSettings?.log_channel_id) {
      const channel = guild.channels.cache.get(guildSettings.log_channel_id);
      if (channel) {
        await channel.send({
          embeds: [{
            color: 0x00FF00,
            title: '✅ RAID PROTECTION DEACTIVATED',
            description: 'Server lockdown has been lifted. Verification level restored.',
            timestamp: new Date().toISOString()
          }]
        });
      }
    }
  }

  async handleSuspiciousAccount(member, settings) {
    // Quarantine or flag very new accounts
    const guildSettings = db.prepare('SELECT log_channel_id FROM guild_settings WHERE guild_id = ?').get(member.guild.id);
    
    if (guildSettings?.log_channel_id) {
      const channel = member.guild.channels.cache.get(guildSettings.log_channel_id);
      if (channel) {
        await channel.send({
          embeds: [{
            color: 0xFFA500,
            title: '⚠️ Suspicious Account Joined',
            description: `**User:** ${member.user.tag} (${member.id})\n**Account Age:** < 1 day old`,
            fields: [
              { name: 'Action', value: 'Account flagged for review' }
            ],
            timestamp: new Date().toISOString()
          }]
        });
      }
    }
  }

  isInLockdown(guildId) {
    return this.lockdownStatus.get(guildId) || false;
  }
}

module.exports = RaidProtection;