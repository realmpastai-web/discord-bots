const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(option =>
      option.setName('userid').setDescription('The user ID to unban').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for unbanning').setRequired(false)
    ),

  async execute(interaction) {
    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guildId = interaction.guild.id;

    try {
      // Check if user is actually banned
      const banList = await interaction.guild.bans.fetch();
      const bannedUser = banList.find(ban => ban.user.id === userId);

      if (!bannedUser) {
        return interaction.reply({ 
          content: '❌ This user is not banned.', 
          ephemeral: true 
        });
      }

      await interaction.guild.members.unban(userId, reason);

      // Remove from database
      db.prepare('DELETE FROM bans WHERE guild_id = ? AND user_id = ?').run(guildId, userId);

      // Log to mod channel
      const settings = db.prepare('SELECT log_channel_id FROM guild_settings WHERE guild_id = ?').get(guildId);
      if (settings?.log_channel_id) {
        const channel = interaction.guild.channels.cache.get(settings.log_channel_id);
        if (channel) {
          await channel.send({
            embeds: [{
              color: 0x00FF00,
              title: '🔓 User Unbanned',
              description: `**User:** ${bannedUser.user.tag} (${userId})\n**Reason:** ${reason}`,
              footer: { text: `Unbanned by ${interaction.user.tag}` },
              timestamp: new Date().toISOString()
            }]
          });
        }
      }

      await interaction.reply({
        content: `✅ ${bannedUser.user.tag} has been unbanned.`,
        ephemeral: true
      });

    } catch (error) {
      await interaction.reply({
        content: `❌ Failed to unban user: ${error.message}`,
        ephemeral: true
      });
    }
  }
};