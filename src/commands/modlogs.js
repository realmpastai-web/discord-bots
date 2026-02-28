const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modlogs')
    .setDescription('View recent moderation actions')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Filter by specific user')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('limit')
        .setDescription('Number of entries (1-25)')
        .setMinValue(1)
        .setMaxValue(25)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const limit = interaction.options.getInteger('limit') || 10;

    try {
      const logs = await interaction.client.db.getModLogs(interaction.guild.id, user?.id, limit);

      if (logs.length === 0) {
        return interaction.reply({
          content: user 
            ? `✅ No moderation actions found for **${user.tag}**.`
            : '✅ No moderation actions found in this server.',
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📋 Moderation Logs')
        .setDescription(user ? `Actions for ${user.tag}:` : 'Recent server moderation actions:')
        .setTimestamp();

      logs.forEach((log, index) => {
        const emoji = {
          ban: '🔨',
          kick: '👢',
          warn: '⚠️',
          timeout: '🔇',
          unban: '🔓',
          purge: '🧹',
          clearwarn: '✅',
        }[log.action] || '📝';

        embed.addFields({
          name: `${emoji} ${log.action.toUpperCase()} — ${new Date(log.timestamp).toLocaleString()}`,
          value: `**Target:** ${log.targetTag} (${log.targetId})\n**By:** ${log.moderatorTag}\n**Reason:** ${log.reason || 'N/A'}`,
        });
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Modlogs error:', error);
      await interaction.reply({
        content: '❌ Failed to fetch moderation logs.',
        ephemeral: true,
      });
    }
  },
};
