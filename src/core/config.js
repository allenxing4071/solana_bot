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
var config_1 = __importDefault(require("config"));
var dotenv_1 = __importDefault(require("dotenv"));
var node_path_1 = __importDefault(require("node:path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var types_1 = require("./types");
// 加载环境变量
dotenv_1.default.config();
/**
 * 获取网络配置
 */
function getNetworkConfig() {
    var _a;
    // 获取主RPC节点
    var rpcUrl = process.env.SOLANA_RPC_URL || '';
    var wsUrl = process.env.SOLANA_WS_URL || '';
    // 如果主RPC节点为空，或者明确标记为使用备用节点，则使用备用节点
    var useBackup = !rpcUrl || process.env.USE_BACKUP_RPC === 'true';
    if (useBackup) {
        // 从环境变量中获取备用节点列表
        var backupEndpoints = ((_a = process.env.BACKUP_RPC_ENDPOINTS) === null || _a === void 0 ? void 0 : _a.split(',')) || [];
        // 如果有备用节点，使用第一个可用的备用节点
        if (backupEndpoints.length > 0) {
            rpcUrl = backupEndpoints[0].trim();
            // 对于WebSocket，我们尝试将http替换为ws，https替换为wss
            wsUrl = rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');
        }
    }
    return {
        cluster: process.env.SOLANA_NETWORK || config_1.default.get('network.cluster'),
        rpcUrl: rpcUrl,
        wsUrl: wsUrl,
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
    var dexes = [];
    // 从config文件获取DEX列表
    if (config_1.default.has('monitoring.poolMonitor.targets')) {
        var targets = config_1.default.get('monitoring.poolMonitor.targets');
        for (var _i = 0, targets_1 = targets; _i < targets_1.length; _i++) {
            var target = targets_1[_i];
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7;
    var tradingConfig = config_1.default.has('trading')
        ? config_1.default.get('trading')
        : {};
    return {
        buyStrategy: {
            enabled: process.env.ENABLE_BUY_STRATEGY !== 'false',
            maxAmountPerTrade: Number.parseFloat(process.env.BUY_AMOUNT_SOL ||
                ((_a = tradingConfig.buyStrategy) === null || _a === void 0 ? void 0 : _a.maxAmountPerTrade) || '0.1'),
            maxSlippage: Number.parseFloat(process.env.MAX_BUY_SLIPPAGE ||
                ((_b = tradingConfig.buyStrategy) === null || _b === void 0 ? void 0 : _b.maxSlippage) || '5'),
            minConfidence: Number.parseFloat(process.env.MIN_CONFIDENCE ||
                ((_c = tradingConfig.buyStrategy) === null || _c === void 0 ? void 0 : _c.minConfidence) || '0.7'),
            priorityFee: {
                enabled: process.env.TX_PRIORITY_FEE ? true :
                    ((_e = (_d = tradingConfig.buyStrategy) === null || _d === void 0 ? void 0 : _d.priorityFee) === null || _e === void 0 ? void 0 : _e.enabled) || false,
                multiplier: Number.parseFloat(process.env.TX_PRIORITY_FEE_MULTIPLIER ||
                    ((_g = (_f = tradingConfig.buyStrategy) === null || _f === void 0 ? void 0 : _f.priorityFee) === null || _g === void 0 ? void 0 : _g.multiplier) || '1.5'),
                baseFee: Number.parseFloat(process.env.TX_PRIORITY_FEE ||
                    ((_j = (_h = tradingConfig.buyStrategy) === null || _h === void 0 ? void 0 : _h.priorityFee) === null || _j === void 0 ? void 0 : _j.baseFee) || '0.000005'),
                maxFee: Number.parseFloat(process.env.TX_MAX_PRIORITY_FEE ||
                    ((_l = (_k = tradingConfig.buyStrategy) === null || _k === void 0 ? void 0 : _k.priorityFee) === null || _l === void 0 ? void 0 : _l.maxFee) || '0.00005')
            }
        },
        sellStrategy: {
            enabled: process.env.ENABLE_SELL_STRATEGY !== 'false',
            conditions: [
                {
                    type: types_1.StrategyType.TAKE_PROFIT,
                    percentage: Number(((_o = (_m = tradingConfig.sellStrategy) === null || _m === void 0 ? void 0 : _m.takeProfit) === null || _o === void 0 ? void 0 : _o.percentage) || '20'),
                    enabled: (_r = (_q = (_p = tradingConfig.sellStrategy) === null || _p === void 0 ? void 0 : _p.takeProfit) === null || _q === void 0 ? void 0 : _q.enabled) !== null && _r !== void 0 ? _r : true
                },
                {
                    type: types_1.StrategyType.STOP_LOSS,
                    percentage: Number(((_t = (_s = tradingConfig.sellStrategy) === null || _s === void 0 ? void 0 : _s.stopLoss) === null || _t === void 0 ? void 0 : _t.percentage) || '10'),
                    enabled: (_w = (_v = (_u = tradingConfig.sellStrategy) === null || _u === void 0 ? void 0 : _u.stopLoss) === null || _v === void 0 ? void 0 : _v.enabled) !== null && _w !== void 0 ? _w : true
                },
                {
                    type: types_1.StrategyType.TRAILING_STOP,
                    percentage: Number(((_y = (_x = tradingConfig.sellStrategy) === null || _x === void 0 ? void 0 : _x.trailingStop) === null || _y === void 0 ? void 0 : _y.percentage) || '5'),
                    enabled: (_1 = (_0 = (_z = tradingConfig.sellStrategy) === null || _z === void 0 ? void 0 : _z.trailingStop) === null || _0 === void 0 ? void 0 : _0.enabled) !== null && _1 !== void 0 ? _1 : false
                },
                {
                    type: types_1.StrategyType.TIME_LIMIT,
                    timeSeconds: Number(((_3 = (_2 = tradingConfig.sellStrategy) === null || _2 === void 0 ? void 0 : _2.timeLimit) === null || _3 === void 0 ? void 0 : _3.seconds) || '300'),
                    enabled: (_6 = (_5 = (_4 = tradingConfig.sellStrategy) === null || _4 === void 0 ? void 0 : _4.timeLimit) === null || _5 === void 0 ? void 0 : _5.enabled) !== null && _6 !== void 0 ? _6 : false
                }
            ],
            maxSlippage: Number.parseFloat(process.env.MAX_SELL_SLIPPAGE ||
                ((_7 = tradingConfig.sellStrategy) === null || _7 === void 0 ? void 0 : _7.maxSlippage) || '5')
        },
        txRetryCount: parseInt(process.env.TX_RETRY_COUNT || tradingConfig.txRetryCount || '3'),
        txConfirmTimeout: parseInt(process.env.TX_CONFIRM_TIMEOUT || tradingConfig.txConfirmTimeout || '60000')
    };
}
/**
 * 获取安全配置
 */
function getSecurityConfig() {
    var _a, _b, _c, _d, _e, _f, _g;
    var securityConfig = config_1.default.has('security')
        ? config_1.default.get('security')
        : {};
    return {
        tokenValidation: {
            useWhitelist: process.env.USE_WHITELIST === 'true' ||
                ((_a = securityConfig.tokenValidation) === null || _a === void 0 ? void 0 : _a.useWhitelist) || false,
            useBlacklist: process.env.USE_BLACKLIST !== 'false', // 默认启用黑名单
            whitelistPath: process.env.TOKEN_WHITELIST_PATH || './config/whitelist.json',
            blacklistPath: process.env.TOKEN_BLACKLIST_PATH || './config/blacklist.json',
            minLiquidityUsd: Number.parseFloat(process.env.MIN_LIQUIDITY_USD ||
                ((_b = securityConfig.tokenValidation) === null || _b === void 0 ? void 0 : _b.minLiquidityUsd) || '1000'),
            minPoolBalanceToken: Number.parseFloat(process.env.MIN_POOL_BALANCE_TOKEN ||
                ((_c = securityConfig.tokenValidation) === null || _c === void 0 ? void 0 : _c.minPoolBalanceToken) || '100'),
            requireMetadata: process.env.REQUIRE_METADATA === 'true' ||
                ((_d = securityConfig.tokenValidation) === null || _d === void 0 ? void 0 : _d.requireMetadata) || true,
            maxInitialPriceUsd: Number.parseFloat(process.env.MAX_INITIAL_PRICE_USD ||
                ((_e = securityConfig.tokenValidation) === null || _e === void 0 ? void 0 : _e.maxInitialPriceUsd) || '0.01')
        },
        transactionSafety: {
            simulateBeforeSend: process.env.SIMULATE_BEFORE_SEND !== 'false',
            maxRetryCount: parseInt(process.env.TX_RETRY_COUNT ||
                ((_f = securityConfig.transactionSafety) === null || _f === void 0 ? void 0 : _f.maxRetryCount) || '3'),
            maxPendingTx: parseInt(process.env.MAX_PENDING_TX ||
                ((_g = securityConfig.transactionSafety) === null || _g === void 0 ? void 0 : _g.maxPendingTx) || '5')
        }
    };
}
/**
 * 获取通知配置
 */
function getNotificationConfig() {
    var _a, _b;
    var notificationConfig = config_1.default.has('notification')
        ? config_1.default.get('notification')
        : {};
    return {
        telegram: {
            enabled: process.env.ENABLE_TELEGRAM_NOTIFICATIONS === 'true' ||
                ((_a = notificationConfig.telegram) === null || _a === void 0 ? void 0 : _a.enabled) || false,
            botToken: process.env.TELEGRAM_BOT_TOKEN || null,
            chatId: process.env.TELEGRAM_CHAT_ID || null,
            events: ((_b = notificationConfig.telegram) === null || _b === void 0 ? void 0 : _b.events) || {
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
    var loggingConfig = config_1.default.has('logging')
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
    var jitoConfig = config_1.default.has('jitoMev')
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
        var logDir = node_path_1.default.dirname(config.logging.filename);
        fs_extra_1.default.ensureDirSync(logDir);
    }
    return true;
}
// 构建并导出配置
exports.appConfig = buildConfig();
// 验证配置
validateConfig(exports.appConfig);
exports.default = exports.appConfig;
