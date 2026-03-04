const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { AnalyticsRepository } = require('../../database/repository');
const { formatNumber } = require('../../utils/formatters');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('export')
    .setDescription('Export server analytics data (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('format')
        .setDescription('Export format')
        .setRequired(true)
        .addChoices(
          { name: 'CSV', value: 'csv' },
          { name: 'JSON', value: 'json' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();
    
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply('This command can only be used in a server.');
      return;
    }

    const format = interaction.options.getString('format');
    const topUsers = AnalyticsRepository.getTopUsers(guild.id, 100);
    const dailyStats = AnalyticsRepository.getDailyStats(guild.id, 30);

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    let filePath, fileContent;

    if (format === 'csv') {
      filePath = path.join(tempDir, `stats-${guild.id}-${timestamp}.csv`);
      
      // Create CSV content
      let csv = 'User ID,Username,Message Count,Character Count\n';
      for (const user of topUsers) {
        csv += `${user.user_id},"${user.username || 'Unknown'}",${user.message_count},${user.character_count}\n`;
      }
      
      csv += '\n\nDate,Messages,Active Users\n';
      for (const day of dailyStats) {
        csv += `${day.day},${day.messages},${day.active_users}\n`;
      }
      
      fileContent = csv;
    } else {
      filePath = path.join(tempDir, `stats-${guild.id}-${timestamp}.json`);
      
      fileContent = JSON.stringify({
        guild: {
          id: guild.id,
          name: guild.name,
          memberCount: guild.memberCount,
          exportedAt: new Date().toISOString()
        },
        topUsers,
        dailyStats
      }, null, 2);
    }

    fs.writeFileSync(filePath, fileContent);

    const embed = new EmbedBuilder()
      .setTitle('📤 Data Export Complete')
      .setColor('#00ff00')
      .setDescription(`Your server analytics data has been exported in **${format.toUpperCase()}** format.`)
      .addFields(
        { name: '📊 Records Exported', value: `${formatNumber(topUsers.length)} users\n${formatNumber(dailyStats.length)} days of activity`, inline: true },
        { name: '📁 File', value: `stats-${guild.id}-${timestamp}.${format}`, inline: true }
      )
      .setFooter({ text: 'ServerStats Pro • Data Export' })
      .setTimestamp();

    await interaction.editReply({ 
      embeds: [embed],
      files: [filePath]
    });

    // Clean up file after sending
    setTimeout(() => {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }, 60000);
  }
};
