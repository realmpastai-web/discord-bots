const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View warnings for a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to check')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('user');

    try {
      const warnings = await interaction.client.db.getWarnings(interaction.guild.id, user.id);

      if (warnings.length === 0) {
        return interaction.reply({
          content: `✅ **${user.tag}** has no warnings.`,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle(`⚠️ Warnings for ${user.tag}`)
        .setDescription(`Total warnings: ${warnings.length}`)
        .setTimestamp();

      warnings.slice(0, 10).forEach((warning, index) => {
        embed.addFields({
          name: `Warning #${index + 1} — ${new Date(warning.timestamp).toLocaleDateString()}`,
          value: `**By:** ${warning.moderatorTag}\n**Reason:** ${warning.reason}`,
        });
      });

      if (warnings.length > 10) {
        embed.setFooter({ text: `Showing 10 of ${warnings.length} warnings` });
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Warnings error:', error);
      await interaction.reply({
        content: '❌ Failed to fetch warnings.',
        ephemeral: true,
      });
    }
  },
};
