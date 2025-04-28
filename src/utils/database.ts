/**
 * Database Utilities
 * 
 * This module provides utility functions for common database operations.
 * It includes functions for CRUD operations on different tables.
 * 
 * Like a set of specialized tools for managing the ship's database,
 * these utilities make it easier to work with different types of data.
 */

import { 
    Token, 
    Transaction, 
    Price, 
    Position, 
    Setting,
    PositionType,
    PositionStatus,
    TransactionStatus,
    SettingKey,
    NotificationHistory
} from '../models/database.js';
import { 
    NotificationEvent,
    NotificationFilterRule,
    NotificationGroup
} from '../types/notification.js';
import { 
    query, 
    queryOne, 
    insert, 
    update, 
    remove,
    beginTransaction,
    commitTransaction,
    rollbackTransaction
} from '../core/database.js';
import logger from '../core/logger.js';

const MODULE_NAME = 'DatabaseUtils';

/**
 * Token operations
 */
export const TokenDB = {
    /**
     * Get token by address
     */
    async getByAddress(address: string): Promise<Token | null> {
        return await queryOne<Token>(
            'SELECT * FROM tokens WHERE address = ?',
            [address]
        );
    },

    /**
     * Get all tokens
     */
    async getAll(): Promise<Token[]> {
        return await query<Token>('SELECT * FROM tokens');
    },

    /**
     * Save token
     */
    async save(token: Token): Promise<void> {
        const existing = await this.getByAddress(token.address);
        if (existing) {
            await update(
                `UPDATE tokens SET 
                symbol = ?, name = ?, decimals = ?, 
                total_supply = ?, holder_count = ?,
                updated_at = CURRENT_TIMESTAMP
                WHERE address = ?`,
                [
                    token.symbol, token.name, token.decimals,
                    token.total_supply, token.holder_count,
                    token.address
                ]
            );
        } else {
            await insert(
                `INSERT INTO tokens (
                    address, symbol, name, decimals,
                    total_supply, holder_count
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    token.address, token.symbol, token.name,
                    token.decimals, token.total_supply,
                    token.holder_count
                ]
            );
        }
    }
};

/**
 * Transaction operations
 */
export const TransactionDB = {
    /**
     * Get transaction by hash
     */
    async getByHash(hash: string): Promise<Transaction | null> {
        return await queryOne<Transaction>(
            'SELECT * FROM transactions WHERE hash = ?',
            [hash]
        );
    },

    /**
     * Get transactions by token address
     */
    async getByToken(tokenAddress: string, limit = 100): Promise<Transaction[]> {
        return await query<Transaction>(
            `SELECT * FROM transactions 
            WHERE from_address = ? OR to_address = ?
            ORDER BY timestamp DESC LIMIT ?`,
            [tokenAddress, tokenAddress, limit]
        );
    },

    /**
     * Save transaction
     */
    async save(tx: Transaction): Promise<void> {
        const existing = await this.getByHash(tx.hash);
        if (existing) {
            await update(
                `UPDATE transactions SET 
                block_number = ?, timestamp = ?,
                from_address = ?, to_address = ?,
                value = ?, gas_used = ?,
                gas_price = ?, status = ?
                WHERE hash = ?`,
                [
                    tx.block_number, tx.timestamp,
                    tx.from_address, tx.to_address,
                    tx.value, tx.gas_used,
                    tx.gas_price, tx.status,
                    tx.hash
                ]
            );
        } else {
            await insert(
                `INSERT INTO transactions (
                    hash, block_number, timestamp,
                    from_address, to_address, value,
                    gas_used, gas_price, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    tx.hash, tx.block_number, tx.timestamp,
                    tx.from_address, tx.to_address, tx.value,
                    tx.gas_used, tx.gas_price, tx.status
                ]
            );
        }
    }
};

/**
 * Price operations
 */
export const PriceDB = {
    /**
     * Get latest price by token address
     */
    async getLatestPrice(tokenAddress: string): Promise<Price | null> {
        return await queryOne<Price>(
            `SELECT * FROM prices 
            WHERE token_address = ?
            ORDER BY timestamp DESC LIMIT 1`,
            [tokenAddress]
        );
    },

    /**
     * Get price history by token address
     */
    async getPriceHistory(
        tokenAddress: string, 
        startTime: Date, 
        endTime: Date
    ): Promise<Price[]> {
        return await query<Price>(
            `SELECT * FROM prices 
            WHERE token_address = ?
            AND timestamp BETWEEN ? AND ?
            ORDER BY timestamp ASC`,
            [tokenAddress, startTime, endTime]
        );
    },

    /**
     * Save price
     */
    async save(price: Price): Promise<void> {
        await insert(
            `INSERT INTO prices (
                token_address, price, volume_24h,
                market_cap, timestamp
            ) VALUES (?, ?, ?, ?, ?)`,
            [
                price.token_address, price.price,
                price.volume_24h, price.market_cap,
                price.timestamp
            ]
        );
    }
};

/**
 * Position operations
 */
export const PositionDB = {
    /**
     * Get position by ID
     */
    async getById(id: number): Promise<Position | null> {
        return await queryOne<Position>(
            'SELECT * FROM positions WHERE id = ?',
            [id]
        );
    },

    /**
     * Get open positions
     */
    async getOpenPositions(): Promise<Position[]> {
        return await query<Position>(
            `SELECT * FROM positions 
            WHERE status = ?
            ORDER BY opened_at DESC`,
            [PositionStatus.OPEN]
        );
    },

    /**
     * Get positions by token address
     */
    async getByToken(tokenAddress: string): Promise<Position[]> {
        return await query<Position>(
            `SELECT * FROM positions 
            WHERE token_address = ?
            ORDER BY opened_at DESC`,
            [tokenAddress]
        );
    },

    /**
     * Save position
     */
    async save(position: Position): Promise<number> {
        if (position.id) {
            await update(
                `UPDATE positions SET 
                position_type = ?, entry_price = ?,
                size = ?, leverage = ?,
                stop_loss = ?, take_profit = ?,
                pnl = ?, status = ?,
                opened_at = ?, closed_at = ?,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [
                    position.position_type, position.entry_price,
                    position.size, position.leverage,
                    position.stop_loss, position.take_profit,
                    position.pnl, position.status,
                    position.opened_at, position.closed_at,
                    position.id
                ]
            );
            return position.id;
        } else {
            return await insert(
                `INSERT INTO positions (
                    token_address, position_type,
                    entry_price, size, leverage,
                    stop_loss, take_profit,
                    status, opened_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    position.token_address, position.position_type,
                    position.entry_price, position.size,
                    position.leverage, position.stop_loss,
                    position.take_profit, position.status,
                    position.opened_at
                ]
            );
        }
    }
};

/**
 * Setting operations
 */
export const SettingDB = {
    /**
     * Get setting by key
     */
    async get(key: string): Promise<Setting | null> {
        return await queryOne<Setting>(
            'SELECT * FROM settings WHERE key = ?',
            [key]
        );
    },

    /**
     * Get all settings
     */
    async getAll(): Promise<Setting[]> {
        return await query<Setting>('SELECT * FROM settings');
    },

    /**
     * Save setting
     */
    async save(setting: Setting): Promise<void> {
        const existing = await this.get(setting.key);
        if (existing) {
            await update(
                `UPDATE settings SET 
                value = ?, description = ?,
                updated_at = CURRENT_TIMESTAMP
                WHERE key = ?`,
                [setting.value, setting.description, setting.key]
            );
        } else {
            await insert(
                `INSERT INTO settings (
                    key, value, description
                ) VALUES (?, ?, ?)`,
                [setting.key, setting.value, setting.description]
            );
        }
    },

    /**
     * Get setting value by key
     */
    async getValue(key: string): Promise<string | null> {
        const setting = await this.get(key);
        return setting ? setting.value : null;
    },

    /**
     * Set setting value by key
     */
    async setValue(key: string, value: string): Promise<void> {
        await this.save({ 
            key, 
            value,
            created_at: new Date(),
            updated_at: new Date()
        });
    }
};

/**
 * 通知历史记录操作
 */
export const NotificationHistoryDB = {
  /**
   * 保存通知历史记录
   */
  async save(history: Omit<NotificationHistory, 'id'>): Promise<number> {
    return await insert(
      `INSERT INTO notification_history (
        event_type, message, chat_id, status,
        priority, group_id, created_at, sent_at, error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        history.event_type,
        history.message,
        history.chat_id,
        history.status,
        history.priority,
        history.group_id,
        history.created_at,
        history.sent_at,
        history.error
      ]
    );
  },

  /**
   * 获取通知历史记录
   */
  async getById(id: number): Promise<NotificationHistory | null> {
    return await queryOne<NotificationHistory>(
      'SELECT * FROM notification_history WHERE id = ?',
      [id]
    );
  },

  /**
   * 获取通知历史记录列表
   */
  async getList(options: {
    eventType?: NotificationEvent;
    status?: 'sent' | 'failed';
    groupId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<NotificationHistory[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (options.eventType) {
      conditions.push('event_type = ?');
      params.push(options.eventType);
    }

    if (options.status) {
      conditions.push('status = ?');
      params.push(options.status);
    }

    if (options.groupId) {
      conditions.push('group_id = ?');
      params.push(options.groupId);
    }

    if (options.startDate) {
      conditions.push('created_at >= ?');
      params.push(options.startDate);
    }

    if (options.endDate) {
      conditions.push('created_at <= ?');
      params.push(options.endDate);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    const limitClause = options.limit 
      ? `LIMIT ${options.limit}${options.offset ? ` OFFSET ${options.offset}` : ''}` 
      : '';

    return await query<NotificationHistory>(
      `SELECT * FROM notification_history ${whereClause} ORDER BY created_at DESC ${limitClause}`,
      params
    );
  },

  /**
   * 获取通知统计信息
   */
  async getStats(options: {
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{
    total: number;
    sent: number;
    failed: number;
    byEventType: Record<NotificationEvent, number>;
    byPriority: Record<number, number>;
  }> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (options.startDate) {
      conditions.push('created_at >= ?');
      params.push(options.startDate);
    }

    if (options.endDate) {
      conditions.push('created_at <= ?');
      params.push(options.endDate);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    const [total, sent, failed] = await Promise.all([
      queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM notification_history ${whereClause}`,
        params
      ),
      queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM notification_history ${whereClause} AND status = 'sent'`,
        params
      ),
      queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM notification_history ${whereClause} AND status = 'failed'`,
        params
      )
    ]);

    const byEventType = await query<{ event_type: NotificationEvent; count: number }>(
      `SELECT event_type, COUNT(*) as count FROM notification_history ${whereClause} GROUP BY event_type`,
      params
    );

    const byPriority = await query<{ priority: number; count: number }>(
      `SELECT priority, COUNT(*) as count FROM notification_history ${whereClause} GROUP BY priority`,
      params
    );

    return {
      total: total?.count || 0,
      sent: sent?.count || 0,
      failed: failed?.count || 0,
      byEventType: byEventType.reduce((acc, curr) => {
        acc[curr.event_type] = curr.count;
        return acc;
      }, {} as Record<NotificationEvent, number>),
      byPriority: byPriority.reduce((acc, curr) => {
        acc[curr.priority] = curr.count;
        return acc;
      }, {} as Record<number, number>)
    };
  }
};

/**
 * 通知过滤规则操作
 */
export const NotificationFilterDB = {
  /**
   * 保存过滤规则
   */
  async save(rule: Omit<NotificationFilterRule, 'id'>): Promise<number> {
    return await insert(
      `INSERT INTO notification_filters (
        name, event_type, conditions, action,
        priority, enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rule.name,
        rule.event_type,
        JSON.stringify(rule.conditions),
        rule.action,
        rule.priority,
        rule.enabled,
        rule.created_at,
        rule.updated_at
      ]
    );
  },

  /**
   * 获取过滤规则
   */
  async getById(id: number): Promise<NotificationFilterRule | null> {
    const rule = await queryOne<NotificationFilterRule>(
      'SELECT * FROM notification_filters WHERE id = ?',
      [id]
    );
    if (rule) {
      rule.conditions = JSON.parse(rule.conditions as unknown as string);
    }
    return rule;
  },

  /**
   * 获取所有过滤规则
   */
  async getAll(): Promise<NotificationFilterRule[]> {
    const rules = await query<NotificationFilterRule>(
      'SELECT * FROM notification_filters ORDER BY priority DESC'
    );
    return rules.map(rule => ({
      ...rule,
      conditions: JSON.parse(rule.conditions as unknown as string)
    }));
  },

  /**
   * 更新过滤规则
   */
  async update(id: number, rule: Partial<NotificationFilterRule>): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (rule.name) {
      updates.push('name = ?');
      params.push(rule.name);
    }

    if (rule.event_type) {
      updates.push('event_type = ?');
      params.push(rule.event_type);
    }

    if (rule.conditions) {
      updates.push('conditions = ?');
      params.push(JSON.stringify(rule.conditions));
    }

    if (rule.action) {
      updates.push('action = ?');
      params.push(rule.action);
    }

    if (rule.priority) {
      updates.push('priority = ?');
      params.push(rule.priority);
    }

    if (rule.enabled !== undefined) {
      updates.push('enabled = ?');
      params.push(rule.enabled);
    }

    updates.push('updated_at = ?');
    params.push(new Date());

    params.push(id);

    await update(
      `UPDATE notification_filters SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  },

  /**
   * 删除过滤规则
   */
  async delete(id: number): Promise<void> {
    await remove('DELETE FROM notification_filters WHERE id = ?', [id]);
  }
};

/**
 * 通知分组操作
 */
export const NotificationGroupDB = {
  /**
   * 保存分组
   */
  async save(group: Omit<NotificationGroup, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    await insert(
      `INSERT INTO notification_groups (
        id, name, description, rules,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        group.name,
        group.description,
        JSON.stringify(group.rules),
        group.created_at,
        group.updated_at
      ]
    );
    return id;
  },

  /**
   * 获取分组
   */
  async getById(id: string): Promise<NotificationGroup | null> {
    const group = await queryOne<NotificationGroup>(
      'SELECT * FROM notification_groups WHERE id = ?',
      [id]
    );
    if (group) {
      group.rules = JSON.parse(group.rules as unknown as string);
    }
    return group;
  },

  /**
   * 获取所有分组
   */
  async getAll(): Promise<NotificationGroup[]> {
    const groups = await query<NotificationGroup>(
      'SELECT * FROM notification_groups ORDER BY created_at DESC'
    );
    return groups.map(group => ({
      ...group,
      rules: JSON.parse(group.rules as unknown as string)
    }));
  },

  /**
   * 更新分组
   */
  async update(id: string, group: Partial<NotificationGroup>): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (group.name) {
      updates.push('name = ?');
      params.push(group.name);
    }

    if (group.description) {
      updates.push('description = ?');
      params.push(group.description);
    }

    if (group.rules) {
      updates.push('rules = ?');
      params.push(JSON.stringify(group.rules));
    }

    updates.push('updated_at = ?');
    params.push(new Date());

    params.push(id);

    await update(
      `UPDATE notification_groups SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  },

  /**
   * 删除分组
   */
  async delete(id: string): Promise<void> {
    await remove('DELETE FROM notification_groups WHERE id = ?', [id]);
  }
}; 