module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    // Ignore bot messages and DMs
    if (message.author.bot || !message.guild) return;

    try {
      // Get auto-mod settings
      const settings = await client.db.getAutomodSettings(message.guild.id);
      
      if (!settings.enabled) return;

      const violations = [];

      // Check for Discord invites
      if (settings.block_invites) {
        const inviteRegex = /(discord\.gg\/|discordapp\.com\/invite\/|discord\.com\/invite\/)/i;
        if (inviteRegex.test(message.content)) {
          violations.push('Discord invite link');
        }
      }

      // Check for links
      if (settings.block_links) {
        const linkRegex = /(https?:\/\/|www\.)[^\s]+/i;
        if (linkRegex.test(message.content) && !message.content.includes('discord.gg')) {
          violations.push('External link');
        }
      }

      // Check for excessive mentions
      if (settings.max_mentions > 0) {
        const mentionCount = message.mentions.users.size + message.mentions.roles.size;
        if (mentionCount > settings.max_mentions) {
          violations.push(`Excessive mentions (${mentionCount}/${settings.max_mentions})`);
        }
      }

      // Check for excessive emojis
      if (settings.max_emojis > 0) {
        const emojiCount = (message.content.match(/<a?:\w+:\d+>/g) || []).length;
        if (emojiCount > settings.max_emojis) {
          violations.push(`Excessive emojis (${emojiCount}/${settings.max_emojis})`);
        }
      }

      // Handle violations
      if (violations.length > 0) {
        await message.delete().catch(() => {});

        // Send warning to user
        const warningMsg = await message.channel.send({
          content: `⚠️ ${message.author}, your message was deleted.\n**Reason:** ${violations.join(', ')}`,
        });

        // Delete warning after 10 seconds
        setTimeout(() => warningMsg.delete().catch(() => {}), 10000);

        // Log to database
        await client.db.logAction({
          guildId: message.guild.id,
          action: 'automod',
          targetId: message.author.id,
          targetTag: message.author.tag,
          moderatorId: client.user.id,
          moderatorTag: client.user.tag,
          reason: `AutoMod: ${violations.join(', ')}`,
          timestamp: new Date().toISOString(),
        });

        // Log to channel if configured
        if (settings.log_channel_id) {
          const logChannel = message.guild.channels.cache.get(settings.log_channel_id);
          if (logChannel) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
              .setColor(0xff6b6b)
              .setTitle('🤖 Auto-Moderation Triggered')
              .addFields(
                { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                { name: 'Channel', value: message.channel.toString(), inline: true },
                { name: 'Violations', value: violations.join('\n') },
                { name: 'Content Preview', value: message.content.slice(0, 500) || '[No content]' }
              )
              .setTimestamp();
            
            logChannel.send({ embeds: [embed] }).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error('AutoMod error:', error);
    }
  },
};
