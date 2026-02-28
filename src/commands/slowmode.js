const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for a channel')
    .addIntegerOption(option =>
      option
        .setName('seconds')
        .setDescription('Slowmode delay in seconds (0 to disable)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to set slowmode (default: current)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('seconds');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      await channel.setRateLimitPerUser(seconds, `By ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('🐌 Slowmode Updated')
        .addFields(
          { name: 'Channel', value: channel.toString(), inline: true },
          { name: 'Delay', value: seconds === 0 ? 'Disabled' : `${seconds} seconds`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Slowmode error:', error);
      await interaction.reply({
        content: '❌ Failed to set slowmode.',
        ephemeral: true,
      });
    }
  },
};
