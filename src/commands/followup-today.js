const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('followup-today')
    .setDescription('View all follow-ups scheduled for today'),

  async execute(interaction, { followUpService, leadService, logger }) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const followUps = followUpService.getFollowUpsByDate({
        guildId: interaction.guildId,
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
        completed: false
      });

      if (followUps.length === 0) {
        return interaction.reply({
          content: '📭 No follow-ups scheduled for today!',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`📅 Today's Follow-ups (${followUps.length})`)
        .setDescription(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
        .setTimestamp();

      const typeEmojis = {
        'phone_call': '📞',
        'email': '📧',
        'text': '💬',
        'visit': '🏠',
        'offer': '💰',
        'contract': '📄'
      };

      followUps.forEach(followUp => {
        const lead = leadService.getLeadById(followUp.leadId);
        const emoji = typeEmojis[followUp.type] || '📋';
        
        embed.addFields({
          name: `${emoji} Lead #${followUp.leadId}${lead ? ` - ${lead.name}` : ''}`,
          value: `Type: ${followUp.type.replace('_', ' ')}${followUp.notes ? ` | Notes: ${followUp.notes.substring(0, 50)}...` : ''}`,
          inline: false
        });
      });

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      logger.error('Error getting today\'s follow-ups:', error);
      await interaction.reply({
        content: '❌ Failed to retrieve follow-ups.',
        ephemeral: true
      });
    }
  },
};
