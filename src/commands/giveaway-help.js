const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-help')
    .setDescription('Show giveaway bot help and commands'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('🎉 Giveaway Pro Bot - Help')
      .setDescription('Create and manage professional giveaways with requirements and verification!')
      .addFields(
        {
          name: '🛠️ Admin Commands',
          value: [
            '`/giveaway-create` - Create a new giveaway',
            '`/giveaway-end` - End a giveaway early',
            '`/giveaway-reroll` - Pick new winner(s)',
            '`/giveaway-list` - Show active giveaways',
            '`/giveaway-stats` - View giveaway statistics'
          ].join('\n')
        },
        {
          name: '🎮 User Commands',
          value: [
            'Click the 🎉 button on any giveaway to enter!',
            'Requirements are checked automatically.'
          ].join('\n')
        },
        {
          name: '✨ Features',
          value: [
            '• Role requirements',
            '• Account age verification',
            '• Multiple winners',
            '• Automatic winner selection',
            '• Entry statistics',
            '• Reroll capability'
          ].join('\n')
        },
        {
          name: '⏱️ Duration Format',
          value: '`1m` = 1 minute, `1h` = 1 hour, `1d` = 1 day, `7d` = 7 days'
        }
      )
      .setFooter({ text: 'Built by QuantBitRealm' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
