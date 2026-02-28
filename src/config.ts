export interface Config {
    discord: {
        token: string;
        clientId: string;
        guildId?: string;
    };
    database: {
        path: string;
    };
    modLogChannel?: string;
    nodeEnv: string;
}

export const config: Config = {
    discord: {
        token: process.env.DISCORD_TOKEN || '',
        clientId: process.env.CLIENT_ID || '',
        guildId: process.env.GUILD_ID
    },
    database: {
        path: process.env.DATABASE_PATH || './data/moderation.db'
    },
    modLogChannel: process.env.MOD_LOG_CHANNEL,
    nodeEnv: process.env.NODE_ENV || 'development'
};

if (!config.discord.token) {
    throw new Error('DISCORD_TOKEN is required');
}

if (!config.discord.clientId) {
    throw new Error('CLIENT_ID is required');
}