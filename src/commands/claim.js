const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim this ticket'),

  async execute(interaction, client) {
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

    // Check if user is support team
    const isSupport = client.db.isSupportMember(interaction.guild.id, interaction.user.id);
    if (!isSupport) {
      return interaction.reply({
        content: '❌ Only support team members can claim tickets.',
        ephemeral: true
      });
    }

    if (ticket.claimed_by) {
      return interaction.reply({
        content: `❌ This ticket is already claimed by <@${ticket.claimed_by}>.`,
        ephemeral: true
      });
    }

    // Claim ticket
    client.db.claimTicket(interaction.channel.id, interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setDescription(`✅ <@${interaction.user.id}> has claimed this ticket.`);

    await interaction.channel.send({ embeds: [embed] });
    await interaction.reply({ content: '✅ Ticket claimed!', ephemeral: true });
  }
};