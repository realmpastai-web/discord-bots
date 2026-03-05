const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#3498DB')
      .setTitle('🏠 Real Estate Lead Bot - Help')
      .setDescription('Complete lead management system for real estate wholesalers')
      .addFields(
        {
          name: '📝 Lead Management',
          value: [
            '`/lead-add` - Add a new lead with contact info',
            '`/lead-list` - View all leads or filter by status',
            '`/lead-view <id>` - View detailed lead information',
            '`/lead-update <id>` - Update lead status or add notes'
          ].join('\n')
        },
        {
          name: '⏰ Follow-ups',
          value: [
            '`/followup-schedule` - Schedule a follow-up for a lead',
            '`/followup-today` - View today\'s scheduled follow-ups'
          ].join('\n')
        },
        {
          name: '📊 Analytics',
          value: [
            '`/pipeline` - View sales pipeline dashboard',
            '`/reports` - Generate detailed reports (coming soon)'
          ].join('\n')
        },
        {
          name: '🎯 Lead Status Guide',
          value: [
            '🆕 **New** - Just added, no contact yet',
            '📞 **Contacted** - Initial contact made',
            '✅ **Qualified** - Motivated seller confirmed',
            '💰 **Offer Made** - Offer submitted',
            '📄 **Under Contract** - Deal in progress',
            '🎉 **Closed** - Deal completed!',
            '❌ **Dead** - Lead no longer viable'
          ].join('\n')
        }
      )
      .setFooter({ text: 'Built by QuantBitRealm | Premium Real Estate Tools' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
