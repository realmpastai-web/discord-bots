import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionResolvable } from 'discord.js';
import { ModerationBot } from '../ModerationBot';

export interface Command {
    data: SlashCommandBuilder;
    permissions?: PermissionResolvable[];
    execute: (interaction: ChatInputCommandInteraction, bot: ModerationBot) => Promise<void>;
}