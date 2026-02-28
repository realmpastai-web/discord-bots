const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const EmbedUtil = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel to prevent members from sending messages')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to lock (defaults to current)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for locking')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Specific role to lock out (defaults to @everyone)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const role = interaction.options.getRole('role') || interaction.guild.roles.everyone;

    // Check if channel is a text channel
    if (channel.type !== ChannelType.GuildText) {
      return interaction.reply({ 
        embeds: [EmbedUtil.error('Invalid Channel', 'This command only works on text channels.')],
        ephemeral: true 
      });
    }

    try {
      // Get current permissions
      const currentPerms = channel.permissionOverwrites.cache.get(role.id);
      
      // Check if already locked
      if (currentPerms && !currentPerms.allow.has(PermissionFlagsBits.SendMessages) && 
          currentPerms.deny.has(PermissionFlagsBits.SendMessages)) {
        return interaction.reply({ 
          embeds: [EmbedUtil.warning('Already Locked', `${channel} is already locked for ${role.name}.`)],
          ephemeral: true 
        });
      }

      // Lock the channel
      await channel.permissionOverwrites.edit(role, {
        SendMessages: false
      }, { reason: `${interaction.user.tag}: ${reason}` });

      // Log to database
      await client.db.addModLog('LOCK', channel.id, interaction.guild.id, interaction.user.id, reason, role.id);

      // Send success message
      const embed = EmbedUtil.success('Channel Locked', `${channel} has been locked.`)
        .addFields(
          { name: 'Channel', value: `${channel} (${channel.id})`, inline: true },
          { name: 'Role', value: role.name, inline: true },
          { name: 'Reason', value: reason },
          { name: 'Locked By', value: interaction.user.tag, inline: true }
        );

      await interaction.reply({ embeds: [embed] });

      // Send notification to the locked channel
      const lockEmbed = EmbedUtil.warning('🔒 Channel Locked', 'This channel has been locked.')
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Locked By', value: interaction.user.tag }
        );

      await channel.send({ embeds: [lockEmbed] });

      // Send to mod log channel if configured
      if (client.config.modLogChannelId) {
        const logChannel = interaction.guild.channels.cache.get(client.config.modLogChannelId);
        if (logChannel) {
          await logChannel.send({ 
            embeds: [EmbedUtil.modLog('CHANNEL_LOCK', interaction.user, { tag: channel.name, id: channel.id }, reason)] 
          });
        }
      }

    } catch (error) {
      console.error('Lock error:', error);
      await interaction.reply({ 
        embeds: [EmbedUtil.error('Error', 'An error occurred while trying to lock the channel.')],
        ephemeral: true 
      });
    }
  }
};
