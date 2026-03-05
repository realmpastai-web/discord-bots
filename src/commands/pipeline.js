const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pipeline')
    .setDescription('View sales pipeline dashboard with statistics'),

  async execute(interaction, { leadService, logger }) {
    try {
      const stats = leadService.getPipelineStats(interaction.guildId);

      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('📊 Sales Pipeline Dashboard')
        .setDescription('Real-time overview of your lead pipeline')
        .setTimestamp();

      // Pipeline stages
      embed.addFields({
        name: '📈 Pipeline Stages',
        value: [
          `🆕 **New:** ${stats.byStatus.new || 0}`,
          `📞 **Contacted:** ${stats.byStatus.contacted || 0}`,
          `✅ **Qualified:** ${stats.byStatus.qualified || 0}`,
          `💰 **Offer Made:** ${stats.byStatus.offer_made || 0}`,
          `📄 **Under Contract:** ${stats.byStatus.under_contract || 0}`,
          `🎉 **Closed:** ${stats.byStatus.closed || 0}`,
          `❌ **Dead:** ${stats.byStatus.dead || 0}`
        ].join('\n'),
        inline: true
      });

      // Key metrics
      const conversionRate = stats.total > 0 
        ? ((stats.byStatus.closed || 0) / stats.total * 100).toFixed(1)
        : 0;

      embed.addFields({
        name: '🎯 Key Metrics',
        value: [
          `📊 **Total Leads:** ${stats.total}`,
          `🎯 **Conversion Rate:** ${conversionRate}%`,
          `📞 **Active Pipeline:** ${stats.active}`,
          `💰 **Closed Deals:** ${stats.byStatus.closed || 0}`
        ].join('\n'),
        inline: true
      });

      // Top sources
      if (Object.keys(stats.bySource).length > 0) {
        const sourcesText = Object.entries(stats.bySource)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([source, count]) => `• ${source}: ${count}`)
          .join('\n');
        
        embed.addFields({
          name: '📣 Top Lead Sources',
          value: sourcesText,
          inline: false
        });
      }

      // Recent activity
      const recentLeads = leadService.getRecentLeads(interaction.guildId, 3);
      if (recentLeads.length > 0) {
        const recentText = recentLeads
          .map(l => `• #${l.id} ${l.name} (${l.status})`)
          .join('\n');
        
        embed.addFields({
          name: '🕐 Recent Activity',
          value: recentText,
          inline: false
        });
      }

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      logger.error('Error generating pipeline:', error);
      await interaction.reply({
        content: '❌ Failed to generate pipeline dashboard.',
        ephemeral: true
      });
    }
  },
};
