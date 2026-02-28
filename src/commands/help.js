const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands'),

  async execute(interaction) {
    const commands = [
      { name: '/ban', desc: 'Ban a user from the server', perm: 'Ban Members' },
      { name: '/kick', desc: 'Kick a user from the server', perm: 'Kick Members' },
      { name: '/timeout', desc: 'Temporarily mute a user', perm: 'Moderate Members' },
      { name: '/warn', desc: 'Issue a warning to a user', perm: 'Moderate Members' },
      { name: '/warnings', desc: 'View warnings for a user', perm: 'Moderate Members' },
      { name: '/clearwarns', desc: 'Clear all warnings for a user', perm: 'Moderate Members' },
      { name: '/purge', desc: 'Delete multiple messages', perm: 'Manage Messages' },
      { name: '/modsettings', desc: 'View bot configuration', perm: 'Moderate Members' },
      { name: '/help', desc: 'Show this help message', perm: 'Everyone' }
    ];

    const helpText = commands.map(cmd => 
      `**${cmd.name}** - ${cmd.desc}\n> Permission: \`${cmd.perm}\``
    ).join('\n\n');

    await interaction.reply({
      content: `# 🤖 QuantBit Moderation Bot\n\n${helpText}\n\n---\n*Auto-moderation features: Spam detection, banned word filtering*`,
      ephemeral: true
    });
  }
};
