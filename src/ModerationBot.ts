import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { Command } from './types';
import { DatabaseService } from './services/DatabaseService';
import { AutoModService } from './services/AutoModService';
import { config } from './config';
import * as fs from 'fs';
import * as path from 'path';

export class ModerationBot {
    public client: Client;
    public commands: Collection<string, Command> = new Collection();
    public db: DatabaseService;
    public autoMod: AutoModService;

    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildModeration
            ]
        });

        this.db = new DatabaseService();
        this.autoMod = new AutoModService(this);
    }

    async start(): Promise<void> {
        await this.db.init();
        await this.loadCommands();
        await this.loadEvents();
        
        await this.client.login(config.discord.token);
    }

    private async loadCommands(): Promise<void> {
        const commandsPath = path.join(__dirname, 'commands');
        
        if (!fs.existsSync(commandsPath)) {
            console.warn('Commands directory not found');
            return;
        }

        const commandFiles = fs.readdirSync(commandsPath)
            .filter(file => file.endsWith('.js') || file.endsWith('.ts'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const commandModule = await import(filePath);
            const command: Command = commandModule.default || commandModule;

            if (command?.data?.name) {
                this.commands.set(command.data.name, command);
                console.log(`✅ Loaded command: ${command.data.name}`);
            } else {
                console.warn(`⚠️ Command ${file} is missing required properties`);
            }
        }

        console.log(`📋 Loaded ${this.commands.size} commands`);
    }

    private async loadEvents(): Promise<void> {
        const eventsPath = path.join(__dirname, 'events');
        
        if (!fs.existsSync(eventsPath)) {
            console.warn('Events directory not found');
            return;
        }

        const eventFiles = fs.readdirSync(eventsPath)
            .filter(file => file.endsWith('.js') || file.endsWith('.ts'));

        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            const eventModule = await import(filePath);
            const event = eventModule.default || eventModule;

            if (event.once) {
                this.client.once(event.name, (...args) => event.execute(...args, this));
            } else {
                this.client.on(event.name, (...args) => event.execute(...args, this));
            }
            
            console.log(`📡 Loaded event: ${event.name}`);
        }
    }
}