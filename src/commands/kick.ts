import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { ModerationBot } from '../ModerationBot';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    permissions: [PermissionFlagsBits.KickMembers],

    async execute(interaction: ChatInputCommandInteraction, bot: ModerationBot): Promise<void> {
        const targetUser = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (targetUser.id === interaction.user.id) {
            await interaction.reply({
                content: '❌ You cannot kick yourself!',
                ephemeral: true
            });
            return;
        }

        if (targetUser.id === bot.client.user?.id) {
            await interaction.reply({
                content: '❌ You cannot kick me!',
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

        if (!member.kickable) {
            await interaction.reply({
                content: '❌ I cannot kick this user. They may have higher permissions than me.',
                ephemeral: true
            });
            return;
        }

        if (interaction.member && 'roles' in interaction.member) {
            const executorHighestRole = interaction.member.roles.highest;
            const targetHighestRole = member.roles.highest;
            
            if (targetHighestRole.position >= executorHighestRole.position) {
                await interaction.reply({
                    content: '❌ You cannot kick a user with equal or higher role than yours.',
                    ephemeral: true
                });
                return;
            }
        }

        await interaction.deferReply();

        try {
            const dmEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle(`👢 You have been kicked from ${interaction.guild?.name}`)
                .addFields(
                    { name: 'Reason', value: reason },
                    { name: 'Kicked by', value: interaction.user.tag }
                )
                .setTimestamp();

            try {
                await targetUser.send({ embeds: [dmEmbed] });
            } catch {
                // DMs disabled
            }

            await member.kick(`${interaction.user.tag}: ${reason}`);

            bot.db.logAction('kick', targetUser.id, interaction.guildId!, interaction.user.id, reason);

            await logToModChannel(bot, interaction, targetUser, reason, 'kick');

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('👢 User Kicked')
                .setDescription(`${targetUser.tag} has been kicked.`)
                .addFields(
                    { name: 'User ID', value: targetUser.id, inline: true },
                    { name: 'Reason', value: reason, inline: true }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Kick error:', error);
            await interaction.editReply({
                content: '❌ An error occurred while trying to kick the user.'
            });
        }
    }
};

async function logToModChannel(
    bot: ModerationBot,
    interaction: ChatInputCommandInteraction,
    target: any,
    reason: string,
    action: string
): Promise<void> {
    const logChannelId = bot.db.getModLogChannel(interaction.guildId!);
    if (!logChannelId) return;

    const logChannel = await interaction.guild?.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel?.isTextBased()) return;

    const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('👢 User Kicked')
        .addFields(
            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
            { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
            { name: 'Reason', value: reason }
        )
        .setTimestamp();

    await logChannel.send({ embeds: [embed] });
}

export default command;