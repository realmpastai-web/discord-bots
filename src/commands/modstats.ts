import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { ModerationBot } from '../ModerationBot';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('modstats')
        .setDescription('View moderation statistics for this server')
        .addStringOption(option =>
            option.setName('period')
                .setDescription('Time period for statistics')
                .setRequired(false)
                .addChoices(
                    { name: 'All Time', value: 'all' },
                    { name: 'Last 24 Hours', value: 'day' },
                    { name: 'Last 7 Days', value: 'week' },
                    { name: 'Last 30 Days', value: 'month' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    permissions: [PermissionFlagsBits.KickMembers],

    async execute(interaction: ChatInputCommandInteraction, bot: ModerationBot): Promise<void> {
        const period = interaction.options.getString('period') || 'all';

        await interaction.deferReply();

        try {
            let since: Date | undefined;
            const now = new Date();

            switch (period) {
                case 'day':
                    since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case 'week':
                    since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
            }

            const stats = bot.db.getModStats(interaction.guildId!, since);

            const periodLabel = {
                'all': 'All Time',
                'day': 'Last 24 Hours',
                'week': 'Last 7 Days',
                'month': 'Last 30 Days'
            }[period];

            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle(`📊 Moderation Statistics — ${periodLabel}`)
                .setDescription(`Statistics for ${interaction.guild?.name}`)
                .addFields(
                    { name: '🔨 Bans', value: `${stats.bans}`, inline: true },
                    { name: '👢 Kicks', value: `${stats.kicks}`, inline: true },
                    { name: '🔇 Timeouts', value: `${stats.timeouts}`, inline: true },
                    { name: '⚠️ Warnings', value: `${stats.warnings}`, inline: true },
                    { name: '📈 Total Actions', value: `${stats.bans + stats.kicks + stats.timeouts + stats.warnings}`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Mod stats error:', error);
            await interaction.editReply({
                content: '❌ An error occurred while fetching moderation statistics.'
            });
        }
    }
};

export default command;