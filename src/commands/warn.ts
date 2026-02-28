import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { ModerationBot } from '../ModerationBot';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Issue a warning to a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    permissions: [PermissionFlagsBits.KickMembers],

    async execute(interaction: ChatInputCommandInteraction, bot: ModerationBot): Promise<void> {
        const targetUser = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (targetUser.id === interaction.user.id) {
            await interaction.reply({
                content: '❌ You cannot warn yourself!',
                ephemeral: true
            });
            return;
        }

        if (targetUser.id === bot.client.user?.id) {
            await interaction.reply({
                content: '❌ You cannot warn me!',
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

        if (interaction.member && 'roles' in interaction.member) {
            const executorHighestRole = interaction.member.roles.highest;
            const targetHighestRole = member.roles.highest;
            
            if (targetHighestRole.position >= executorHighestRole.position) {
                await interaction.reply({
                    content: '❌ You cannot warn a user with equal or higher role than yours.',
                    ephemeral: true
                });
                return;
            }
        }

        await interaction.deferReply();

        try {
            // Add warning to database
            const warningId = bot.db.addWarning(
                targetUser.id,
                interaction.guildId!,
                interaction.user.id,
                reason
            );

            // Log action
            bot.db.logAction('warn', targetUser.id, interaction.guildId!, interaction.user.id, reason);

            // Get warning count
            const warningCount = bot.db.getWarningCount(targetUser.id, interaction.guildId!);

            // DM the user
            const dmEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle(`⚠️ You have been warned in ${interaction.guild?.name}`)
                .addFields(
                    { name: 'Reason', value: reason },
                    { name: 'Warned by', value: interaction.user.tag },
                    { name: 'Total Warnings', value: `${warningCount}` }
                )
                .setTimestamp();

            try {
                await targetUser.send({ embeds: [dmEmbed] });
            } catch {
                // DMs disabled
            }

            await logToModChannel(bot, interaction, targetUser, reason, warningCount);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('⚠️ User Warned')
                .setDescription(`${targetUser.tag} has been warned.`)
                .addFields(
                    { name: 'User ID', value: targetUser.id, inline: true },
                    { name: 'Warning #', value: `${warningCount}`, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Warn error:', error);
            await interaction.editReply({
                content: '❌ An error occurred while trying to warn the user.'
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
    const logChannelId = bot.db.getModLogChannel(interaction.guildId!);
    if (!logChannelId) return;

    const logChannel = await interaction.guild?.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel?.isTextBased()) return;

    const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('⚠️ User Warned')
        .addFields(
            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
            { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
            { name: 'Warning #', value: `${count}`, inline: true },
            { name: 'Reason', value: reason }
        )
        .setTimestamp();

    await logChannel.send({ embeds: [embed] });
}

export default command;