const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lead-view')
    .setDescription('View detailed information about a lead')
    .addIntegerOption(option =>
      option.setName('id')
        .setDescription('Lead ID')
        .setRequired(true)),

  async execute(interaction, { leadService, logger }) {
    try {
      const leadId = interaction.options.getInteger('id');
      const lead = leadService.getLeadById(leadId);

      if (!lead) {
        return interaction.reply({
          content: `❌ Lead #${leadId} not found.`,
          ephemeral: true
        });
      }

      const statusEmoji = {
        'new': '🆕',
        'contacted': '📞',
        'qualified': '✅',
        'offer_made': '💰',
        'under_contract': '📄',
        'closed': '🎉',
        'dead': '❌'
      }[lead.status] || '⚪';

      const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle(`${statusEmoji} Lead #${lead.id}: ${lead.name}`)
        .addFields(
          { name: '📱 Phone', value: lead.phone, inline: true },
          { name: '📧 Email', value: lead.email || 'N/A', inline: true },
          { name: '🏷️ Status', value: lead.status, inline: true },
          { name: '📍 Address', value: lead.address || 'N/A' },
          { name: '📊 Source', value: lead.source, inline: true },
          { name: '👤 Created By', value: `<@${lead.createdBy}>`, inline: true },
          { name: '📅 Created', value: new Date(lead.createdAt).toLocaleDateString(), inline: true }
        )
        .setTimestamp();

      if (lead.notes) {
        embed.addFields({ name: '📝 Notes', value: lead.notes.substring(0, 1024) });
      }

      // Add follow-up info
      const followUps = leadService.getFollowUps(leadId);
      if (followUps.length > 0) {
        const nextFollowUp = followUps.find(f => !f.completed);
        if (nextFollowUp) {
          embed.addFields({
            name: '⏰ Next Follow-up',
            value: `${new Date(nextFollowUp.scheduledAt).toLocaleDateString()} - ${nextFollowUp.type}`
          });
        }
      }

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      logger.error('Error viewing lead:', error);
      await interaction.reply({
        content: '❌ Failed to retrieve lead details.',
        ephemeral: true
      });
    }
  },
};
