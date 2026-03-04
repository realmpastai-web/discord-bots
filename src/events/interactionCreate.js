const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction, client) {
    // Handle slash commands
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: '❌ There was an error executing this command!',
          ephemeral: true
        });
      }
    }

    // Handle select menus
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_create') {
      const categoryId = interaction.values[0];
      const category = client.db.getCategory(categoryId);

      if (!category) {
        return interaction.reply({
          content: '❌ Invalid category selected.',
          ephemeral: true
        });
      }

      // Get ticket number
      const ticketNumber = client.db.getTicketCounter(interaction.guild.id) + 1;
      const channelName = `ticket-${ticketNumber.toString().padStart(4, '0')}`;

      try {
        const ticketChannel = await interaction.guild.channels.create({
          name: channelName,
          type: 0,
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

        if (category.role_id) {
          await ticketChannel.permissionOverwrites.create(category.role_id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
          });
        }

        client.db.createTicket(ticketNumber, interaction.guild.id, ticketChannel.id, interaction.user.id, category.id, 'Support Request');
        client.db.incrementTicketCounter(interaction.guild.id);

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`${category.emoji} Ticket #${ticketNumber}`)
          .addFields(
            { name: 'Created by', value: `<@${interaction.user.id}>` },
            { name: 'Category', value: category.name }
          )
          .setTimestamp();

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

    // Handle buttons
    if (interaction.isButton()) {
      if (interaction.customId === 'ticket_claim') {
        const ticket = client.db.getTicketByChannel(interaction.channel.id);
        if (!ticket) return;

        const isSupport = client.db.isSupportMember(interaction.guild.id, interaction.user.id);
        if (!isSupport) {
          return interaction.reply({
            content: '❌ Only support team members can claim tickets.',
            ephemeral: true
          });
        }

        if (ticket.claimed_by) {
          return interaction.reply({
            content: `❌ Already claimed by <@${ticket.claimed_by}>.`,
            ephemeral: true
          });
        }

        client.db.claimTicket(interaction.channel.id, interaction.user.id);

        const embed = new EmbedBuilder()
          .setColor(0x57F287)
          .setDescription(`✅ <@${interaction.user.id}> has claimed this ticket.`);

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: '✅ Ticket claimed!', ephemeral: true });
      }

      if (interaction.customId === 'ticket_close') {
        const ticket = client.db.getTicketByChannel(interaction.channel.id);
        if (!ticket) return;

        if (ticket.status === 'closed') {
          return interaction.reply({
            content: '❌ This ticket is already closed.',
            ephemeral: true
          });
        }

        client.db.closeTicket(interaction.channel.id, interaction.user.id, null);

        const embed = new EmbedBuilder()
          .setColor(0xED4245)
          .setTitle('🔒 Ticket Closed')
          .setDescription(`Closed by <@${interaction.user.id}>`)
          .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
          SendMessages: false
        });

        await interaction.reply({
          content: '✅ Ticket closed. This channel will be archived.',
          ephemeral: true
        });

        setTimeout(async () => {
          try {
            await interaction.channel.delete('Ticket closed');
          } catch (error) {
            console.error('Error deleting channel:', error);
          }
        }, 60000);
      }
    }
  }
};