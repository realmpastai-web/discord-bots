const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;

    // Check for banned words
    const bannedWords = client.config.bannedWords || [];
    const content = message.content.toLowerCase();
    
    for (const word of bannedWords) {
      if (word && content.includes(word.toLowerCase())) {
        try {
          await message.delete();
          const warning = await message.channel.send(`⚠️ ${message.author}, your message contained inappropriate language.`);
          setTimeout(() => warning.delete().catch(() => {}), 5000);
          
          await logAutoMod(client, message.guild, '🚫 Banned Word', message.author, `Message deleted: "${message.content.substring(0, 100)}"`);
          return;
        } catch (err) {
          console.error('Auto-mod delete failed:', err);
        }
      }
    }

    // Spam detection
    const userId = message.author.id;
    const now = Date.now();
    const userData = client.userMessageCounts.get(userId) || { count: 0, timestamp: now };

    if (now - userData.timestamp > client.config.spamWindow) {
      userData.count = 1;
      userData.timestamp = now;
    } else {
      userData.count++;
    }
    client.userMessageCounts.set(userId, userData);

    if (userData.count >= client.config.spamThreshold) {
      try {
        const member = await message.guild.members.fetch(userId);
        if (member.moderatable) {
          await member.timeout(60000, 'Auto-timeout: Spam detection');
          const spamWarning = await message.channel.send(`🚫 ${message.author} has been timed out for spamming.`);
          setTimeout(() => spamWarning.delete().catch(() => {}), 10000);
          
          await logAutoMod(client, message.guild, '🤖 Spam Detection', message.author, 'Auto-timeout: 1 minute');
          client.userMessageCounts.delete(userId);
        }
      } catch (err) {
        console.error('Spam timeout failed:', err);
      }
    }
  }
};

async function logAutoMod(client, guild, action, user, details) {
  if (!client.config.logChannelId) return;
  
  const logChannel = guild.channels.cache.get(client.config.logChannelId);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor('#ff6600')
    .setTitle(action)
    .addFields(
      { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
      { name: 'Details', value: details, inline: false }
    )
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
}
