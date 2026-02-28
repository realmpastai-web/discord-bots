const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const EmbedUtil = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a previously locked channel')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to unlock (defaults to current)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for unlocking')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Specific role to unlock (defaults to @everyone)')
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
      
      // Check if actually locked
      if (!currentPerms || !currentPerms.deny.has(PermissionFlagsBits.SendMessages)) {
        return interaction.reply({ 
          embeds: [EmbedUtil.warning('Not Locked', `${channel} is not currently locked for ${role.name}.`)],
          ephemeral: true 
        });
      }

      // Unlock the channel - restore default
      await channel.permissionOverwrites.edit(role, {
        SendMessages: null
      }, { reason: `${interaction.user.tag}: ${reason}` });

      // Log to database
      await client.db.addModLog('UNLOCK', channel.id, interaction.guild.id, interaction.user.id, reason, role.id);

      // Send success message
      const embed = EmbedUtil.success('Channel Unlocked', `${channel} has been unlocked.`)
        .addFields(
          { name: 'Channel', value: `${channel} (${channel.id})`, inline: true },
          { name: 'Role', value: role.name, inline: true },
          { name: 'Reason', value: reason },
          { name: 'Unlocked By', value: interaction.user.tag, inline: true }
        );

      await interaction.reply({ embeds: [embed] });

      // Send notification to the unlocked channel
      const unlockEmbed = EmbedUtil.success('🔓 Channel Unlocked', 'This channel has been unlocked.')
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Unlocked By', value: interaction.user.tag }
        );

      await channel.send({ embeds: [unlockEmbed] });

      // Send to mod log channel if configured
      if (client.config.modLogChannelId) {
        const logChannel = interaction.guild.channels.cache.get(client.config.modLogChannelId);
        if (logChannel) {
          await logChannel.send({ 
            embeds: [EmbedUtil.modLog('CHANNEL_UNLOCK', interaction.user, { tag: channel.name, id: channel.id }, reason)] 
          });
        }
      }

    } catch (error) {
      console.error('Unlock error:', error);
      await interaction.reply({ 
        embeds: [EmbedUtil.error('Error', 'An error occurred while trying to unlock the channel.')],
        ephemeral: true 
      });
    }
  }
};
