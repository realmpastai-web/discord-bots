import Database from 'better-sqlite3';
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
    private db: Database.Database;

    constructor() {
        const dataDir = path.dirname(config.database.path);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.db = new Database(config.database.path);
        this.init();
    }

    private init(): void {
        // Warnings table
        this.db.exec(`
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
        this.db.exec(`
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
        this.db.exec(`
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

        console.log('✅ Database initialized');
    }

    // Warning methods
    addWarning(userId: string, guildId: string, moderatorId: string, reason?: string): number {
        const stmt = this.db.prepare(
            'INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES (?, ?, ?, ?)'
        );
        const result = stmt.run(userId, guildId, moderatorId, reason || null);
        return result.lastInsertRowid as number;
    }

    getWarnings(userId: string, guildId: string): Warning[] {
        const stmt = this.db.prepare(
            'SELECT * FROM warnings WHERE user_id = ? AND guild_id = ? ORDER BY created_at DESC'
        );
        const rows = stmt.all(userId, guildId) as any[];
        return rows.map(this.mapWarning);
    }

    clearWarnings(userId: string, guildId: string): number {
        const stmt = this.db.prepare(
            'DELETE FROM warnings WHERE user_id = ? AND guild_id = ?'
        );
        const result = stmt.run(userId, guildId);
        return result.changes;
    }

    getWarningCount(userId: string, guildId: string): number {
        const stmt = this.db.prepare(
            'SELECT COUNT(*) as count FROM warnings WHERE user_id = ? AND guild_id = ?'
        );
        const result = stmt.get(userId, guildId) as { count: number };
        return result.count;
    }

    // Mod actions logging
    logAction(
        actionType: string,
        userId: string,
        guildId: string,
        moderatorId: string,
        reason?: string,
        duration?: string
    ): void {
        const stmt = this.db.prepare(
            'INSERT INTO mod_actions (action_type, user_id, guild_id, moderator_id, reason, duration) VALUES (?, ?, ?, ?, ?, ?)'
        );
        stmt.run(actionType, userId, guildId, moderatorId, reason || null, duration || null);
    }

    getModStats(guildId: string, since?: Date): ModStats {
        let dateFilter = '';
        const params: any[] = [guildId];

        if (since) {
            dateFilter = 'AND created_at >= ?';
            params.push(since.toISOString());
        }

        const stmt = this.db.prepare(`
            SELECT 
                SUM(CASE WHEN action_type = 'ban' THEN 1 ELSE 0 END) as bans,
                SUM(CASE WHEN action_type = 'kick' THEN 1 ELSE 0 END) as kicks,
                SUM(CASE WHEN action_type = 'timeout' THEN 1 ELSE 0 END) as timeouts,
                SUM(CASE WHEN action_type = 'warn' THEN 1 ELSE 0 END) as warnings
            FROM mod_actions 
            WHERE guild_id = ? ${dateFilter}
        `);

        const result = stmt.get(...params) as any;
        return {
            bans: result.bans || 0,
            kicks: result.kicks || 0,
            timeouts: result.timeouts || 0,
            warnings: result.warnings || 0
        };
    }

    // Guild settings
    getGuildSettings(guildId: string): any {
        const stmt = this.db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?');
        return stmt.get(guildId);
    }

    setModLogChannel(guildId: string, channelId: string): void {
        const stmt = this.db.prepare(`
            INSERT INTO guild_settings (guild_id, mod_log_channel) 
            VALUES (?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET 
                mod_log_channel = excluded.mod_log_channel,
                updated_at = CURRENT_TIMESTAMP
        `);
        stmt.run(guildId, channelId);
    }

    getModLogChannel(guildId: string): string | null {
        const settings = this.getGuildSettings(guildId);
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