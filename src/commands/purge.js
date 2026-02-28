const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');

    try {
      const messages = await interaction.channel.messages.fetch({ limit: amount });
      
      let deletedMessages = messages;
      if (targetUser) {
        deletedMessages = messages.filter(msg => msg.author.id === targetUser.id);
      }

      await interaction.channel.bulkDelete(deletedMessages, true);
      
      const count = targetUser 
        ? deletedMessages.size 
        : amount;

      await interaction.reply({ 
        content: `🗑️ Deleted ${count} message(s)${targetUser ? ` from ${targetUser.tag}` : ''}.`, 
        ephemeral: true 
      });

      await logAction(client, interaction.guild, interaction.channel, '🗑️ Purge', interaction.user, `${count} messages deleted${targetUser ? ` (by ${targetUser.tag})` : ''}`);
    } catch (error) {
      console.error('Purge error:', error);
      await interaction.reply({ content: '❌ Failed to delete messages. Messages older than 14 days cannot be bulk deleted.', ephemeral: true });
    }
  }
};

async function logAction(client, guild, channel, action, moderator, details) {
  if (!client.config.logChannelId) return;
  
  const logChannel = guild.channels.cache.get(client.config.logChannelId);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor('#ff5555')
    .setTitle(action)
    .addFields(
      { name: 'Channel', value: `${channel}`, inline: true },
      { name: 'Moderator', value: `${moderator.tag}`, inline: true },
      { name: 'Details', value: details, inline: false }
    )
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
}
