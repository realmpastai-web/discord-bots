import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { ModerationBot } from '../ModerationBot';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check warnings for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    permissions: [PermissionFlagsBits.KickMembers],

    async execute(interaction: ChatInputCommandInteraction, bot: ModerationBot): Promise<void> {
        const targetUser = interaction.options.getUser('user', true);

        await interaction.deferReply();

        try {
            const warnings = bot.db.getWarnings(targetUser.id, interaction.guildId!);

            if (warnings.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Clean Record')
                    .setDescription(`${targetUser.tag} has no warnings.`)
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const warningList = warnings.map((w, i) => {
                const date = new Date(w.createdAt).toLocaleDateString();
                const reason = w.reason || 'No reason';
                return `**#${i + 1}** • ${date} • By <@${w.moderatorId}>\n└ ${reason}`;
            }).join('\n\n');

            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle(`⚠️ Warnings for ${targetUser.tag}`)
                .setDescription(warningList.substring(0, 4000))
                .addFields({ name: 'Total Warnings', value: `${warnings.length}`, inline: true })
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Warnings error:', error);
            await interaction.editReply({
                content: '❌ An error occurred while fetching warnings.'
            });
        }
    }
};

export default command;