import { Message, EmbedBuilder, TextChannel } from 'discord.js';
import { ModerationBot } from '../ModerationBot';

interface SpamCheck {
    count: number;
    firstMessage: number;
    lastMessage: number;
}

export class AutoModService {
    private bot: ModerationBot;
    private messageCache: Map<string, SpamCheck> = new Map();
    private readonly SPAM_WINDOW = 5000; // 5 seconds
    private readonly SPAM_THRESHOLD = 5; // messages per window
    private readonly MENTION_THRESHOLD = 5; // mentions per message

    // Default banned words (can be customized per guild)
    private defaultBannedWords = [
        'nigger', 'nigga', 'faggot', 'retard',
        'kill yourself', 'kys', 'die in a fire'
    ];

    constructor(bot: ModerationBot) {
        this.bot = bot;
        
        // Clean up old cache entries every minute
        setInterval(() => this.cleanupCache(), 60000);
    }

    async checkMessage(message: Message): Promise<boolean> {
        if (message.author.bot) return true;
        if (!message.guild) return true;

        // Check banned words
        if (await this.checkBannedWords(message)) {
            return false;
        }

        // Check spam
        if (await this.checkSpam(message)) {
            return false;
        }

        // Check mention spam
        if (await this.checkMentionSpam(message)) {
            return false;
        }

        return true;
    }

    private async checkBannedWords(message: Message): Promise<boolean> {
        const content = message.content.toLowerCase();
        
        // TODO: Load guild-specific banned words from database
        const bannedWords = this.defaultBannedWords;

        for (const word of bannedWords) {
            if (content.includes(word)) {
                await this.handleViolation(message, 'banned_word', `Used banned word`);
                return true;
            }
        }

        return false;
    }

    private async checkSpam(message: Message): Promise<boolean> {
        const userId = message.author.id;
        const now = Date.now();

        let check = this.messageCache.get(userId);
        
        if (!check || now - check.firstMessage > this.SPAM_WINDOW) {
            // Start new window
            check = {
                count: 1,
                firstMessage: now,
                lastMessage: now
            };
        } else {
            // Increment count
            check.count++;
            check.lastMessage = now;
        }

        this.messageCache.set(userId, check);

        if (check.count >= this.SPAM_THRESHOLD) {
            await this.handleViolation(message, 'spam', `Sent ${check.count} messages in ${this.SPAM_WINDOW / 1000} seconds`);
            this.messageCache.delete(userId);
            return true;
        }

        return false;
    }

    private async checkMentionSpam(message: Message): Promise<boolean> {
        const mentionCount = message.mentions.users.size + message.mentions.roles.size;

        if (mentionCount >= this.MENTION_THRESHOLD) {
            await this.handleViolation(message, 'mention_spam', `Mentioned ${mentionCount} users/roles`);
            return true;
        }

        return false;
    }

    private async handleViolation(
        message: Message,
        violationType: string,
        reason: string
    ): Promise<void> {
        try {
            // Delete the offending message
            await message.delete();

            // Warn the user
            if (message.guild) {
                await this.bot.db.addWarning(
                    message.author.id,
                    message.guild.id,
                    this.bot.client.user!.id,
                    `AutoMod: ${reason}`
                );

                await this.bot.db.logAction(
                    'automod',
                    message.author.id,
                    message.guild.id,
                    this.bot.client.user!.id,
                    `${violationType}: ${reason}`
                );
            }

            // Send warning to user
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('⚠️ Auto-Moderation Warning')
                .setDescription(`Your message was removed for: **${reason}**`)
                .setTimestamp();

            try {
                await message.author.send({ embeds: [embed] });
            } catch {
                // User has DMs disabled
            }

            // Log to mod log channel
            await this.logViolation(message, violationType, reason);

        } catch (error) {
            console.error('AutoMod error:', error);
        }
    }

    private async logViolation(message: Message, violationType: string, reason: string): Promise<void> {
        if (!message.guild) return;

        const logChannelId = await this.bot.db.getModLogChannel(message.guild.id);
        if (!logChannelId) return;

        const logChannel = await message.guild.channels.fetch(logChannelId).catch(() => null);
        if (!logChannel || !logChannel.isTextBased()) return;

        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('🤖 Auto-Moderation Action')
            .addFields(
                { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                { name: 'Violation', value: violationType, inline: true },
                { name: 'Reason', value: reason },
                { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
                { name: 'Message Content', value: message.content.substring(0, 1000) || '(empty)' }
            )
            .setTimestamp();

        await (logChannel as TextChannel).send({ embeds: [embed] });
    }

    private cleanupCache(): void {
        const now = Date.now();
        for (const [userId, check] of this.messageCache.entries()) {
            if (now - check.firstMessage > this.SPAM_WINDOW * 2) {
                this.messageCache.delete(userId);
            }
        }
    }
}