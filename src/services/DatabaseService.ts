import sqlite3 from 'sqlite3';
import { open, Database, Statement } from 'sqlite';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';

export interface Warning {
    id: number;
    userId: string;
    guildId: string;
    moderatorId: string;
    reason: string;
    createdAt: string;
}

export interface ModStats {
    bans: number;
    kicks: number;
    timeouts: number;
    warnings: number;
}

export class DatabaseService {
    private db!: Database<sqlite3.Database, sqlite3.Statement>;

    async init(): Promise<void> {
        const dataDir = path.dirname(config.database.path);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.db = await open({
            filename: config.database.path,
            driver: sqlite3.Database
        });

        await this.createTables();
        console.log('✅ Database initialized');
    }

    private async createTables(): Promise<void> {
        // Warnings table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS warnings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                moderator_id TEXT NOT NULL,
                reason TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Moderation actions log
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS mod_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action_type TEXT NOT NULL,
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                moderator_id TEXT NOT NULL,
                reason TEXT,
                duration TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Guild settings
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS guild_settings (
                guild_id TEXT PRIMARY KEY,
                mod_log_channel TEXT,
                auto_mod_enabled BOOLEAN DEFAULT 0,
                banned_words TEXT,
                spam_threshold INTEGER DEFAULT 5,
                mention_threshold INTEGER DEFAULT 5,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    // Warning methods
    async addWarning(userId: string, guildId: string, moderatorId: string, reason?: string): Promise<number> {
        const result = await this.db.run(
            'INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES (?, ?, ?, ?)',
            userId, guildId, moderatorId, reason || null
        );
        return result.lastID as number;
    }

    async getWarnings(userId: string, guildId: string): Promise<Warning[]> {
        const rows = await this.db.all(
            'SELECT * FROM warnings WHERE user_id = ? AND guild_id = ? ORDER BY created_at DESC',
            userId, guildId
        ) as any[];
        return rows.map(this.mapWarning);
    }

    async clearWarnings(userId: string, guildId: string): Promise<number> {
        const result = await this.db.run(
            'DELETE FROM warnings WHERE user_id = ? AND guild_id = ?',
            userId, guildId
        );
        return result.changes || 0;
    }

    async getWarningCount(userId: string, guildId: string): Promise<number> {
        const result = await this.db.get(
            'SELECT COUNT(*) as count FROM warnings WHERE user_id = ? AND guild_id = ?',
            userId, guildId
        ) as { count: number };
        return result.count;
    }

    // Mod actions logging
    async logAction(
        actionType: string,
        userId: string,
        guildId: string,
        moderatorId: string,
        reason?: string,
        duration?: string
    ): Promise<void> {
        await this.db.run(
            'INSERT INTO mod_actions (action_type, user_id, guild_id, moderator_id, reason, duration) VALUES (?, ?, ?, ?, ?, ?)',
            actionType, userId, guildId, moderatorId, reason || null, duration || null
        );
    }

    async getModStats(guildId: string, since?: Date): Promise<ModStats> {
        let dateFilter = '';
        const params: any[] = [guildId];

        if (since) {
            dateFilter = 'AND created_at >= ?';
            params.push(since.toISOString());
        }

        const result = await this.db.get(`
            SELECT 
                SUM(CASE WHEN action_type = 'ban' THEN 1 ELSE 0 END) as bans,
                SUM(CASE WHEN action_type = 'kick' THEN 1 ELSE 0 END) as kicks,
                SUM(CASE WHEN action_type = 'timeout' THEN 1 ELSE 0 END) as timeouts,
                SUM(CASE WHEN action_type = 'warn' THEN 1 ELSE 0 END) as warnings
            FROM mod_actions 
            WHERE guild_id = ? ${dateFilter}
        `, ...params) as any;

        return {
            bans: result.bans || 0,
            kicks: result.kicks || 0,
            timeouts: result.timeouts || 0,
            warnings: result.warnings || 0
        };
    }

    // Guild settings
    async getGuildSettings(guildId: string): Promise<any> {
        return await this.db.get('SELECT * FROM guild_settings WHERE guild_id = ?', guildId);
    }

    async setModLogChannel(guildId: string, channelId: string): Promise<void> {
        await this.db.run(`
            INSERT INTO guild_settings (guild_id, mod_log_channel) 
            VALUES (?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET 
                mod_log_channel = excluded.mod_log_channel,
                updated_at = CURRENT_TIMESTAMP
        `, guildId, channelId);
    }

    async getModLogChannel(guildId: string): Promise<string | null> {
        const settings = await this.getGuildSettings(guildId);
        return settings?.mod_log_channel || null;
    }

    close(): void {
        this.db.close();
    }

    private mapWarning(row: any): Warning {
        return {
            id: row.id,
            userId: row.user_id,
            guildId: row.guild_id,
            moderatorId: row.moderator_id,
            reason: row.reason,
            createdAt: row.created_at
        };
    }
}