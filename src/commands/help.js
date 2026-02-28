const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const EmbedUtil = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display all available commands and bot information')
    .addStringOption(option =>
      option.setName('command')
        .setDescription('Get detailed info about a specific command')
        .setRequired(false)),

  async execute(interaction, client) {
    const commandName = interaction.options.getString('command');
    const config = require('../config');

    if (commandName) {
      // Show detailed info for a specific command
      const command = client.commands.get(commandName.toLowerCase());
      
      if (!command) {
        return interaction.reply({ 
          embeds: [EmbedUtil.error('Command Not Found', `No command found with name "${commandName}".`)],
          ephemeral: true 
        });
      }

      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`Command: /${command.data.name}`)
        .setDescription(command.data.description)
        .setTimestamp();

      // Add options info if any
      if (command.data.options?.length > 0) {
        const optionsText = command.data.options.map(opt => {
          const required = opt.required ? '(required)' : '(optional)';
          return `• **${opt.name}** ${required} - ${opt.description}`;
        }).join('\n');
        
        embed.addFields({ name: 'Options', value: optionsText });
      }

      // Add permissions info
      const defaultPerms = command.data.default_member_permissions;
      if (defaultPerms) {
        embed.addFields({ name: 'Required Permissions', value: 'Moderator permissions required' });
      } else {
        embed.addFields({ name: 'Required Permissions', value: 'None - Everyone can use this command' });
      }

      await interaction.reply({ embeds: [embed] });

    } else {
      // Show all commands
      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle('🛡️ QuantBit Moderation Bot - Help')
        .setDescription('A professional Discord moderation bot with comprehensive tools for server management.')
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          {
            name: '🛠️ Moderation Commands',
            value: [
              '`/kick` - Kick a member from the server',
              '`/ban` - Ban a member from the server',
              '`/timeout` - Temporarily timeout a member',
              '`/warn` - Issue a warning to a member',
              '`/warnings` - View or manage user warnings',
              '`/purge` - Delete multiple messages at once',
              '`/lock` - Lock a channel',
              '`/unlock` - Unlock a channel'
            ].join('\n')
          },
          {
            name: 'ℹ️ General Commands',
            value: [
              '`/help` - Display this help message',
              '`/ping` - Check bot latency and status'
            ].join('\n')
          },
          {
            name: '⚙️ Features',
            value: [
              '• SQLite database for persistent warning storage',
              '• Automatic moderation logging',
              '• Auto-timeout after reaching warning threshold',
              '• DM notifications to users',
              '• Permission checks and hierarchy validation'
            ].join('\n')
          }
        )
        .setFooter({ text: 'Use /help [command] for detailed info about a specific command' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  }
};
