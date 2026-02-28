const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedUtil = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View or manage user warnings')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View warnings for a user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to check')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('clear')
        .setDescription('Clear all warnings for a user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to clear warnings for')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for clearing warnings')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a specific warning')
        .addIntegerOption(option =>
          option.setName('id')
            .setDescription('The warning ID to remove')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for removing the warning')
            .setRequired(false)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'view') {
      const target = interaction.options.getUser('user');
      
      try {
        const warnings = await client.db.getWarnings(target.id, interaction.guild.id);
        
        if (warnings.length === 0) {
          return interaction.reply({ 
            embeds: [EmbedUtil.info('No Warnings', `${target.tag} has no warnings on record.`)]
          });
        }

        const embed = EmbedUtil.info('User Warnings', `Warnings for ${target.tag}`)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .addFields({ name: 'Total Warnings', value: `${warnings.length}`, inline: true });

        // Show up to 10 most recent warnings
        const recentWarnings = warnings.slice(0, 10);
        const warningList = recentWarnings.map((w, i) => 
          `**#${w.id}** • <t:${Math.floor(new Date(w.created_at).getTime() / 1000)}:R>\n` +
          `By: <@${w.moderator_id}>\n` +
          `Reason: ${w.reason}`
        ).join('\n\n');

        embed.setDescription(`**Warnings for ${target.tag}**\n\n${warningList}`);

        if (warnings.length > 10) {
          embed.setFooter({ text: `Showing 10 of ${warnings.length} warnings. Use warning IDs to manage specific entries.` });
        }

        await interaction.reply({ embeds: [embed] });

      } catch (error) {
        console.error('View warnings error:', error);
        await interaction.reply({ 
          embeds: [EmbedUtil.error('Error', 'An error occurred while fetching warnings.')],
          ephemeral: true 
        });
      }

    } else if (subcommand === 'clear') {
      // Check for manage server permission for clearing
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ 
          embeds: [EmbedUtil.error('Permission Denied', 'You need Manage Server permission to clear all warnings.')],
          ephemeral: true 
        });
      }

      const target = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      try {
        const clearedCount = await client.db.clearWarnings(target.id, interaction.guild.id);
        
        if (clearedCount === 0) {
          return interaction.reply({ 
            embeds: [EmbedUtil.info('No Warnings', `${target.tag} had no warnings to clear.`)],
            ephemeral: true 
          });
        }

        await client.db.addModLog('WARNINGS_CLEAR', target.id, interaction.guild.id, interaction.user.id, reason);

        const embed = EmbedUtil.success('Warnings Cleared', `Cleared ${clearedCount} warning(s) for ${target.tag}.`)
          .addFields(
            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
            { name: 'Cleared By', value: interaction.user.tag, inline: true },
            { name: 'Reason', value: reason }
          );

        await interaction.reply({ embeds: [embed] });

        // Send to mod log
        if (client.config.modLogChannelId) {
          const logChannel = interaction.guild.channels.cache.get(client.config.modLogChannelId);
          if (logChannel) {
            await logChannel.send({ 
              embeds: [EmbedUtil.modLog('WARNINGS_CLEAR', interaction.user, target, reason)] 
            });
          }
        }

      } catch (error) {
        console.error('Clear warnings error:', error);
        await interaction.reply({ 
          embeds: [EmbedUtil.error('Error', 'An error occurred while clearing warnings.')],
          ephemeral: true 
        });
      }

    } else if (subcommand === 'remove') {
      const warningId = interaction.options.getInteger('id');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      try {
        const result = await client.db.removeWarning(warningId);
        
        if (result === 0) {
          return interaction.reply({ 
            embeds: [EmbedUtil.error('Not Found', `Warning #${warningId} not found.`)],
            ephemeral: true 
          });
        }

        await client.db.addModLog('WARNING_REMOVE', 'N/A', interaction.guild.id, interaction.user.id, `Removed warning #${warningId}: ${reason}`);

        const embed = EmbedUtil.success('Warning Removed', `Warning #${warningId} has been removed.`)
          .addFields(
            { name: 'Removed By', value: interaction.user.tag, inline: true },
            { name: 'Reason', value: reason, inline: true }
          );

        await interaction.reply({ embeds: [embed] });

      } catch (error) {
        console.error('Remove warning error:', error);
        await interaction.reply({ 
          embeds: [EmbedUtil.error('Error', 'An error occurred while removing the warning.')],
          ephemeral: true 
        });
      }
    }
  }
};
