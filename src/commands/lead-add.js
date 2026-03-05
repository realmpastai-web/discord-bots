const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lead-add')
    .setDescription('Add a new real estate lead')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Lead name')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('phone')
        .setDescription('Phone number')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('email')
        .setDescription('Email address')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('address')
        .setDescription('Property address')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('source')
        .setDescription('Lead source (e.g., Website, Referral, Cold Call)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('notes')
        .setDescription('Initial notes about the lead')
        .setRequired(false)),

  async execute(interaction, { leadService, logger }) {
    try {
      const name = interaction.options.getString('name');
      const phone = interaction.options.getString('phone');
      const email = interaction.options.getString('email');
      const address = interaction.options.getString('address');
      const source = interaction.options.getString('source') || 'Discord';
      const notes = interaction.options.getString('notes');

      const lead = leadService.createLead({
        name,
        phone,
        email,
        address,
        source,
        notes,
        createdBy: interaction.user.id,
        guildId: interaction.guildId
      });

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ New Lead Added')
        .addFields(
          { name: 'Lead ID', value: `#${lead.id}`, inline: true },
          { name: 'Name', value: lead.name, inline: true },
          { name: 'Phone', value: lead.phone, inline: true },
          { name: 'Status', value: lead.status, inline: true },
          { name: 'Source', value: lead.source, inline: true }
        )
        .setTimestamp();

      if (email) embed.addFields({ name: 'Email', value: lead.email, inline: true });
      if (address) embed.addFields({ name: 'Address', value: lead.address });

      logger.info(`Lead #${lead.id} created by ${interaction.user.tag}`);
      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      logger.error('Error creating lead:', error);
      await interaction.reply({
        content: '❌ Failed to add lead. Please try again.',
        ephemeral: true
      });
    }
  },
};
