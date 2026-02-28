import { ModerationBot } from './ModerationBot';
import { config } from './config';

const bot = new ModerationBot();

bot.start().catch(error => {
    console.error('Failed to start bot:', error);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    bot.client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down gracefully...');
    bot.client.destroy();
    process.exit(0);
});