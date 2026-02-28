import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, User } from 'discord.js';
import { Command } from '../types';
import { ModerationBot } from '../ModerationBot';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Days of message history to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    permissions: [PermissionFlagsBits.BanMembers],

    async execute(interaction: ChatInputCommandInteraction, bot: ModerationBot): Promise<void> {
        const targetUser = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteDays = interaction.options.getInteger('days') || 0;

        // Cannot ban yourself
        if (targetUser.id === interaction.user.id) {
            await interaction.reply({
                content: '❌ You cannot ban yourself!',
                ephemeral: true
            });
            return;
        }

        // Cannot ban the bot
        if (targetUser.id === bot.client.user?.id) {
            await interaction.reply({
                content: '❌ You cannot ban me!',
                ephemeral: true
            });
            return;
        }

        const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

        // Check if target is moderatable
        if (member) {
            if (!member.bannable) {
                await interaction.reply({
                    content: '❌ I cannot ban this user. They may have higher permissions than me.',
                    ephemeral: true
                });
                return;
            }

            // Check role hierarchy
            if (interaction.member && 'roles' in interaction.member) {
                const executorMember = await interaction.guild?.members.fetch(interaction.user.id);
                const executorHighestRole = executorMember?.roles.highest;
                const targetHighestRole = member.roles.highest;
                
                if (targetHighestRole.position >= executorHighestRole!.position) {
                    await interaction.reply({
                        content: '❌ You cannot ban a user with equal or higher role than yours.',
                        ephemeral: true
                    });
                    return;
                }
            }
        }

        await interaction.deferReply();

        try {
            // DM the user
            const dmEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle(`🔨 You have been banned from ${interaction.guild?.name}`)
                .addFields(
                    { name: 'Reason', value: reason },
                    { name: 'Banned by', value: interaction.user.tag }
                )
                .setTimestamp();

            try {
                await targetUser.send({ embeds: [dmEmbed] });
            } catch {
                // User has DMs disabled
            }

            // Ban the user
            await interaction.guild?.members.ban(targetUser, {
                deleteMessageSeconds: deleteDays * 86400,
                reason: `${interaction.user.tag}: ${reason}`
            });

            // Log to database
            await bot.db.logAction('ban', targetUser.id, interaction.guildId!, interaction.user.id, reason);

            // Log to mod log channel
            await logToModChannel(bot, interaction, targetUser, reason, 'ban');

            // Reply
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🔨 User Banned')
                .setDescription(`${targetUser.tag} has been banned.`)
                .addFields(
                    { name: 'User ID', value: targetUser.id, inline: true },
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Messages Deleted', value: `${deleteDays} days`, inline: true }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Ban error:', error);
            await interaction.editReply({
                content: '❌ An error occurred while trying to ban the user.'
            });
        }
    }
};

async function logToModChannel(
    bot: ModerationBot,
    interaction: ChatInputCommandInteraction,
    target: User,
    reason: string,
    action: string
): Promise<void> {
    const logChannelId = await bot.db.getModLogChannel(interaction.guildId!);
    if (!logChannelId) return;

    const logChannel = await interaction.guild?.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel?.isTextBased()) return;

    const embed = new EmbedBuilder()
        .setColor(action === 'ban' ? 0xFF0000 : 0xFFA500)
        .setTitle(`🔨 User ${action === 'ban' ? 'Banned' : 'Action'}`)
        .addFields(
            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
            { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
            { name: 'Reason', value: reason }
        )
        .setTimestamp();

    await logChannel.send({ embeds: [embed] });
}

export default command;