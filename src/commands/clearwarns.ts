import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { ModerationBot } from '../ModerationBot';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('clearwarns')
        .setDescription('Clear all warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to clear warnings for')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for clearing warnings')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    permissions: [PermissionFlagsBits.BanMembers],

    async execute(interaction: ChatInputCommandInteraction, bot: ModerationBot): Promise<void> {
        const targetUser = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';

        await interaction.deferReply();

        try {
            const warningCount = await bot.db.getWarningCount(targetUser.id, interaction.guildId!);

            if (warningCount === 0) {
                await interaction.editReply({
                    content: `❌ ${targetUser.tag} has no warnings to clear.`
                });
                return;
            }

            const clearedCount = await bot.db.clearWarnings(targetUser.id, interaction.guildId!);

            await bot.db.logAction('clearwarns', targetUser.id, interaction.guildId!, interaction.user.id, reason);

            await logToModChannel(bot, interaction, targetUser, reason, clearedCount);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🧹 Warnings Cleared')
                .setDescription(`${targetUser.tag}'s warnings have been cleared.`)
                .addFields(
                    { name: 'User ID', value: targetUser.id, inline: true },
                    { name: 'Warnings Cleared', value: `${clearedCount}`, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Clear warns error:', error);
            await interaction.editReply({
                content: '❌ An error occurred while clearing warnings.'
            });
        }
    }
};

async function logToModChannel(
    bot: ModerationBot,
    interaction: ChatInputCommandInteraction,
    target: any,
    reason: string,
    count: number
): Promise<void> {
    const logChannelId = await bot.db.getModLogChannel(interaction.guildId!);
    if (!logChannelId) return;

    const logChannel = await interaction.guild?.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel?.isTextBased()) return;

    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🧹 Warnings Cleared')
        .addFields(
            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
            { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
            { name: 'Count', value: `${count}`, inline: true },
            { name: 'Reason', value: reason }
        )
        .setTimestamp();

    await logChannel.send({ embeds: [embed] });
}

export default command;