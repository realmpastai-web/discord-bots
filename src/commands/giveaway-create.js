const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');
const db = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-create')
    .setDescription('Create a new giveaway')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addStringOption(option =>
      option.setName('prize')
        .setDescription('What is the prize?')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('How long? (e.g., 1h, 1d, 7d)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('winners')
        .setDescription('Number of winners')
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(false))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Additional details about the giveaway')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('required-role')
        .setDescription('Role required to enter')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('min-account-age')
        .setDescription('Minimum account age in days')
        .setMinValue(0)
        .setMaxValue(365)
        .setRequired(false)),

  async execute(interaction, client) {
    const prize = interaction.options.getString('prize');
    const durationStr = interaction.options.getString('duration');
    const winnerCount = interaction.options.getInteger('winners') || 1;
    const description = interaction.options.getString('description');
    const requiredRole = interaction.options.getRole('required-role');
    const minAccountAge = interaction.options.getInteger('min-account-age') || 0;

    // Parse duration
    const durationMs = ms(durationStr);
    if (!durationMs || durationMs < 60000) {
      return interaction.reply({
        content: '❌ Invalid duration. Use format like: 1h, 30m, 1d, 7d',
        ephemeral: true
      });
    }

    if (durationMs > 30 * 24 * 60 * 60 * 1000) {
      return interaction.reply({
        content: '❌ Maximum duration is 30 days',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Create giveaway in database
      const requirements = {};
      if (requiredRole) requirements.roleId = requiredRole.id;
      if (minAccountAge > 0) requirements.minAccountAge = minAccountAge;

      const giveawayId = await client.giveaways.createGiveaway({
        channelId: interaction.channelId,
        guildId: interaction.guildId,
        prize,
        description,
        winnerCount,
        durationMs,
        hostId: interaction.user.id,
        requirements
      });

      // Build embed
      const endTime = new Date(Date.now() + durationMs);
      const requirementsText = [];
      if (requiredRole) requirementsText.push(`• Role: ${requiredRole.name}`);
      if (minAccountAge > 0) requirementsText.push(`• Account age: ${minAccountAge}+ days`);

      const embed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('🎉 Giveaway!')
        .setDescription(`**${prize}**${description ? '\n\n' + description : ''}`)
        .addFields(
          { name: '🏆 Winners', value: `${winnerCount}`, inline: true },
          { name: '⏰ Ends', value: `<t:${Math.floor(endTime.getTime() / 1000)}:R>`, inline: true },
          { name: '👤 Hosted by', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setFooter({ text: `ID: ${giveawayId} • Click 🎉 to enter!` })
        .setTimestamp();

      if (requirementsText.length > 0) {
        embed.addFields({ name: '✅ Requirements', value: requirementsText.join('\n') });
      }

      // Create button
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`giveaway_enter_${giveawayId}`)
            .setLabel('🎉 Enter Giveaway')
            .setStyle(ButtonStyle.Primary)
        );

      const message = await interaction.channel.send({ embeds: [embed], components: [row] });

      // Update giveaway with message ID
      db.prepare('UPDATE giveaways SET message_id = ? WHERE id = ?').run(message.id, giveawayId);

      await interaction.editReply({
        content: `✅ Giveaway created! ID: ${giveawayId}`
      });

    } catch (error) {
      console.error('Error creating giveaway:', error);
      await interaction.editReply({
        content: '❌ Failed to create giveaway. Please try again.'
      });
    }
  }
};
