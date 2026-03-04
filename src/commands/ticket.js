const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Create a new support ticket')
    .addStringOption(option =>
      option.setName('subject')
        .setDescription('Brief subject for your ticket')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Detailed description of your issue')
        .setRequired(false)),

  async execute(interaction, client) {
    const subject = interaction.options.getString('subject');
    const description = interaction.options.getString('description') || 'No additional details provided.';

    // Get default category
    const categories = client.db.getCategories(interaction.guild.id);
    if (categories.length === 0) {
      return interaction.reply({
        content: '❌ Ticket system is not configured yet. Please contact an administrator.',
        ephemeral: true
      });
    }

    const category = categories[0]; // Use first category as default

    // Get ticket number
    const ticketNumber = client.db.getTicketCounter(interaction.guild.id) + 1;

    // Create ticket channel
    const channelName = `ticket-${ticketNumber.toString().padStart(4, '0')}`;
    
    try {
      const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: 0, // Text channel
        parent: category.parent_channel_id || null,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: ['ViewChannel']
          },
          {
            id: interaction.user.id,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
          },
          {
            id: interaction.client.user.id,
            allow: ['ViewChannel', 'SendMessages', 'ManageChannels', 'ReadMessageHistory']
          }
        ]
      });

      // Add support team permissions
      const supportTeam = client.db.getSupportTeam(interaction.guild.id);
      for (const member of supportTeam) {
        await ticketChannel.permissionOverwrites.create(member.user_id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true
        });
      }

      // Add category role if exists
      if (category.role_id) {
        await ticketChannel.permissionOverwrites.create(category.role_id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true
        });
      }

      // Save ticket to database
      client.db.createTicket(ticketNumber, interaction.guild.id, ticketChannel.id, interaction.user.id, category.id, subject);
      client.db.incrementTicketCounter(interaction.guild.id);

      // Create ticket embed
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`${category.emoji} Ticket #${ticketNumber}`)
        .addFields(
          { name: 'Subject', value: subject },
          { name: 'Description', value: description },
          { name: 'Created by', value: `<@${interaction.user.id}>` },
          { name: 'Category', value: category.name }
        )
        .setTimestamp();

      // Create action buttons
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_claim')
          .setLabel('Claim Ticket')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({
        content: `<@${interaction.user.id}> ${category.role_id ? `<@&${category.role_id}>` : ''}`,
        embeds: [embed],
        components: [row]
      });

      await interaction.reply({
        content: `✅ Ticket created! <#${ticketChannel.id}>`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.reply({
        content: '❌ Failed to create ticket. Please try again.',
        ephemeral: true
      });
    }
  }
};