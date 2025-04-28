/**
 * Database Service
 * 
 * This module provides a unified interface for database operations.
 * It handles connections to SQLite database and provides methods for CRUD operations.
 * 
 * Like a ship's database that stores all the important information about the journey,
 * this service manages all persistent data for the bot.
 */

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import logger from './logger.js';

const MODULE_NAME = 'DatabaseService';

// Database connection options
const DB_PATH = path.join(process.cwd(), 'data', 'solana_bot.db');
const DB_OPTIONS = {
    filename: DB_PATH,
    driver: sqlite3.Database
};

// Database connection instance
let db: Database | null = null;

/**
 * Initialize database connection
 */
export async function initDatabase(): Promise<void> {
    try {
        if (!db) {
            db = await open(DB_OPTIONS);
            logger.info(`[${MODULE_NAME}] Database connection initialized`);
            
            // Enable foreign keys
            await db.run('PRAGMA foreign_keys = ON');
            
            // Load init script
            const initScript = path.join(process.cwd(), 'scripts', 'init_db.sql');
            const sql = require('fs').readFileSync(initScript, 'utf8');
            await db.exec(sql);
            
            logger.info(`[${MODULE_NAME}] Database tables initialized`);
        }
    } catch (error) {
        logger.error(`[${MODULE_NAME}] Failed to initialize database: ${error}`);
        throw error;
    }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
    try {
        if (db) {
            await db.close();
            db = null;
            logger.info(`[${MODULE_NAME}] Database connection closed`);
        }
    } catch (error) {
        logger.error(`[${MODULE_NAME}] Failed to close database: ${error}`);
        throw error;
    }
}

/**
 * Get database instance
 */
export function getDatabase(): Database {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}

/**
 * Execute a query with parameters
 */
export async function query<T>(sql: string, params: any[] = []): Promise<T[]> {
    try {
        const database = getDatabase();
        return await database.all(sql, params);
    } catch (error) {
        logger.error(`[${MODULE_NAME}] Query failed: ${error}`);
        throw error;
    }
}

/**
 * Execute a single-row query
 */
export async function queryOne<T>(sql: string, params: any[] = []): Promise<T | null> {
    try {
        const database = getDatabase();
        const result = await database.get(sql, params);
        return result as T | null;
    } catch (error) {
        logger.error(`[${MODULE_NAME}] QueryOne failed: ${error}`);
        throw error;
    }
}

/**
 * Execute an insert query
 */
export async function insert(sql: string, params: any[] = []): Promise<number> {
    try {
        const database = getDatabase();
        const result = await database.run(sql, params);
        return result.lastID || 0;
    } catch (error) {
        logger.error(`[${MODULE_NAME}] Insert failed: ${error}`);
        throw error;
    }
}

/**
 * Execute an update query
 */
export async function update(sql: string, params: any[] = []): Promise<number> {
    try {
        const database = getDatabase();
        const result = await database.run(sql, params);
        return result.changes || 0;
    } catch (error) {
        logger.error(`[${MODULE_NAME}] Update failed: ${error}`);
        throw error;
    }
}

/**
 * Execute a delete query
 */
export async function remove(sql: string, params: any[] = []): Promise<number> {
    try {
        const database = getDatabase();
        const result = await database.run(sql, params);
        return result.changes || 0;
    } catch (error) {
        logger.error(`[${MODULE_NAME}] Delete failed: ${error}`);
        throw error;
    }
}

/**
 * Begin a transaction
 */
export async function beginTransaction(): Promise<void> {
    try {
        const database = getDatabase();
        await database.run('BEGIN TRANSACTION');
    } catch (error) {
        logger.error(`[${MODULE_NAME}] Failed to begin transaction: ${error}`);
        throw error;
    }
}

/**
 * Commit a transaction
 */
export async function commitTransaction(): Promise<void> {
    try {
        const database = getDatabase();
        await database.run('COMMIT');
    } catch (error) {
        logger.error(`[${MODULE_NAME}] Failed to commit transaction: ${error}`);
        throw error;
    }
}

/**
 * Rollback a transaction
 */
export async function rollbackTransaction(): Promise<void> {
    try {
        const database = getDatabase();
        await database.run('ROLLBACK');
    } catch (error) {
        logger.error(`[${MODULE_NAME}] Failed to rollback transaction: ${error}`);
        throw error;
    }
} 