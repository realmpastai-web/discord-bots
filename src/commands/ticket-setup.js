const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('Create a ticket panel in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Title for the ticket panel')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Description for the ticket panel')
        .setRequired(false)),

  async execute(interaction, client) {
    const title = interaction.options.getString('title') || '🎫 Support Tickets';
    const description = interaction.options.getString('description') || 'Select a category below to create a support ticket.';

    // Ensure guild settings exist
    client.db.createGuildSettings(interaction.guild.id);

    // Get categories for this guild
    const categories = client.db.getCategories(interaction.guild.id);

    if (categories.length === 0) {
      return interaction.reply({
        content: '❌ No ticket categories configured. Use `/ticket-config add` to create categories first.',
        ephemeral: true
      });
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(title)
      .setDescription(description)
      .addFields(
        { name: '📋 Available Categories', value: categories.map(c => `${c.emoji} **${c.name}** - ${c.description || 'No description'}`).join('\n') }
      )
      .setFooter({ text: 'Select a category to open a ticket' })
      .setTimestamp();

    // Create select menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket_create')
      .setPlaceholder('Select a category...')
      .addOptions(categories.map(cat => ({
        label: cat.name,
        description: cat.description?.slice(0, 100) || 'Create a ticket',
        value: cat.id.toString(),
        emoji: cat.emoji
      })));

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.channel.send({ embeds: [embed], components: [row] });
    
    await interaction.reply({
      content: '✅ Ticket panel created!',
      ephemeral: true
    });
  }
};