import { Events, Message } from 'discord.js';
import { ModerationBot } from '../ModerationBot';

export default {
    name: Events.MessageCreate,
    async execute(message: Message, bot: ModerationBot): Promise<void> {
        // Run auto-moderation checks
        await bot.autoMod.checkMessage(message);
    }
};