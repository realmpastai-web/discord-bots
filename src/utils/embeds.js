const { EmbedBuilder } = require('discord.js');
const config = require('../config');

class EmbedUtil {
  static success(title, description, fields = []) {
    return new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle(`✅ ${title}`)
      .setDescription(description)
      .addFields(fields)
      .setTimestamp();
  }

  static error(title, description, fields = []) {
    return new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle(`❌ ${title}`)
      .setDescription(description)
      .addFields(fields)
      .setTimestamp();
  }

  static warning(title, description, fields = []) {
    return new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(`⚠️ ${title}`)
      .setDescription(description)
      .addFields(fields)
      .setTimestamp();
  }

  static info(title, description, fields = []) {
    return new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle(`ℹ️ ${title}`)
      .setDescription(description)
      .addFields(fields)
      .setTimestamp();
  }

  static modLog(action, moderator, target, reason, duration = null) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`🛡️ Moderation Action: ${action}`)
      .addFields(
        { name: 'Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true },
        { name: 'Target', value: `${target.tag || target.user?.tag} (${target.id})`, inline: true },
        { name: 'Reason', value: reason || 'No reason provided' }
      )
      .setTimestamp();

    if (duration) {
      embed.addFields({ name: 'Duration', value: duration, inline: true });
    }

    return embed;
  }
}

module.exports = EmbedUtil;
