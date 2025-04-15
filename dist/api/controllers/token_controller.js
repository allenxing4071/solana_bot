"use strict";
/**
 * 代币控制器
 * 处理与代币黑名单/白名单相关的所有请求
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTokens = exports.validateToken = exports.removeFromWhitelist = exports.addToWhitelist = exports.getWhitelist = exports.removeFromBlacklist = exports.addToBlacklist = exports.getBlacklist = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const web3_js_1 = require("@solana/web3.js");
const config_1 = __importDefault(require("../../core/config"));
const logger_1 = __importDefault(require("../../core/logger"));
const token_validator_1 = __importDefault(require("../../modules/analyzer/token_validator"));
const risk_manager_1 = __importDefault(require("../../modules/risk/risk_manager"));
// 模块名称
const MODULE_NAME = 'TokenController';
// 黑名单和白名单文件路径
const blacklistPath = config_1.default.security.tokenValidation.blacklistPath;
const whitelistPath = config_1.default.security.tokenValidation.whitelistPath;
/**
 * 读取代币文件内容
 * @param filePath 文件路径
 * @returns 文件内容
 */
async function readTokenFile(filePath) {
    try {
        if (!fs_extra_1.default.existsSync(filePath)) {
            await fs_extra_1.default.ensureFile(filePath);
            await fs_extra_1.default.writeJson(filePath, [], { spaces: 2 });
            return '[]';
        }
        const data = await fs_extra_1.default.readFile(filePath, 'utf-8');
        return data;
    }
    catch (error) {
        logger_1.default.error(`读取代币文件失败: ${filePath}`, MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        return '[]';
    }
}
/**
 * 解析代币列表
 * @param data 代币列表JSON字符串
 * @returns 解析后的代币数组
 */
function parseTokenList(data) {
    try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch (error) {
        logger_1.default.error('解析代币列表失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        return [];
    }
}
/**
 * 加载黑名单文件内容
 * @returns 黑名单数组
 */
async function loadBlacklistFile() {
    try {
        if (!fs_extra_1.default.existsSync(blacklistPath)) {
            await fs_extra_1.default.ensureFile(blacklistPath);
            await fs_extra_1.default.writeJson(blacklistPath, [], { spaces: 2 });
            return [];
        }
        const data = await fs_extra_1.default.readJson(blacklistPath);
        return Array.isArray(data) ? data : [];
    }
    catch (error) {
        logger_1.default.error(`加载黑名单文件失败: ${blacklistPath}`, MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        return [];
    }
}
/**
 * 保存黑名单到文件
 * @param blacklist 黑名单数组
 */
async function saveBlacklistFile(blacklist) {
    try {
        await fs_extra_1.default.ensureFile(blacklistPath);
        await fs_extra_1.default.writeJson(blacklistPath, blacklist, { spaces: 2 });
        logger_1.default.info(`黑名单已成功保存到: ${blacklistPath}`, MODULE_NAME);
        return true;
    }
    catch (error) {
        logger_1.default.error(`保存黑名单失败: ${blacklistPath}`, MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        return false;
    }
}
/**
 * 加载白名单文件内容
 * @returns 白名单数组
 */
async function loadWhitelistFile() {
    try {
        if (!fs_extra_1.default.existsSync(whitelistPath)) {
            await fs_extra_1.default.ensureFile(whitelistPath);
            await fs_extra_1.default.writeJson(whitelistPath, [], { spaces: 2 });
            return [];
        }
        const data = await fs_extra_1.default.readJson(whitelistPath);
        return Array.isArray(data) ? data : [];
    }
    catch (error) {
        logger_1.default.error(`加载白名单文件失败: ${whitelistPath}`, MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        return [];
    }
}
/**
 * 保存白名单到文件
 * @param whitelist 白名单数组
 */
async function saveWhitelistFile(whitelist) {
    try {
        await fs_extra_1.default.ensureFile(whitelistPath);
        await fs_extra_1.default.writeJson(whitelistPath, whitelist, { spaces: 2 });
        logger_1.default.info(`白名单已成功保存到: ${whitelistPath}`, MODULE_NAME);
        return true;
    }
    catch (error) {
        logger_1.default.error(`保存白名单失败: ${whitelistPath}`, MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        return false;
    }
}
/**
 * 获取所有黑名单代币
 * @param req 请求对象
 * @param res 响应对象
 *
 * @api {get} /api/tokens/blacklist 获取所有黑名单代币
 * @apiName GetBlacklist
 * @apiGroup Token
 * @apiVersion 1.0.0
 * @apiDescription 获取当前所有黑名单代币列表
 *
 * @apiSuccess {Boolean} success 操作是否成功
 * @apiSuccess {Number} count 黑名单代币数量
 * @apiSuccess {Array} data 黑名单代币数组
 * @apiSuccess {String} data.mint 代币Mint地址
 * @apiSuccess {String} [data.symbol] 代币符号
 * @apiSuccess {String} [data.name] 代币名称
 * @apiSuccess {String} [data.reason] 加入黑名单的原因
 *
 * @apiSuccessExample {json} 成功响应:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "count": 2,
 *       "data": [
 *         {
 *           "mint": "ExampleBadToken111111111111111111111111111",
 *           "symbol": "SCAM",
 *           "name": "Scam Token Example",
 *           "reason": "已知诈骗项目"
 *         },
 *         {
 *           "mint": "AnotherBadToken22222222222222222222222222",
 *           "symbol": "RUG",
 *           "name": "Rug Pull Example",
 *           "reason": "流动性过低，可能是Rug Pull"
 *         }
 *       ]
 *     }
 */
const getBlacklist = async (_req, res) => {
    try {
        const blacklist = await loadBlacklistFile();
        res.status(200).json({
            success: true,
            count: blacklist.length,
            data: blacklist
        });
    }
    catch (error) {
        logger_1.default.error('获取黑名单失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            success: false,
            error: '获取黑名单失败'
        });
    }
};
exports.getBlacklist = getBlacklist;
/**
 * 添加代币到黑名单
 * @param req 请求对象
 * @param res 响应对象
 *
 * @api {post} /api/tokens/blacklist 添加代币到黑名单
 * @apiName AddToBlacklist
 * @apiGroup Token
 * @apiVersion 1.0.0
 * @apiDescription 将代币添加到黑名单，如果已存在则更新信息
 *
 * @apiParam {String} mint 代币Mint地址（必填）
 * @apiParam {String} [symbol] 代币符号
 * @apiParam {String} [name] 代币名称
 * @apiParam {String} [reason] 添加原因
 *
 * @apiParamExample {json} 请求示例:
 *     {
 *       "mint": "ExampleBadToken111111111111111111111111111",
 *       "symbol": "SCAM",
 *       "name": "Scam Token Example",
 *       "reason": "已知诈骗项目"
 *     }
 *
 * @apiSuccess {Boolean} success 操作是否成功
 * @apiSuccess {String} message 操作结果消息
 * @apiSuccess {Object} data 添加/更新的黑名单条目
 *
 * @apiSuccessExample {json} 成功响应 (新增):
 *     HTTP/1.1 201 Created
 *     {
 *       "success": true,
 *       "message": "代币已成功添加到黑名单",
 *       "data": {
 *         "mint": "ExampleBadToken111111111111111111111111111",
 *         "symbol": "SCAM",
 *         "name": "Scam Token Example",
 *         "reason": "已知诈骗项目"
 *       }
 *     }
 *
 * @apiSuccessExample {json} 成功响应 (更新):
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "代币信息已在黑名单中更新",
 *       "data": {
 *         "mint": "ExampleBadToken111111111111111111111111111",
 *         "symbol": "SCAM",
 *         "name": "Scam Token Example",
 *         "reason": "已知诈骗项目 - 已更新"
 *       }
 *     }
 *
 * @apiError {Boolean} success 操作结果 (false)
 * @apiError {String} error 错误信息
 *
 * @apiErrorExample {json} 错误响应 (缺少参数):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "error": "缺少mint地址参数"
 *     }
 *
 * @apiErrorExample {json} 错误响应 (格式错误):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "error": "无效的Solana地址格式"
 *     }
 */
const addToBlacklist = async (req, res) => {
    try {
        // 验证请求体
        const { mint, symbol, name, reason } = req.body;
        if (!mint) {
            res.status(400).json({
                success: false,
                error: '缺少mint地址参数'
            });
            return;
        }
        // 验证Mint地址是否有效
        try {
            new web3_js_1.PublicKey(mint);
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: '无效的Solana地址格式'
            });
            return;
        }
        // 加载现有黑名单
        const blacklist = await loadBlacklistFile();
        // 检查代币是否已在黑名单中
        const existingIndex = blacklist.findIndex(item => item.mint.toLowerCase() === mint.toLowerCase());
        if (existingIndex !== -1) {
            // 更新现有条目
            blacklist[existingIndex] = {
                ...blacklist[existingIndex],
                symbol: symbol || blacklist[existingIndex].symbol,
                name: name || blacklist[existingIndex].name,
                reason: reason || blacklist[existingIndex].reason
            };
            await saveBlacklistFile(blacklist);
            res.status(200).json({
                success: true,
                message: '代币信息已在黑名单中更新',
                data: blacklist[existingIndex]
            });
        }
        else {
            // 添加新条目
            const newEntry = {
                mint,
                ...(symbol && { symbol }),
                ...(name && { name }),
                ...(reason && { reason })
            };
            blacklist.push(newEntry);
            await saveBlacklistFile(blacklist);
            // 同时更新内存中的黑名单
            risk_manager_1.default.addToBlacklist(mint, reason || '通过API添加');
            res.status(201).json({
                success: true,
                message: '代币已成功添加到黑名单',
                data: newEntry
            });
        }
    }
    catch (error) {
        logger_1.default.error('添加代币到黑名单失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            success: false,
            error: '添加代币到黑名单失败'
        });
    }
};
exports.addToBlacklist = addToBlacklist;
/**
 * 从黑名单中移除代币
 * @param req 请求对象
 * @param res 响应对象
 */
const removeFromBlacklist = async (req, res) => {
    try {
        const { mint } = req.params;
        if (!mint) {
            res.status(400).json({
                success: false,
                error: '缺少mint参数'
            });
            return;
        }
        // 加载现有黑名单
        const blacklist = await loadBlacklistFile();
        // 查找并移除代币
        const initialLength = blacklist.length;
        const filteredBlacklist = blacklist.filter(item => item.mint.toLowerCase() !== mint.toLowerCase());
        if (filteredBlacklist.length === initialLength) {
            res.status(404).json({
                success: false,
                error: '代币不在黑名单中'
            });
            return;
        }
        // 保存更新后的黑名单
        await saveBlacklistFile(filteredBlacklist);
        // 同时更新内存中的黑名单
        risk_manager_1.default.removeFromBlacklist(mint);
        res.status(200).json({
            success: true,
            message: '代币已从黑名单中移除',
            data: { mint }
        });
    }
    catch (error) {
        logger_1.default.error('从黑名单移除代币失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            success: false,
            error: '从黑名单移除代币失败'
        });
    }
};
exports.removeFromBlacklist = removeFromBlacklist;
/**
 * 获取所有白名单代币
 * @param req 请求对象
 * @param res 响应对象
 */
const getWhitelist = async (_req, res) => {
    try {
        const whitelist = await loadWhitelistFile();
        res.status(200).json({
            success: true,
            count: whitelist.length,
            data: whitelist
        });
    }
    catch (error) {
        logger_1.default.error('获取白名单失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            success: false,
            error: '获取白名单失败'
        });
    }
};
exports.getWhitelist = getWhitelist;
/**
 * 添加代币到白名单
 * @param req 请求对象
 * @param res 响应对象
 */
const addToWhitelist = async (req, res) => {
    try {
        // 验证请求体
        const { mint, symbol, name, trusted } = req.body;
        if (!mint) {
            res.status(400).json({
                success: false,
                error: '缺少mint地址参数'
            });
            return;
        }
        // 验证Mint地址是否有效
        try {
            new web3_js_1.PublicKey(mint);
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: '无效的Solana地址格式'
            });
            return;
        }
        // 加载现有白名单
        const whitelist = await loadWhitelistFile();
        // 检查代币是否已在白名单中
        const existingIndex = whitelist.findIndex(item => item.mint.toLowerCase() === mint.toLowerCase());
        if (existingIndex !== -1) {
            // 更新现有条目
            whitelist[existingIndex] = {
                ...whitelist[existingIndex],
                symbol: symbol || whitelist[existingIndex].symbol,
                name: name || whitelist[existingIndex].name,
                trusted: trusted !== undefined ? trusted : whitelist[existingIndex].trusted
            };
            await saveWhitelistFile(whitelist);
            res.status(200).json({
                success: true,
                message: '代币信息已在白名单中更新',
                data: whitelist[existingIndex]
            });
        }
        else {
            // 添加新条目
            const newEntry = {
                mint,
                ...(symbol && { symbol }),
                ...(name && { name }),
                ...(trusted !== undefined && { trusted })
            };
            whitelist.push(newEntry);
            await saveWhitelistFile(whitelist);
            res.status(201).json({
                success: true,
                message: '代币已成功添加到白名单',
                data: newEntry
            });
        }
    }
    catch (error) {
        logger_1.default.error('添加代币到白名单失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            success: false,
            error: '添加代币到白名单失败'
        });
    }
};
exports.addToWhitelist = addToWhitelist;
/**
 * 从白名单中移除代币
 * @param req 请求对象
 * @param res 响应对象
 */
const removeFromWhitelist = async (req, res) => {
    try {
        const { mint } = req.params;
        if (!mint) {
            res.status(400).json({
                success: false,
                error: '缺少mint参数'
            });
            return;
        }
        // 加载现有白名单
        const whitelist = await loadWhitelistFile();
        // 查找并移除代币
        const initialLength = whitelist.length;
        const filteredWhitelist = whitelist.filter(item => item.mint.toLowerCase() !== mint.toLowerCase());
        if (filteredWhitelist.length === initialLength) {
            res.status(404).json({
                success: false,
                error: '代币不在白名单中'
            });
            return;
        }
        // 保存更新后的白名单
        await saveWhitelistFile(filteredWhitelist);
        res.status(200).json({
            success: true,
            message: '代币已从白名单中移除',
            data: { mint }
        });
    }
    catch (error) {
        logger_1.default.error('从白名单移除代币失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            success: false,
            error: '从白名单移除代币失败'
        });
    }
};
exports.removeFromWhitelist = removeFromWhitelist;
/**
 * 验证代币是否在白名单或黑名单中
 * @param req 请求对象
 * @param res 响应对象
 */
const validateToken = async (req, res) => {
    try {
        const { mint } = req.params;
        if (!mint) {
            res.status(400).json({
                success: false,
                error: '缺少mint参数'
            });
            return;
        }
        // 验证Mint地址是否有效
        try {
            new web3_js_1.PublicKey(mint);
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: '无效的Solana地址格式'
            });
            return;
        }
        // 检查黑白名单状态
        const isWhitelisted = token_validator_1.default.isWhitelisted(mint);
        const isBlacklisted = token_validator_1.default.isBlacklisted(mint) || risk_manager_1.default.isBlacklisted(mint);
        res.status(200).json({
            success: true,
            data: {
                mint,
                isWhitelisted,
                isBlacklisted,
                status: isBlacklisted ? 'blacklisted' : (isWhitelisted ? 'whitelisted' : 'unknown')
            }
        });
    }
    catch (error) {
        logger_1.default.error('验证代币状态失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            success: false,
            error: '验证代币状态失败'
        });
    }
};
exports.validateToken = validateToken;
/**
 * 获取所有代币列表
 * @param req 请求对象
 * @param res 响应对象
 */
const getAllTokens = async (req, res) => {
    try {
        // 获取分页和搜索参数
        const page = Number.parseInt(req.query.page) || 1;
        const limit = Number.parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const type = req.query.type || 'all';
        // 获取白名单和黑名单
        const whitelistRaw = await readTokenFile(whitelistPath);
        const blacklistRaw = await readTokenFile(blacklistPath);
        // 转换为TokenInfo数组
        const whitelist = parseTokenList(whitelistRaw);
        const blacklist = parseTokenList(blacklistRaw);
        // 将所有代币合并到一个数组中
        let allTokens = [
            ...whitelist.map(token => ({
                ...token,
                type: 'whitelist',
                mint: token?.mint || ''
            })),
            ...blacklist.map(token => ({
                ...token,
                type: 'blacklist',
                mint: token?.mint || ''
            }))
        ];
        // 应用搜索过滤
        if (search) {
            allTokens = allTokens.filter(token => (token.symbol?.toLowerCase().includes(search.toLowerCase())) ||
                (token.name?.toLowerCase().includes(search.toLowerCase())) ||
                token.mint.toString().includes(search));
        }
        // 按类型过滤
        if (type !== 'all') {
            allTokens = allTokens.filter(token => token.type === type);
        }
        // 计算总数据量和总页数
        const totalItems = allTokens.length;
        const totalPages = Math.ceil(totalItems / limit);
        // 分页处理
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedTokens = allTokens.slice(startIndex, endIndex);
        res.status(200).json({
            success: true,
            count: totalItems,
            page,
            totalPages,
            limit,
            data: paginatedTokens
        });
    }
    catch (error) {
        logger_1.default.error('获取代币列表失败', MODULE_NAME, {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            success: false,
            error: '获取代币列表失败'
        });
    }
};
exports.getAllTokens = getAllTokens;
//# sourceMappingURL=token_controller.js.map