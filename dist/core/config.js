"use strict";
/**
 * 配置管理模块
 * 负责加载、解析和提供系统配置参数
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const config_1 = __importDefault(require("config"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_path_1 = __importDefault(require("node:path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const types_1 = require("./types");
// 加载环境变量
dotenv_1.default.config();
/**
 * 获取网络配置
 */
function getNetworkConfig() {
    return {
        cluster: process.env.SOLANA_NETWORK || config_1.default.get('network.cluster'),
        rpcUrl: process.env.SOLANA_RPC_URL || '',
        wsUrl: process.env.SOLANA_WS_URL || '',
    };
}
/**
 * 获取钱包配置
 */
function getWalletConfig() {
    return {
        privateKey: process.env.WALLET_PRIVATE_KEY || '',
        maxTransactionAmount: Number.parseFloat(process.env.MAX_TRANSACTION_AMOUNT || '1.0'),
    };
}
/**
 * 获取DEX配置列表
 */
function getDexesConfig() {
    const dexes = [];
    // 从config文件获取DEX列表
    if (config_1.default.has('monitoring.poolMonitor.targets')) {
        const targets = config_1.default.get('monitoring.poolMonitor.targets');
        for (const target of targets) {
            if (typeof target === 'object' && target && 'name' in target && 'programId' in target) {
                dexes.push({
                    name: target.name.toLowerCase(),
                    programId: target.programId,
                    enabled: 'enabled' in target ? Boolean(target.enabled) : true
                });
            }
        }
    }
    // 添加环境变量中的DEX(如果有)
    if (process.env.RAYDIUM_PROGRAM_ID) {
        dexes.push({
            name: types_1.DexType.RAYDIUM,
            programId: process.env.RAYDIUM_PROGRAM_ID,
            enabled: true
        });
    }
    if (process.env.ORCA_PROGRAM_ID) {
        dexes.push({
            name: types_1.DexType.ORCA,
            programId: process.env.ORCA_PROGRAM_ID,
            enabled: true
        });
    }
    return dexes;
}
/**
 * 获取监控配置
 */
function getMonitoringConfig() {
    return {
        poolMonitorInterval: parseInt(process.env.POOL_MONITOR_INTERVAL || '5000'),
        priceCheckInterval: parseInt(process.env.PRICE_CHECK_INTERVAL || '3000'),
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000')
    };
}
/**
 * 获取交易策略配置
 */
function getTradingConfig() {
    const tradingConfig = config_1.default.has('trading')
        ? config_1.default.get('trading')
        : {};
    return {
        buyStrategy: {
            enabled: process.env.ENABLE_BUY_STRATEGY !== 'false',
            maxAmountPerTrade: Number.parseFloat(process.env.BUY_AMOUNT_SOL ||
                tradingConfig.buyStrategy?.maxAmountPerTrade || '0.1'),
            maxSlippage: Number.parseFloat(process.env.MAX_BUY_SLIPPAGE ||
                tradingConfig.buyStrategy?.maxSlippage || '5'),
            minConfidence: Number.parseFloat(process.env.MIN_CONFIDENCE ||
                tradingConfig.buyStrategy?.minConfidence || '0.7'),
            priorityFee: {
                enabled: process.env.TX_PRIORITY_FEE ? true :
                    tradingConfig.buyStrategy?.priorityFee?.enabled || false,
                multiplier: Number.parseFloat(process.env.TX_PRIORITY_FEE_MULTIPLIER ||
                    tradingConfig.buyStrategy?.priorityFee?.multiplier || '1.5'),
                baseFee: Number.parseFloat(process.env.TX_PRIORITY_FEE ||
                    tradingConfig.buyStrategy?.priorityFee?.baseFee || '0.000005'),
                maxFee: Number.parseFloat(process.env.TX_MAX_PRIORITY_FEE ||
                    tradingConfig.buyStrategy?.priorityFee?.maxFee || '0.00005')
            }
        },
        sellStrategy: {
            enabled: process.env.ENABLE_SELL_STRATEGY !== 'false',
            conditions: [
                {
                    type: types_1.StrategyType.TAKE_PROFIT,
                    percentage: Number.parseFloat(process.env.TAKE_PROFIT_PERCENTAGE ||
                        tradingConfig.sellStrategy?.takeProfit?.percentage || '20'),
                    enabled: process.env.TAKE_PROFIT_PERCENTAGE ? true :
                        tradingConfig.sellStrategy?.takeProfit?.enabled || true
                },
                {
                    type: types_1.StrategyType.STOP_LOSS,
                    percentage: Number.parseFloat(process.env.STOP_LOSS_PERCENTAGE ||
                        tradingConfig.sellStrategy?.stopLoss?.percentage || '10'),
                    enabled: process.env.STOP_LOSS_PERCENTAGE ? true :
                        tradingConfig.sellStrategy?.stopLoss?.enabled || true
                },
                {
                    type: types_1.StrategyType.TRAILING_STOP,
                    percentage: Number.parseFloat(process.env.TRAILING_STOP_PERCENTAGE ||
                        tradingConfig.sellStrategy?.trailingStop?.percentage || '5'),
                    enabled: process.env.TRAILING_STOP_PERCENTAGE ? true :
                        tradingConfig.sellStrategy?.trailingStop?.enabled || false
                },
                {
                    type: types_1.StrategyType.TIME_LIMIT,
                    timeSeconds: parseInt(process.env.TIME_LIMIT_SECONDS ||
                        tradingConfig.sellStrategy?.timeLimit?.seconds || '300'),
                    enabled: process.env.TIME_LIMIT_SECONDS ? true :
                        tradingConfig.sellStrategy?.timeLimit?.enabled || false
                }
            ],
            maxSlippage: Number.parseFloat(process.env.MAX_SELL_SLIPPAGE ||
                tradingConfig.sellStrategy?.maxSlippage || '5')
        },
        txRetryCount: parseInt(process.env.TX_RETRY_COUNT || tradingConfig.txRetryCount || '3'),
        txConfirmTimeout: parseInt(process.env.TX_CONFIRM_TIMEOUT || tradingConfig.txConfirmTimeout || '60000')
    };
}
/**
 * 获取安全配置
 */
function getSecurityConfig() {
    const securityConfig = config_1.default.has('security')
        ? config_1.default.get('security')
        : {};
    return {
        tokenValidation: {
            useWhitelist: process.env.USE_WHITELIST === 'true' ||
                securityConfig.tokenValidation?.useWhitelist || false,
            useBlacklist: process.env.USE_BLACKLIST !== 'false', // 默认启用黑名单
            whitelistPath: process.env.TOKEN_WHITELIST_PATH || './config/whitelist.json',
            blacklistPath: process.env.TOKEN_BLACKLIST_PATH || './config/blacklist.json',
            minLiquidityUsd: Number.parseFloat(process.env.MIN_LIQUIDITY_USD ||
                securityConfig.tokenValidation?.minLiquidityUsd || '1000'),
            minPoolBalanceToken: Number.parseFloat(process.env.MIN_POOL_BALANCE_TOKEN ||
                securityConfig.tokenValidation?.minPoolBalanceToken || '100'),
            requireMetadata: process.env.REQUIRE_METADATA === 'true' ||
                securityConfig.tokenValidation?.requireMetadata || true,
            maxInitialPriceUsd: Number.parseFloat(process.env.MAX_INITIAL_PRICE_USD ||
                securityConfig.tokenValidation?.maxInitialPriceUsd || '0.01')
        },
        transactionSafety: {
            simulateBeforeSend: process.env.SIMULATE_BEFORE_SEND !== 'false',
            maxRetryCount: parseInt(process.env.TX_RETRY_COUNT ||
                securityConfig.transactionSafety?.maxRetryCount || '3'),
            maxPendingTx: parseInt(process.env.MAX_PENDING_TX ||
                securityConfig.transactionSafety?.maxPendingTx || '5')
        }
    };
}
/**
 * 获取通知配置
 */
function getNotificationConfig() {
    const notificationConfig = config_1.default.has('notification')
        ? config_1.default.get('notification')
        : {};
    return {
        telegram: {
            enabled: process.env.ENABLE_TELEGRAM_NOTIFICATIONS === 'true' ||
                notificationConfig.telegram?.enabled || false,
            botToken: process.env.TELEGRAM_BOT_TOKEN || null,
            chatId: process.env.TELEGRAM_CHAT_ID || null,
            events: notificationConfig.telegram?.events || {
                startup: true,
                newTokenDetected: true,
                buyExecuted: true,
                sellExecuted: true,
                error: true
            }
        }
    };
}
/**
 * 获取日志配置
 */
function getLoggingConfig() {
    const loggingConfig = config_1.default.has('logging')
        ? config_1.default.get('logging')
        : {};
    return {
        level: process.env.LOG_LEVEL || loggingConfig.level || 'info',
        console: process.env.LOG_TO_CONSOLE !== 'false',
        file: process.env.LOG_TO_FILE === 'true' || loggingConfig.file || false,
        filename: process.env.LOG_FILE_PATH || loggingConfig.filename || './logs/bot.log',
        maxFiles: parseInt(process.env.LOG_MAX_FILES || loggingConfig.maxFiles || '5'),
        maxSize: process.env.LOG_MAX_SIZE || loggingConfig.maxSize || '10m'
    };
}
/**
 * 获取Jito MEV配置
 */
function getJitoConfig() {
    const jitoConfig = config_1.default.has('jitoMev')
        ? config_1.default.get('jitoMev')
        : {};
    return {
        enabled: process.env.USE_JITO_BUNDLE === 'true' || jitoConfig.enabled || false,
        tipPercent: parseInt(process.env.JITO_TIP_PERCENT || jitoConfig.tipPercent || '80'),
        authKeypair: process.env.JITO_AUTH_KEYPAIR || null
    };
}
/**
 * 构建完整配置
 */
function buildConfig() {
    return {
        network: getNetworkConfig(),
        wallet: getWalletConfig(),
        dexes: getDexesConfig(),
        monitoring: getMonitoringConfig(),
        trading: getTradingConfig(),
        security: getSecurityConfig(),
        notification: getNotificationConfig(),
        logging: getLoggingConfig(),
        jitoMev: getJitoConfig()
    };
}
/**
 * 验证配置是否有效
 */
function validateConfig(config) {
    // 验证必要的网络设置
    if (!config.network.rpcUrl) {
        throw new Error('未设置Solana RPC URL，请在.env文件或配置文件中设置SOLANA_RPC_URL');
    }
    // 验证钱包设置
    if (!config.wallet.privateKey) {
        throw new Error('未设置钱包私钥，请在.env文件中设置WALLET_PRIVATE_KEY');
    }
    // 创建日志目录(如果不存在)
    if (config.logging.file) {
        const logDir = node_path_1.default.dirname(config.logging.filename);
        fs_extra_1.default.ensureDirSync(logDir);
    }
    return true;
}
// 构建并导出配置
exports.appConfig = buildConfig();
// 验证配置
validateConfig(exports.appConfig);
exports.default = exports.appConfig;
//# sourceMappingURL=config.js.map