const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('followup-schedule')
    .setDescription('Schedule a follow-up for a lead')
    .addIntegerOption(option =>
      option.setName('lead_id')
        .setDescription('Lead ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('date')
        .setDescription('Follow-up date (YYYY-MM-DD)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of follow-up')
        .setRequired(true)
        .addChoices(
          { name: 'Phone Call', value: 'phone_call' },
          { name: 'Email', value: 'email' },
          { name: 'Text Message', value: 'text' },
          { name: 'Property Visit', value: 'visit' },
          { name: 'Send Offer', value: 'offer' },
          { name: 'Contract Follow-up', value: 'contract' }
        ))
    .addStringOption(option =>
      option.setName('notes')
        .setDescription('Notes about the follow-up')
        .setRequired(false)),

  async execute(interaction, { leadService, followUpService, logger }) {
    try {
      const leadId = interaction.options.getInteger('lead_id');
      const dateStr = interaction.options.getString('date');
      const type = interaction.options.getString('type');
      const notes = interaction.options.getString('notes');

      const lead = leadService.getLeadById(leadId);
      if (!lead) {
        return interaction.reply({
          content: `❌ Lead #${leadId} not found.`,
          ephemeral: true
        });
      }

      const scheduledAt = new Date(dateStr);
      if (isNaN(scheduledAt.getTime())) {
        return interaction.reply({
          content: '❌ Invalid date format. Use YYYY-MM-DD (e.g., 2026-03-15)',
          ephemeral: true
        });
      }

      const followUp = followUpService.createFollowUp({
        leadId,
        type,
        scheduledAt: scheduledAt.toISOString(),
        notes,
        createdBy: interaction.user.id
      });

      const typeLabels = {
        'phone_call': '📞 Phone Call',
        'email': '📧 Email',
        'text': '💬 Text Message',
        'visit': '🏠 Property Visit',
        'offer': '💰 Send Offer',
        'contract': '📄 Contract Follow-up'
      };

      const embed = new EmbedBuilder()
        .setColor('#00CED1')
        .setTitle('⏰ Follow-up Scheduled')
        .addFields(
          { name: 'Lead', value: `#${leadId} - ${lead.name}`, inline: true },
          { name: 'Type', value: typeLabels[type], inline: true },
          { name: 'Date', value: scheduledAt.toLocaleDateString(), inline: true }
        )
        .setTimestamp();

      if (notes) embed.addFields({ name: '📝 Notes', value: notes });

      logger.info(`Follow-up scheduled for lead #${leadId} by ${interaction.user.tag}`);
      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      logger.error('Error scheduling follow-up:', error);
      await interaction.reply({
        content: '❌ Failed to schedule follow-up.',
        ephemeral: true
      });
    }
  },
};
