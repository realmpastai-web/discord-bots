const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lead-list')
    .setDescription('View all leads or filter by status')
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Filter by status')
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
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Number of leads to show (max 25)')
        .setRequired(false)),

  async execute(interaction, { leadService, logger }) {
    try {
      const status = interaction.options.getString('status');
      const limit = interaction.options.getInteger('limit') || 10;

      const leads = leadService.getLeads({
        guildId: interaction.guildId,
        status,
        limit: Math.min(limit, 25)
      });

      if (leads.length === 0) {
        return interaction.reply({
          content: status 
            ? `📭 No leads found with status "${status}".` 
            : '📭 No leads found. Add your first lead with `/lead-add`',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('📋 Lead Pipeline')
        .setDescription(status ? `Showing ${status} leads` : 'Showing all active leads')
        .setTimestamp();

      leads.forEach(lead => {
        const statusEmoji = {
          'new': '🆕',
          'contacted': '📞',
          'qualified': '✅',
          'offer_made': '💰',
          'under_contract': '📄',
          'closed': '🎉',
          'dead': '❌'
        }[lead.status] || '⚪';

        embed.addFields({
          name: `${statusEmoji} #${lead.id} - ${lead.name}`,
          value: `📱 ${lead.phone} | 📍 ${lead.address || 'No address'} | 🏷️ ${lead.status}`,
          inline: false
        });
      });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('export_leads')
            .setLabel('📥 Export CSV')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.reply({ embeds: [embed], components: [row] });

    } catch (error) {
      logger.error('Error listing leads:', error);
      await interaction.reply({
        content: '❌ Failed to retrieve leads.',
        ephemeral: true
      });
    }
  },
};
