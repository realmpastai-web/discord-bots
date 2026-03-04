const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('priority')
    .setDescription('Set ticket priority')
    .addStringOption(option =>
      option.setName('level')
        .setDescription('Priority level')
        .setRequired(true)
        .addChoices(
          { name: '🔴 Critical', value: 'critical' },
          { name: '🟠 High', value: 'high' },
          { name: '🟡 Medium', value: 'medium' },
          { name: '🟢 Low', value: 'low' }
        )),

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
        content: '❌ Only support team members can change priority.',
        ephemeral: true
      });
    }

    const priority = interaction.options.getString('level');
    client.db.setPriority(interaction.channel.id, priority);

    const priorityEmojis = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };

    const embed = new EmbedBuilder()
      .setColor(priority === 'critical' ? 0xED4245 : priority === 'high' ? 0xFEE75C : priority === 'medium' ? 0xEB459E : 0x57F287)
      .setDescription(`${priorityEmojis[priority]} Priority set to **${priority.toUpperCase()}** by <@${interaction.user.id}>`);

    await interaction.channel.send({ embeds: [embed] });
    await interaction.reply({ content: '✅ Priority updated!', ephemeral: true });
  }
};