const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modsettings')
    .setDescription('View current moderation settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('⚙️ Moderation Bot Settings')
      .addFields(
        { name: 'Warning Threshold', value: `${client.config.warnThreshold} warnings = auto-timeout`, inline: true },
        { name: 'Spam Threshold', value: `${client.config.spamThreshold} messages / ${client.config.spamWindow}ms`, inline: true },
        { name: 'Banned Words', value: client.config.bannedWords.length > 0 ? client.config.bannedWords.join(', ') : 'None configured', inline: false }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
