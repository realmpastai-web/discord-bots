const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedUtil = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modlogs')
    .setDescription('View moderation history for a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check moderation history for')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Number of logs to show (1-25)')
        .setMinValue(1)
        .setMaxValue(25)
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const target = interaction.options.getUser('user');
    const limit = interaction.options.getInteger('limit') || 10;

    try {
      const logs = await client.db.getModLogs(target.id, interaction.guild.id, limit);
      
      if (logs.length === 0) {
        return interaction.reply({ 
          embeds: [EmbedUtil.info('No History', `${target.tag} has no moderation history on record.`)]
        });
      }

      const embed = EmbedUtil.info('Moderation History', `History for ${target.tag}`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true }));

      // Format each log entry
      const logEntries = logs.map(log => {
        const timestamp = `<t:${Math.floor(new Date(log.created_at).getTime() / 1000)}:R>`;
        const duration = log.duration ? ` • Duration: ${log.duration}` : '';
        return `**${log.action}** • ${timestamp}${duration}\nBy: <@${log.moderator_id}>\nReason: ${log.reason}`;
      }).join('\n\n');

      embed.setDescription(logEntries);
      embed.setFooter({ text: `Showing ${logs.length} most recent action(s)` });

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Modlogs error:', error);
      await interaction.reply({ 
        embeds: [EmbedUtil.error('Error', 'An error occurred while fetching moderation history.')],
        ephemeral: true 
      });
    }
  }
};
