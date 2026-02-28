const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const warnings = require('../utils/warnings.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View warnings for a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check warnings for')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const userWarnings = warnings.get(interaction.guild.id, target.id);

    if (!userWarnings || userWarnings.length === 0) {
      return interaction.reply({ content: `✅ **${target.tag}** has no warnings.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`⚠️ Warnings for ${target.tag}`)
      .setDescription(`Total warnings: ${userWarnings.length}`)
      .setTimestamp();

    userWarnings.slice(0, 10).forEach((warn, index) => {
      embed.addFields({
        name: `Warning #${index + 1} - <t:${Math.floor(warn.timestamp / 1000)}:R>`,
        value: `Reason: ${warn.reason}\nBy: <@${warn.moderatorId}>`
      });
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
