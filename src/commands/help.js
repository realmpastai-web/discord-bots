const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display help information for ServerStats Pro'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📊 ServerStats Pro - Help')
      .setColor('#5865F2')
      .setDescription('Professional Discord server analytics bot. Track member growth, message activity, and more!')
      .addFields(
        { 
          name: '📈 Analytics Commands', 
          value: `
• **/stats** - View comprehensive server statistics
• **/activity** [period] - View daily activity charts (7/14/30 days)
• **/growth** - View server growth trends over 30 days
• **/topusers** [limit] - Leaderboard of most active members
• **/channelstats** - Channel usage statistics
`,
          inline: false 
        },
        { 
          name: '⚙️ Admin Commands', 
          value: `
• **/export** <format> - Export data as CSV or JSON (Admin only)
`,
          inline: false 
        },
        { 
          name: '💡 Tips', 
          value: `
• The bot automatically tracks all messages and member activity
• Data is stored locally in a SQLite database
• Use /export to backup your analytics data
• Charts update in real-time as members chat
`,
          inline: false 
        }
      )
      .setFooter({ text: 'ServerStats Pro v1.0.0 • Built by QuantBitRealm' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
