const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View ticket statistics'),

  async execute(interaction, client) {
    const stats = client.db.getTicketStats(interaction.guild.id, 30);
    const openTickets = client.db.getGuildTickets(interaction.guild.id, 'open');

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📊 Ticket Statistics (Last 30 Days)')
      .addFields(
        { name: '🟢 Open Tickets', value: stats.open.toString(), inline: true },
        { name: '🔴 Closed Tickets', value: stats.closed.toString(), inline: true },
        { name: '⏱️ Avg Response', value: `${stats.avgResponseDays.toFixed(1)} days`, inline: true }
      )
      .setTimestamp();

    if (openTickets.length > 0) {
      embed.addFields({
        name: '🎫 Current Open Tickets',
        value: openTickets.slice(0, 10).map(t => `#${t.ticket_number}: ${t.subject?.slice(0, 30) || 'No subject'}${t.subject?.length > 30 ? '...' : ''}`).join('\n') || 'None'
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};