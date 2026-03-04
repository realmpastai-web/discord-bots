const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AnalyticsRepository } = require('../../database/repository');
const { formatNumber } = require('../../utils/formatters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('growth')
    .setDescription('View server growth charts and member trends'),

  async execute(interaction) {
    await interaction.deferReply();
    
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply('This command can only be used in a server.');
      return;
    }

    const snapshots = AnalyticsRepository.getSnapshots(guild.id, 30);
    const memberEvents = AnalyticsRepository.getMemberEvents(guild.id, 30);

    // Generate text-based chart
    let chartText = '```\n📈 Server Growth (Last 30 Days)\nMembers  │\n';
    
    if (snapshots.length < 2) {
      chartText += 'Not enough data to generate chart\n';
    } else {
      const memberData = snapshots.map(s => s.member_count);
      const maxMembers = Math.max(...memberData);
      const minMembers = Math.min(...memberData);
      const range = maxMembers - minMembers || 1;
      const chartHeight = 10;

      for (let i = chartHeight; i >= 0; i--) {
        const threshold = minMembers + (range * i / chartHeight);
        let line = `${Math.round(threshold).toString().padStart(8)} │`;
        
        for (const count of memberData) {
          line += count >= threshold ? ' █' : '  ';
        }
        chartText += line + '\n';
      }

      chartText += '         └' + '──'.repeat(memberData.length) + '\n';
      chartText += '          ' + snapshots.map(s => {
        const date = new Date(s.snapshot_date * 1000);
        return `${date.getMonth() + 1}/${date.getDate()}`.padStart(2);
      }).join(' ') + '\n';
    }
    chartText += '```';

    // Calculate growth metrics
    const currentMembers = guild.memberCount;
    const growth30d = memberEvents.joins - memberEvents.leaves;
    const growthRate = snapshots.length > 1 && snapshots[0].member_count > 0
      ? ((currentMembers - snapshots[0].member_count) / snapshots[0].member_count * 100).toFixed(1)
      : '0.0';

    const embed = new EmbedBuilder()
      .setTitle(`📈 ${guild.name} Growth Analytics`)
      .setColor('#5865F2')
      .setDescription(chartText)
      .addFields(
        { 
          name: '👥 Current Statistics', 
          value: `
• Total Members: **${formatNumber(currentMembers)}**
• Growth (30d): **${growth30d > 0 ? '+' : ''}${formatNumber(growth30d)}**
• Growth Rate: **${growthRate}%**
`,
          inline: true 
        },
        { 
          name: '📊 Activity (30d)', 
          value: `
• New Joins: **${formatNumber(memberEvents.joins)}**
• Leaves: **${formatNumber(memberEvents.leaves)}**
• Net Growth: **${growth30d > 0 ? '+' : ''}${formatNumber(growth30d)}**
`,
          inline: true 
        }
      )
      .setFooter({ text: 'ServerStats Pro • Growth Tracking' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
