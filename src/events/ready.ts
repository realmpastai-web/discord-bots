import { Events, Client } from 'discord.js';
import { ModerationBot } from '../ModerationBot';
import { REST, Routes } from 'discord.js';
import { config } from '../config';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client, bot: ModerationBot): Promise<void> {
        console.log(`✅ Logged in as ${client.user?.tag}`);
        console.log(`🤖 Bot is in ${client.guilds.cache.size} guild(s)`);

        // Register slash commands
        try {
            const rest = new REST({ version: '10' }).setToken(config.discord.token);
            const commands = bot.commands.map(cmd => cmd.data.toJSON());

            console.log(`📤 Registering ${commands.length} slash commands...`);

            if (config.discord.guildId) {
                // Register commands to specific guild (faster for development)
                await rest.put(
                    Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
                    { body: commands }
                );
                console.log(`✅ Registered commands to guild: ${config.discord.guildId}`);
            } else {
                // Register commands globally (takes up to 1 hour to propagate)
                await rest.put(
                    Routes.applicationCommands(config.discord.clientId),
                    { body: commands }
                );
                console.log('✅ Registered commands globally');
            }
        } catch (error) {
            console.error('❌ Error registering commands:', error);
        }
    }
};