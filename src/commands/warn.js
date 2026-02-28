const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to warn')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    if (user.id === interaction.user.id) {
      return interaction.reply({
        content: '❌ You cannot warn yourself!',
        ephemeral: true,
      });
    }

    if (user.id === interaction.client.user.id) {
      return interaction.reply({
        content: '❌ You cannot warn me!',
        ephemeral: true,
      });
    }

    try {
      // Add warning to database
      await interaction.client.db.addWarning({
        guildId: interaction.guild.id,
        userId: user.id,
        userTag: user.tag,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        reason: reason,
        timestamp: new Date().toISOString(),
      });

      // Get warning count
      const warnings = await interaction.client.db.getWarnings(interaction.guild.id, user.id);
      const warningCount = warnings.length;

      await interaction.client.db.logAction({
        guildId: interaction.guild.id,
        action: 'warn',
        targetId: user.id,
        targetTag: user.tag,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        reason: reason,
        timestamp: new Date().toISOString(),
      });

      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle('⚠️ Warning Issued')
        .addFields(
          { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
          { name: 'Moderator', value: interaction.user.tag, inline: true },
          { name: 'Total Warnings', value: warningCount.toString(), inline: true },
          { name: 'Reason', value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Try to DM the user
      try {
        await user.send({
          content: `⚠️ You have been warned in **${interaction.guild.name}**.\n📋 **Reason:** ${reason}\n📊 **Total warnings:** ${warningCount}`,
        });
      } catch {
        // User has DMs disabled
      }
    } catch (error) {
      console.error('Warn error:', error);
      await interaction.reply({
        content: '❌ Failed to issue warning.',
        ephemeral: true,
      });
    }
  },
};
