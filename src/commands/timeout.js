const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user (temporarily mute)')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to timeout')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('duration')
        .setDescription('Duration in minutes')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320) // 28 days max
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for timeout')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (user.id === interaction.user.id) {
      return interaction.reply({
        content: '❌ You cannot timeout yourself!',
        ephemeral: true,
      });
    }

    if (user.id === interaction.client.user.id) {
      return interaction.reply({
        content: '❌ You cannot timeout me!',
        ephemeral: true,
      });
    }

    try {
      const member = await interaction.guild.members.fetch(user.id);

      if (!member.moderatable) {
        return interaction.reply({
          content: '❌ I cannot timeout this user.',
          ephemeral: true,
        });
      }

      const durationMs = duration * 60 * 1000;
      await member.timeout(durationMs, `${reason} | By ${interaction.user.tag}`);

      await interaction.client.db.logAction({
        guildId: interaction.guild.id,
        action: 'timeout',
        targetId: user.id,
        targetTag: user.tag,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        reason: `${reason} (${duration} minutes)`,
        timestamp: new Date().toISOString(),
      });

      const embed = new EmbedBuilder()
        .setColor(0xff6b6b)
        .setTitle('🔇 User Timed Out')
        .addFields(
          { name: 'User', value: user.tag, inline: true },
          { name: 'Duration', value: `${duration} minutes`, inline: true },
          { name: 'Expires', value: `<t:${Math.floor((Date.now() + durationMs) / 1000)}:R>`, inline: true },
          { name: 'Reason', value: reason },
          { name: 'Moderator', value: interaction.user.tag }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Timeout error:', error);
      await interaction.reply({
        content: '❌ Failed to timeout user.',
        ephemeral: true,
      });
    }
  },
};
