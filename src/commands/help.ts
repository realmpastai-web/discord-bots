import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { ModerationBot } from '../ModerationBot';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show help information about the bot'),

    async execute(interaction: ChatInputCommandInteraction, bot: ModerationBot): Promise<void> {
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🛡️ QuantMod — Help')
            .setDescription('A professional Discord moderation bot')
            .addFields(
                {
                    name: '🔨 Moderation Commands',
                    value: [
                        '`/ban @user [reason] [days]` — Ban a user',
                        '`/kick @user [reason]` — Kick a user',
                        '`/timeout @user duration [reason]` — Timeout a user',
                        '`/warn @user [reason]` — Issue a warning',
                        '`/warnings @user` — View user warnings',
                        '`/clearwarns @user` — Clear all warnings'
                    ].join('\n')
                },
                {
                    name: '⚙️ Settings & Stats',
                    value: [
                        '`/setmodlog #channel` — Set mod log channel',
                        '`/modstats [period]` — View moderation stats'
                    ].join('\n')
                },
                {
                    name: '🤖 Auto-Moderation',
                    value: [
                        '• Banned word filter',
                        '• Spam detection (5 messages in 5 seconds)',
                        '• Mention spam protection (5+ mentions)'
                    ].join('\n')
                }
            )
            .setFooter({ text: 'Made by QuantBitRealm' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};

export default command;