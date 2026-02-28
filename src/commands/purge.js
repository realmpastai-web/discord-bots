const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const EmbedUtil = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages at once')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true))
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');

    // Check if channel is a text channel
    if (interaction.channel.type !== ChannelType.GuildText) {
      return interaction.reply({ 
        embeds: [EmbedUtil.error('Invalid Channel', 'This command can only be used in text channels.')],
        ephemeral: true 
      });
    }

    try {
      let deletedMessages;

      if (targetUser) {
        // Fetch messages and filter by user
        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        const userMessages = messages.filter(msg => msg.author.id === targetUser.id).first(amount);
        
        if (userMessages.length === 0) {
          return interaction.reply({ 
            embeds: [EmbedUtil.error('No Messages Found', `Could not find any recent messages from ${targetUser.tag}.`)],
            ephemeral: true 
          });
        }

        // Delete messages
        deletedMessages = await interaction.channel.bulkDelete(userMessages, true);
      } else {
        // Delete messages without filtering
        deletedMessages = await interaction.channel.bulkDelete(amount, true);
      }

      // Log to database
      await client.db.addModLog('PURGE', targetUser?.id || 'multiple', interaction.guild.id, interaction.user.id, `Deleted ${deletedMessages.size} messages${targetUser ? ` from ${targetUser.tag}` : ''}`);

      // Send success message
      const embed = EmbedUtil.success('Messages Purged', `Successfully deleted ${deletedMessages.size} message(s).`)
        .addFields(
          { name: 'Amount', value: `${deletedMessages.size}`, inline: true },
          { name: 'Channel', value: `${interaction.channel}`, inline: true }
        );

      if (targetUser) {
        embed.addFields({ name: 'Filter', value: `Only messages from ${targetUser.tag}`, inline: true });
      }

      const reply = await interaction.reply({ embeds: [embed], fetchReply: true });

      // Send to mod log channel if configured
      if (client.config.modLogChannelId) {
        const logChannel = interaction.guild.channels.cache.get(client.config.modLogChannelId);
        if (logChannel) {
          await logChannel.send({ 
            embeds: [EmbedUtil.modLog('PURGE', interaction.user, { tag: targetUser?.tag || 'Multiple Users', id: targetUser?.id || 'N/A' }, `Deleted ${deletedMessages.size} messages in ${interaction.channel}`)] 
          });
        }
      }

      // Auto-delete the confirmation after 5 seconds
      setTimeout(() => {
        reply.delete().catch(() => {});
      }, 5000);

    } catch (error) {
      console.error('Purge error:', error);
      
      // Handle specific Discord errors
      if (error.code === 50034) {
        return interaction.reply({ 
          embeds: [EmbedUtil.error('Cannot Delete', 'Some messages are older than 14 days and cannot be bulk deleted.')],
          ephemeral: true 
        });
      }

      await interaction.reply({ 
        embeds: [EmbedUtil.error('Error', 'An error occurred while trying to delete messages.')],
        ephemeral: true 
      });
    }
  }
};
