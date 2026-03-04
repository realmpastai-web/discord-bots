const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AnalyticsRepository } = require('../../database/repository');
const { formatNumber } = require('../../utils/formatters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('activity')
    .setDescription('View server activity charts and statistics')
    .addStringOption(option =>
      option
        .setName('period')
        .setDescription('Time period to view')
        .setRequired(false)
        .addChoices(
          { name: 'Last 7 days', value: '7' },
          { name: 'Last 14 days', value: '14' },
          { name: 'Last 30 days', value: '30' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();
    
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply('This command can only be used in a server.');
      return;
    }

    const days = parseInt(interaction.options.getString('period') || '7');
    const dailyData = AnalyticsRepository.getDailyStats(guild.id, days);

    // Generate text-based chart
    let chartText = '```\n📊 Daily Activity (Messages)\nMsgs  │\n';
    
    if (dailyData.length === 0) {
      chartText += 'No data available yet\n';
    } else {
      const maxMessages = Math.max(...dailyData.map(d => d.messages)) || 1;
      const chartHeight = 8;
      
      for (let i = chartHeight; i >= 0; i--) {
        const threshold = maxMessages * i / chartHeight;
        let line = `${Math.round(threshold).toString().padStart(5)} │`;
        
        for (const day of dailyData) {
          line += day.messages >= threshold ? ' ▓' : '  ';
        }
        chartText += line + '\n';
      }
      
      chartText += '      └' + '──'.repeat(dailyData.length) + '\n';
      chartText += '       ' + dailyData.map(d => d.day.slice(5)).join(' ') + '\n';
    }
    chartText += '```';
    
    // Calculate summary stats
    const totalMessages = dailyData.reduce((sum, d) => sum + d.messages, 0);
    const avgDailyMessages = Math.round(totalMessages / (dailyData.length || 1));
    const peakDay = dailyData.length > 0 
      ? dailyData.reduce((max, d) => d.messages > max.messages ? d : max, dailyData[0])
      : null;

    const embed = new EmbedBuilder()
      .setTitle(`📈 ${guild.name} Activity Report`)
      .setColor('#3ba55c')
      .setDescription(chartText)
      .addFields(
        { 
          name: `📊 Summary (Last ${days} days)`, 
          value: `
• Total Messages: **${formatNumber(totalMessages)}**
• Daily Average: **${formatNumber(avgDailyMessages)}**
• Peak Day: **${peakDay ? peakDay.day : 'N/A'}** (${peakDay ? formatNumber(peakDay.messages) : 0} msgs)
`,
          inline: false 
        }
      )
      .setFooter({ text: 'ServerStats Pro • Activity Analytics' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
