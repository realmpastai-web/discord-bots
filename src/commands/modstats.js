const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../database/connection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modstats')
    .setDescription('View moderation statistics')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('View moderation stats for a specific user')
        .addUserOption(option =>
          option.setName('user').setDescription('The user to check').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('server')
        .setDescription('View server-wide moderation statistics')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('violations')
        .setDescription('View recent violations')
        .addIntegerOption(option =>
          option.setName('limit')
            .setDescription('Number of violations to show (5-50)')
            .setMinValue(5)
            .setMaxValue(50)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    switch (subcommand) {
      case 'user':
        await this.showUserStats(interaction, guildId);
        break;
      case 'server':
        await this.showServerStats(interaction, guildId);
        break;
      case 'violations':
        await this.showViolations(interaction, guildId);
        break;
    }
  },

  async showUserStats(interaction, guildId) {
    const target = interaction.options.getUser('user');

    // Get all violations for user
    const violations = db.prepare(`
      SELECT type, reason, action_taken, points, created_at
      FROM violations
      WHERE guild_id = ? AND user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(guildId, target.id);

    // Get summary counts
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN action_taken = 'warn' THEN 1 ELSE 0 END) as warns,
        SUM(CASE WHEN action_taken = 'mute' THEN 1 ELSE 0 END) as mutes,
        SUM(CASE WHEN action_taken = 'kick' THEN 1 ELSE 0 END) as kicks,
        SUM(CASE WHEN action_taken = 'ban' THEN 1 ELSE 0 END) as bans,
        SUM(points) as total_points
      FROM violations
      WHERE guild_id = ? AND user_id = ?
    `).get(guildId, target.id);

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`📊 Moderation Stats: ${target.tag}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Total Violations', value: String(summary?.total || 0), inline: true },
        { name: 'Warning Points', value: String(summary?.total_points || 0), inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: 'Warnings', value: String(summary?.warns || 0), inline: true },
        { name: 'Mutes', value: String(summary?.mutes || 0), inline: true },
        { name: 'Kicks', value: String(summary?.kicks || 0), inline: true },
        { name: 'Bans', value: String(summary?.bans || 0), inline: true }
      );

    if (violations.length > 0) {
      const recentViolations = violations.slice(0, 5).map(v => {
        const date = new Date(v.created_at).toLocaleDateString();
        return `**${date}** - ${v.type}: ${v.reason?.substring(0, 50) || 'No reason'}`;
      }).join('\n');
      
      embed.addFields({
        name: 'Recent Violations',
        value: recentViolations || 'None'
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  async showServerStats(interaction, guildId) {
    // Get server-wide stats
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_violations,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(CASE WHEN created_at > datetime('now', '-1 day') THEN 1 ELSE 0 END) as last_24h,
        SUM(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 ELSE 0 END) as last_7d
      FROM violations
      WHERE guild_id = ?
    `).get(guildId);

    const actionBreakdown = db.prepare(`
      SELECT action_taken, COUNT(*) as count
      FROM violations
      WHERE guild_id = ?
      GROUP BY action_taken
    `).all(guildId);

    const topViolators = db.prepare(`
      SELECT user_id, COUNT(*) as count, SUM(points) as points
      FROM violations
      WHERE guild_id = ?
      GROUP BY user_id
      ORDER BY count DESC
      LIMIT 5
    `).all(guildId);

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('📊 Server Moderation Statistics')
      .addFields(
        { name: 'Total Violations', value: String(stats?.total_violations || 0), inline: true },
        { name: 'Unique Users', value: String(stats?.unique_users || 0), inline: true },
        { name: 'Last 24 Hours', value: String(stats?.last_24h || 0), inline: true },
        { name: 'Last 7 Days', value: String(stats?.last_7d || 0), inline: true }
      );

    if (actionBreakdown.length > 0) {
      const breakdownText = actionBreakdown.map(a => 
        `${a.action_taken}: ${a.count}`
      ).join('\n');
      embed.addFields({
        name: 'Action Breakdown',
        value: breakdownText,
        inline: true
      });
    }

    if (topViolators.length > 0) {
      const violatorsText = await Promise.all(topViolators.map(async (v, i) => {
        try {
          const user = await interaction.client.users.fetch(v.user_id);
          return `${i + 1}. ${user.tag}: ${v.count} violations (${v.points} points)`;
        } catch {
          return `${i + 1}. Unknown User: ${v.count} violations`;
        }
      }));
      
      embed.addFields({
        name: 'Top Violators',
        value: violatorsText.join('\n') || 'None'
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  async showViolations(interaction, guildId) {
    const limit = interaction.options.getInteger('limit') || 10;

    const violations = db.prepare(`
      SELECT v.*, u.tag as moderator_tag
      FROM violations v
      LEFT JOIN users u ON v.moderator_id = u.id
      WHERE v.guild_id = ?
      ORDER BY v.created_at DESC
      LIMIT ?
    `).all(guildId, limit);

    if (violations.length === 0) {
      return interaction.reply({
        content: '✅ No violations recorded for this server.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle(`📋 Recent Violations (Last ${violations.length})`);

    const violationList = await Promise.all(violations.map(async (v) => {
      try {
        const user = await interaction.client.users.fetch(v.user_id);
        const date = new Date(v.created_at).toLocaleDateString();
        return `**${date}** | ${user.tag}\nType: ${v.type} | Action: ${v.action_taken}`;
      } catch {
        return `**${v.created_at}** | Unknown User\nType: ${v.type}`;
      }
    }));

    embed.setDescription(violationList.join('\n\n'));

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};