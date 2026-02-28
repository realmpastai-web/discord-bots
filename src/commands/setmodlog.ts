import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, ChannelType } from 'discord.js';
import { Command } from '../types';
import { ModerationBot } from '../ModerationBot';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('setmodlog')
        .setDescription('Set the moderation log channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel for moderation logs')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    permissions: [PermissionFlagsBits.Administrator],

    async execute(interaction: ChatInputCommandInteraction, bot: ModerationBot): Promise<void> {
        const channel = interaction.options.getChannel('channel', true);

        if (channel.type !== ChannelType.GuildText) {
            await interaction.reply({
                content: '❌ Please select a text channel.',
                ephemeral: true
            });
            return;
        }

        try {
            bot.db.setModLogChannel(interaction.guildId!, channel.id);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Moderation Log Channel Set')
                .setDescription(`Moderation actions will now be logged to <#${channel.id}>`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Set mod log error:', error);
            await interaction.reply({
                content: '❌ An error occurred while setting the moderation log channel.',
                ephemeral: true
            });
        }
    }
};

export default command;