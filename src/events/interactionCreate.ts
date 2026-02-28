import { Events, ChatInputCommandInteraction } from 'discord.js';
import { ModerationBot } from '../ModerationBot';

export default {
    name: Events.InteractionCreate,
    async execute(interaction: ChatInputCommandInteraction, bot: ModerationBot): Promise<void> {
        if (!interaction.isChatInputCommand()) return;

        const command = bot.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction, bot);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}:`, error);
            
            const errorMessage = '❌ There was an error while executing this command!';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
};