const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages')
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');

    try {
      await interaction.deferReply({ ephemeral: true });

      const messages = await interaction.channel.messages.fetch({ limit: amount });
      
      let filtered = messages;
      if (user) {
        filtered = messages.filter(msg => msg.author.id === user.id);
      }

      // Filter out messages older than 14 days (Discord limitation)
      const now = Date.now();
      const fourteenDays = 14 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(msg => now - msg.createdTimestamp < fourteenDays);

      const deleted = await interaction.channel.bulkDelete(filtered, true);

      await interaction.editReply({
        content: `✅ Deleted **${deleted.size}** messages.${user ? ` (from ${user.tag})` : ''}`,
      });

      // Log the action
      await interaction.client.db.logAction({
        guildId: interaction.guild.id,
        action: 'purge',
        targetId: user ? user.id : 'multiple',
        targetTag: user ? user.tag : 'multiple users',
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        reason: `Purged ${deleted.size} messages`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Purge error:', error);
      await interaction.editReply({
        content: '❌ Failed to delete messages. Messages older than 14 days cannot be bulk deleted.',
      });
    }
  },
};
