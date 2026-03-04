const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-team')
    .setDescription('Manage support team members')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand.setName('add')
        .setDescription('Add a support team member')
        .addUserOption(option => option.setName('user').setDescription('User to add').setRequired(true))
        .addStringOption(option =>
          option.setName('role')
            .setDescription('Team role')
            .addChoices(
              { name: 'Agent', value: 'agent' },
              { name: 'Manager', value: 'manager' }
            )))
    .addSubcommand(subcommand =>
      subcommand.setName('remove')
        .setDescription('Remove a support team member')
        .addUserOption(option => option.setName('user').setDescription('User to remove').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List all support team members')),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      const user = interaction.options.getUser('user');
      const role = interaction.options.getString('role') || 'agent';

      client.db.addSupportMember(interaction.guild.id, user.id, role, interaction.user.id);

      await interaction.reply({
        content: `✅ Added ${user.tag} as a support ${role}.`,
        ephemeral: true
      });

    } else if (subcommand === 'remove') {
      const user = interaction.options.getUser('user');
      client.db.removeSupportMember(interaction.guild.id, user.id);

      await interaction.reply({
        content: `✅ Removed ${user.tag} from the support team.`,
        ephemeral: true
      });

    } else if (subcommand === 'list') {
      const team = client.db.getSupportTeam(interaction.guild.id);

      if (team.length === 0) {
        return interaction.reply({
          content: '❌ No support team members configured.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('👥 Support Team')
        .setDescription(team.map(m => `<@${m.user_id}> - **${m.role}**`).join('\n'));

      await interaction.reply({ embeds: [embed] });
    }
  }
};