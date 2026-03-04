const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-config')
    .setDescription('Configure ticket categories and settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand.setName('add')
        .setDescription('Add a ticket category')
        .addStringOption(option => option.setName('name').setDescription('Category name').setRequired(true))
        .addStringOption(option => option.setName('description').setDescription('Category description').setRequired(false))
        .addStringOption(option => option.setName('emoji').setDescription('Emoji for category').setRequired(false))
        .addRoleOption(option => option.setName('role').setDescription('Role to ping for this category').setRequired(false))
        .addChannelOption(option => option.setName('parent').setDescription('Parent channel category').setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('remove')
        .setDescription('Remove a ticket category')
        .addIntegerOption(option => option.setName('id').setDescription('Category ID').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List all categories')),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    client.db.createGuildSettings(interaction.guild.id);

    if (subcommand === 'add') {
      const name = interaction.options.getString('name');
      const description = interaction.options.getString('description');
      const emoji = interaction.options.getString('emoji') || '🎫';
      const role = interaction.options.getRole('role');
      const parent = interaction.options.getChannel('parent');

      const result = client.db.createCategory(
        interaction.guild.id,
        name,
        description,
        emoji,
        role?.id,
        parent?.id
      );

      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('✅ Category Created')
        .addFields(
          { name: 'Name', value: `${emoji} ${name}`, inline: true },
          { name: 'ID', value: result.lastInsertRowid.toString(), inline: true },
          { name: 'Description', value: description || 'None' }
        );

      await interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'remove') {
      const id = interaction.options.getInteger('id');
      client.db.deleteCategory(id);
      
      await interaction.reply({
        content: `✅ Category ${id} removed.`,
        ephemeral: true
      });

    } else if (subcommand === 'list') {
      const categories = client.db.getCategories(interaction.guild.id);

      if (categories.length === 0) {
        return interaction.reply({
          content: '❌ No categories configured.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📋 Ticket Categories')
        .setDescription(categories.map(c => 
          `**ID:** ${c.id} | ${c.emoji} **${c.name}**\n${c.description || 'No description'}`
        ).join('\n\n'));

      await interaction.reply({ embeds: [embed] });
    }
  }
};