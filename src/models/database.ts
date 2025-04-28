/**
 * Database Models
 * 
 * This module defines the structure and types for database tables.
 * It provides interfaces that map to the database schema.
 * 
 * Like a ship's blueprint that defines the structure of different compartments,
 * these models define how data should be organized in the database.
 */

import { NotificationEvent } from '../types/notification.js';

/**
 * Token information
 */
export interface Token {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    total_supply?: string;
    holder_count?: number;
    created_at: Date;
    updated_at: Date;
}

/**
 * Transaction record
 */
export interface Transaction {
    hash: string;
    block_number: number;
    timestamp: Date;
    from_address: string;
    to_address: string;
    value: string;
    gas_used?: number;
    gas_price?: string;
    status: string;
    created_at: Date;
}

/**
 * Token price record
 */
export interface Price {
    id: number;
    token_address: string;
    price: string;
    volume_24h?: string;
    market_cap?: string;
    timestamp: Date;
    created_at: Date;
}

/**
 * Trading position
 */
export interface Position {
    id: number;
    token_address: string;
    position_type: string;
    entry_price: string;
    size: string;
    leverage: number;
    stop_loss?: string;
    take_profit?: string;
    pnl?: string;
    status: string;
    opened_at: Date;
    closed_at?: Date;
    created_at: Date;
    updated_at: Date;
}

/**
 * Bot settings
 */
export interface Setting {
    key: string;
    value: string;
    description?: string;
    created_at: Date;
    updated_at: Date;
}

/**
 * Position types
 */
export enum PositionType {
    LONG = 'LONG',
    SHORT = 'SHORT'
}

/**
 * Position status
 */
export enum PositionStatus {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
    LIQUIDATED = 'LIQUIDATED'
}

/**
 * Transaction status
 */
export enum TransactionStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    FAILED = 'FAILED'
}

/**
 * Setting keys
 */
export enum SettingKey {
    MAX_POSITION_SIZE = 'max_position_size',
    MAX_LEVERAGE = 'max_leverage',
    MIN_PROFIT_THRESHOLD = 'min_profit_threshold',
    MAX_LOSS_THRESHOLD = 'max_loss_threshold',
    TRADING_ENABLED = 'trading_enabled',
    RISK_MANAGEMENT_ENABLED = 'risk_management_enabled',
    PRICE_UPDATE_INTERVAL = 'price_update_interval',
    POSITION_CHECK_INTERVAL = 'position_check_interval'
}

/**
 * 通知历史记录接口
 */
export interface NotificationHistory {
  id: number;                     // 记录ID
  event_type: NotificationEvent;  // 通知类型
  message: string;                // 通知消息
  chat_id: string;                // 接收者ID
  status: 'sent' | 'failed' | 'filtered';  // 发送状态
  priority: number;               // 优先级
  group_id?: string;              // 分组ID
  created_at: Date;               // 创建时间
  sent_at?: Date;                 // 发送时间
  error?: string;                 // 错误信息
} 