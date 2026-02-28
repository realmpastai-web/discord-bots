import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionResolvable, SlashCommandOptionsOnlyBuilder } from 'discord.js';
import { ModerationBot } from './ModerationBot';

export interface Command {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
    permissions?: PermissionResolvable[];
    execute: (interaction: ChatInputCommandInteraction, bot: ModerationBot) => Promise<void>;
}