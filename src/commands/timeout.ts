import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { ModerationBot } from '../ModerationBot';

const DURATION_MAP: Record<string, number> = {
    '60s': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '10m': 10 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '28d': 28 * 24 * 60 * 60 * 1000
};

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user (mute them temporarily)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Timeout duration')
                .setRequired(true)
                .addChoices(
                    { name: '60 seconds', value: '60s' },
                    { name: '5 minutes', value: '5m' },
                    { name: '10 minutes', value: '10m' },
                    { name: '1 hour', value: '1h' },
                    { name: '6 hours', value: '6h' },
                    { name: '12 hours', value: '12h' },
                    { name: '1 day', value: '1d' },
                    { name: '3 days', value: '3d' },
                    { name: '7 days', value: '7d' },
                    { name: '28 days (max)', value: '28d' }
                ))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    permissions: [PermissionFlagsBits.ModerateMembers],

    async execute(interaction: ChatInputCommandInteraction, bot: ModerationBot): Promise<void> {
        const targetUser = interaction.options.getUser('user', true);
        const durationStr = interaction.options.getString('duration', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (targetUser.id === interaction.user.id) {
            await interaction.reply({
                content: '❌ You cannot timeout yourself!',
                ephemeral: true
            });
            return;
        }

        if (targetUser.id === bot.client.user?.id) {
            await interaction.reply({
                content: '❌ You cannot timeout me!',
                ephemeral: true
            });
            return;
        }

        const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            await interaction.reply({
                content: '❌ That user is not in this server.',
                ephemeral: true
            });
            return;
        }

        if (!member.moderatable) {
            await interaction.reply({
                content: '❌ I cannot timeout this user. They may have higher permissions than me.',
                ephemeral: true
            });
            return;
        }

        if (interaction.member && 'roles' in interaction.member) {
            const executorHighestRole = interaction.member.roles.highest;
            const targetHighestRole = member.roles.highest;
            
            if (targetHighestRole.position >= executorHighestRole.position) {
                await interaction.reply({
                    content: '❌ You cannot timeout a user with equal or higher role than yours.',
                    ephemeral: true
                });
                return;
            }
        }

        await interaction.deferReply();

        try {
            const durationMs = DURATION_MAP[durationStr];
            const timeoutUntil = new Date(Date.now() + durationMs);

            await member.timeout(durationMs, `${interaction.user.tag}: ${reason}`);

            bot.db.logAction('timeout', targetUser.id, interaction.guildId!, interaction.user.id, reason, durationStr);

            await logToModChannel(bot, interaction, targetUser, reason, durationStr);

            const durationDisplay = durationStr
                .replace('s', ' seconds')
                .replace('m', ' minutes')
                .replace('h', ' hours')
                .replace('d', ' days');

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🔇 User Timed Out')
                .setDescription(`${targetUser.tag} has been timed out.`)
                .addFields(
                    { name: 'User ID', value: targetUser.id, inline: true },
                    { name: 'Duration', value: durationDisplay, inline: true },
                    { name: 'Expires', value: `<t:${Math.floor(timeoutUntil.getTime() / 1000)}:R>`, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Timeout error:', error);
            await interaction.editReply({
                content: '❌ An error occurred while trying to timeout the user.'
            });
        }
    }
};

async function logToModChannel(
    bot: ModerationBot,
    interaction: ChatInputCommandInteraction,
    target: any,
    reason: string,
    duration: string
): Promise<void> {
    const logChannelId = bot.db.getModLogChannel(interaction.guildId!);
    if (!logChannelId) return;

    const logChannel = await interaction.guild?.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel?.isTextBased()) return;

    const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('🔇 User Timed Out')
        .addFields(
            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
            { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
            { name: 'Duration', value: duration, inline: true },
            { name: 'Reason', value: reason }
        )
        .setTimestamp();

    await logChannel.send({ embeds: [embed] });
}

export default command;