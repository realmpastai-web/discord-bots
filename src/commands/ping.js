const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedUtil = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and API response time'),

  async execute(interaction, client) {
    const sent = await interaction.reply({ 
      content: 'Calculating ping...', 
      fetchReply: true 
    });
    
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    const embed = EmbedUtil.info('🏓 Pong!', 'Bot latency information')
      .addFields(
        { name: 'Bot Latency', value: `${latency}ms`, inline: true },
        { name: 'API Latency', value: `${apiLatency}ms`, inline: true },
        { name: 'Uptime', value: `<t:${Math.floor((Date.now() - client.uptime) / 1000)}:R>`, inline: true }
      );

    await interaction.editReply({ content: '', embeds: [embed] });
  }
};
