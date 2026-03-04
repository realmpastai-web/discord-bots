const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('note')
    .setDescription('Add an internal note to this ticket')
    .addStringOption(option =>
      option.setName('content')
        .setDescription('Note content')
        .setRequired(true)),

  async execute(interaction, client) {
    const ticket = client.db.getTicketByChannel(interaction.channel.id);
    
    if (!ticket) {
      return interaction.reply({
        content: '❌ This is not a ticket channel.',
        ephemeral: true
      });
    }

    const isSupport = client.db.isSupportMember(interaction.guild.id, interaction.user.id);
    if (!isSupport) {
      return interaction.reply({
        content: '❌ Only support team members can add notes.',
        ephemeral: true
      });
    }

    const content = interaction.options.getString('content');
    client.db.addNote(ticket.id, interaction.user.id, content);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📝 Internal Note')
      .setDescription(content)
      .setFooter({ text: `Added by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });
    await interaction.reply({ content: '✅ Note added!', ephemeral: true });
  }
};