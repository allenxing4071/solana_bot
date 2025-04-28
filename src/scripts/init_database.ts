/**
 * Database Initialization Script
 * 
 * This script initializes the database during application startup.
 * It handles database creation, schema setup, and initial data loading.
 * 
 * Like preparing a ship's logbook before a journey:
 * - Creates necessary tables (like different sections of the logbook)
 * - Sets up indexes (like tabs for quick reference)
 * - Loads initial data (like pre-filled standard information)
 */

import { initDatabase, closeDatabase } from '../core/database.js';
import logger from '../core/logger.js';
import { SettingDB } from '../utils/database.js';
import { SettingKey } from '../models/database.js';

const MODULE_NAME = 'DatabaseInit';

/**
 * Initialize database
 */
export async function initializeDatabaseSystem(): Promise<void> {
    try {
        // Initialize database connection and schema
        await initDatabase();
        logger.info(`[${MODULE_NAME}] Database initialized successfully`);

        // Verify settings
        await verifySettings();
        logger.info(`[${MODULE_NAME}] Settings verified successfully`);

    } catch (error) {
        logger.error(`[${MODULE_NAME}] Failed to initialize database system: ${error}`);
        throw error;
    }
}

/**
 * Verify and update settings if necessary
 */
async function verifySettings(): Promise<void> {
    try {
        // Get all settings
        const settings = await SettingDB.getAll();
        logger.debug(`[${MODULE_NAME}] Current settings: ${JSON.stringify(settings)}`);

        // Check each required setting
        for (const key of Object.values(SettingKey)) {
            const setting = settings.find(s => s.key === key);
            if (!setting) {
                logger.warn(`[${MODULE_NAME}] Missing setting: ${key}, will be created with default value`);
                await createDefaultSetting(key);
            }
        }

    } catch (error) {
        logger.error(`[${MODULE_NAME}] Failed to verify settings: ${error}`);
        throw error;
    }
}

/**
 * Create default setting
 */
async function createDefaultSetting(key: string): Promise<void> {
    const defaultValues: { [key: string]: { value: string, description: string } } = {
        [SettingKey.MAX_POSITION_SIZE]: {
            value: '1000',
            description: 'Maximum position size in USD'
        },
        [SettingKey.MAX_LEVERAGE]: {
            value: '3',
            description: 'Maximum leverage allowed'
        },
        [SettingKey.MIN_PROFIT_THRESHOLD]: {
            value: '0.01',
            description: 'Minimum profit threshold to take profit'
        },
        [SettingKey.MAX_LOSS_THRESHOLD]: {
            value: '0.02',
            description: 'Maximum loss threshold to stop loss'
        },
        [SettingKey.TRADING_ENABLED]: {
            value: 'false',
            description: 'Whether trading is enabled'
        },
        [SettingKey.RISK_MANAGEMENT_ENABLED]: {
            value: 'true',
            description: 'Whether risk management is enabled'
        },
        [SettingKey.PRICE_UPDATE_INTERVAL]: {
            value: '60',
            description: 'Price update interval in seconds'
        },
        [SettingKey.POSITION_CHECK_INTERVAL]: {
            value: '30',
            description: 'Position check interval in seconds'
        }
    };

    const defaultSetting = defaultValues[key];
    if (!defaultSetting) {
        throw new Error(`No default value defined for setting: ${key}`);
    }

    await SettingDB.save({
        key,
        value: defaultSetting.value,
        description: defaultSetting.description,
        created_at: new Date(),
        updated_at: new Date()
    });

    logger.info(`[${MODULE_NAME}] Created default setting: ${key} = ${defaultSetting.value}`);
}

/**
 * Cleanup database connections
 */
export async function cleanupDatabase(): Promise<void> {
    try {
        await closeDatabase();
        logger.info(`[${MODULE_NAME}] Database connections closed successfully`);
    } catch (error) {
        logger.error(`[${MODULE_NAME}] Failed to cleanup database: ${error}`);
        throw error;
    }
} 