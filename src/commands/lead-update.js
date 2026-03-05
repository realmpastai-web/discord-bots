const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lead-update')
    .setDescription('Update lead status or information')
    .addIntegerOption(option =>
      option.setName('id')
        .setDescription('Lead ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('status')
        .setDescription('New status')
        .setRequired(false)
        .addChoices(
          { name: 'New', value: 'new' },
          { name: 'Contacted', value: 'contacted' },
          { name: 'Qualified', value: 'qualified' },
          { name: 'Offer Made', value: 'offer_made' },
          { name: 'Under Contract', value: 'under_contract' },
          { name: 'Closed', value: 'closed' },
          { name: 'Dead', value: 'dead' }
        ))
    .addStringOption(option =>
      option.setName('notes')
        .setDescription('Add notes to the lead')
        .setRequired(false)),

  async execute(interaction, { leadService, logger }) {
    try {
      const leadId = interaction.options.getInteger('id');
      const newStatus = interaction.options.getString('status');
      const notes = interaction.options.getString('notes');

      const lead = leadService.getLeadById(leadId);

      if (!lead) {
        return interaction.reply({
          content: `❌ Lead #${leadId} not found.`,
          ephemeral: true
        });
      }

      const oldStatus = lead.status;
      const updates = {};
      
      if (newStatus) updates.status = newStatus;
      if (notes) updates.notes = lead.notes ? `${lead.notes}\n\n[${new Date().toLocaleDateString()}] ${notes}` : notes;

      const updatedLead = leadService.updateLead(leadId, updates);

      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('✏️ Lead Updated')
        .addFields(
          { name: 'Lead ID', value: `#${updatedLead.id}`, inline: true },
          { name: 'Name', value: updatedLead.name, inline: true }
        )
        .setTimestamp();

      if (newStatus) {
        embed.addFields({
          name: 'Status Change',
          value: `${oldStatus} → ${updatedLead.status}`,
          inline: true
        });
      }

      logger.info(`Lead #${leadId} updated by ${interaction.user.tag}`);
      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      logger.error('Error updating lead:', error);
      await interaction.reply({
        content: '❌ Failed to update lead.',
        ephemeral: true
      });
    }
  },
};
