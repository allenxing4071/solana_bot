-- Initialize database tables for Solana MEV Bot

-- Tokens table to store token information
CREATE TABLE IF NOT EXISTS tokens (
    address TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    decimals INTEGER NOT NULL,
    total_supply TEXT,
    holder_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table to store transaction history
CREATE TABLE IF NOT EXISTS transactions (
    hash TEXT PRIMARY KEY,
    block_number INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    value TEXT NOT NULL,
    gas_used INTEGER,
    gas_price TEXT,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prices table to store token price history
CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_address TEXT NOT NULL,
    price TEXT NOT NULL,
    volume_24h TEXT,
    market_cap TEXT,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (token_address) REFERENCES tokens(address)
);

-- Positions table to store trading positions
CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_address TEXT NOT NULL,
    position_type TEXT NOT NULL,
    entry_price TEXT NOT NULL,
    size TEXT NOT NULL,
    leverage INTEGER DEFAULT 1,
    stop_loss TEXT,
    take_profit TEXT,
    pnl TEXT,
    status TEXT NOT NULL,
    opened_at TIMESTAMP NOT NULL,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (token_address) REFERENCES tokens(address)
);

-- Settings table to store bot configuration
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification history table to store notification records
CREATE TABLE IF NOT EXISTS notification_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    chat_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
    priority INTEGER NOT NULL DEFAULT 1,
    group_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    error TEXT
);

-- Notification filter rules table
CREATE TABLE IF NOT EXISTS notification_filter_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    conditions TEXT NOT NULL,  -- JSON string of filter conditions
    action TEXT NOT NULL CHECK (action IN ('allow', 'block')),
    priority INTEGER NOT NULL DEFAULT 1,
    is_enabled BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification groups table
CREATE TABLE IF NOT EXISTS notification_groups (
    id TEXT PRIMARY KEY,  -- UUID
    name TEXT NOT NULL,
    description TEXT,
    chat_ids TEXT NOT NULL,  -- JSON array of chat IDs
    event_types TEXT NOT NULL,  -- JSON array of event types
    is_enabled BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_prices_token_timestamp ON prices(token_address, timestamp);
CREATE INDEX IF NOT EXISTS idx_positions_token ON positions(token_address);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_notification_history_event_type ON notification_history(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON notification_history(status);
CREATE INDEX IF NOT EXISTS idx_notification_history_group_id ON notification_history(group_id);
CREATE INDEX IF NOT EXISTS idx_notification_filter_rules_event_type ON notification_filter_rules(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_filter_rules_priority ON notification_filter_rules(priority);
CREATE INDEX IF NOT EXISTS idx_notification_groups_event_types ON notification_groups(event_types);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value, description) VALUES
    ('max_position_size', '1000', 'Maximum position size in USD'),
    ('max_leverage', '3', 'Maximum leverage allowed'),
    ('min_profit_threshold', '0.01', 'Minimum profit threshold to take profit'),
    ('max_loss_threshold', '0.02', 'Maximum loss threshold to stop loss'),
    ('trading_enabled', 'false', 'Whether trading is enabled'),
    ('risk_management_enabled', 'true', 'Whether risk management is enabled'),
    ('price_update_interval', '60', 'Price update interval in seconds'),
    ('position_check_interval', '30', 'Position check interval in seconds');