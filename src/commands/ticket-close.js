const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-close')
    .setDescription('Close the current ticket')
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for closing')
        .setRequired(false)),

  async execute(interaction, client) {
    // Check if this is a ticket channel
    const ticket = client.db.getTicketByChannel(interaction.channel.id);
    
    if (!ticket) {
      return interaction.reply({
        content: '❌ This is not a ticket channel.',
        ephemeral: true
      });
    }

    if (ticket.status === 'closed') {
      return interaction.reply({
        content: '❌ This ticket is already closed.',
        ephemeral: true
      });
    }

    const reason = interaction.options.getString('reason') || 'No reason provided';

    // Generate transcript
    const messages = client.db.getTicketMessages(ticket.id);
    let transcript = `Ticket #${ticket.ticket_number} Transcript\n`;
    transcript += `Subject: ${ticket.subject}\n`;
    transcript += `Created by: <@${ticket.creator_id}>\n`;
    transcript += `Closed by: <@${interaction.user.id}>\n`;
    transcript += `Reason: ${reason}\n`;
    transcript += `Closed at: ${new Date().toISOString()}\n`;
    transcript += '='.repeat(50) + '\n\n';

    for (const msg of messages) {
      transcript += `[${msg.created_at}] ${msg.author_tag}: ${msg.content}\n`;
    }

    // Save transcript (in production, upload to file service)
    const transcriptUrl = 'transcript-placeholder';

    // Update database
    client.db.closeTicket(interaction.channel.id, interaction.user.id, transcriptUrl);

    // Send close message
    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🔒 Ticket Closed')
      .addFields(
        { name: 'Ticket', value: `#${ticket.ticket_number}` },
        { name: 'Closed by', value: `<@${interaction.user.id}>` },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });

    // Archive channel (remove send permissions)
    await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
      SendMessages: false
    });

    await interaction.reply({
      content: '✅ Ticket closed. This channel will be archived.',
      ephemeral: true
    });

    // Optionally delete channel after delay
    setTimeout(async () => {
      try {
        await interaction.channel.delete('Ticket closed and archived');
      } catch (error) {
        console.error('Error deleting ticket channel:', error);
      }
    }, 60000); // Delete after 1 minute
  }
};