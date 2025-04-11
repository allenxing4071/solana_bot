"use strict";
/**
 * Solana节点延迟测试工具
 * 用于测量本地到Solana RPC节点的网络延迟
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var web3_js_1 = require("@solana/web3.js");
var axios_1 = __importDefault(require("axios"));
// 节点信息
var RPC_ENDPOINTS = [
    { name: '当前配置节点', url: process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com' },
    { name: 'Solana主网', url: 'https://api.mainnet-beta.solana.com' },
    { name: 'GenesysGo', url: 'https://ssc-dao.genesysgo.net' },
    { name: 'Serum', url: 'https://solana-api.projectserum.com' },
    { name: 'QuickNode', url: 'https://solana-mainnet.rpc.extrnode.com' },
];
/**
 * 测量RPC调用延迟
 * @param endpoint RPC节点信息
 */
function measureRpcLatency(endpoint) {
    return __awaiter(this, void 0, void 0, function () {
        var connection, start1, latency1, start2, latency2, testWallet, start3, latency3, start4, latency4, avgLatency, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n\u6D4B\u8BD5\u8282\u70B9: ".concat(endpoint.name, " (").concat(endpoint.url, ")"));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    connection = new web3_js_1.Connection(endpoint.url);
                    // 测试1: 获取最新区块高度
                    console.log('测试1: 获取最新区块高度');
                    start1 = Date.now();
                    return [4 /*yield*/, connection.getSlot()];
                case 2:
                    _a.sent();
                    latency1 = Date.now() - start1;
                    console.log("\u5EF6\u8FDF: ".concat(latency1, "ms"));
                    // 测试2: 获取近期区块哈希
                    console.log('测试2: 获取近期区块哈希');
                    start2 = Date.now();
                    return [4 /*yield*/, connection.getLatestBlockhash()];
                case 3:
                    _a.sent();
                    latency2 = Date.now() - start2;
                    console.log("\u5EF6\u8FDF: ".concat(latency2, "ms"));
                    // 测试3: 获取余额查询
                    console.log('测试3: 获取余额查询');
                    testWallet = new web3_js_1.PublicKey('So11111111111111111111111111111111111111112');
                    start3 = Date.now();
                    return [4 /*yield*/, connection.getBalance(testWallet)];
                case 4:
                    _a.sent();
                    latency3 = Date.now() - start3;
                    console.log("\u5EF6\u8FDF: ".concat(latency3, "ms"));
                    // 测试4: PING测试 (简单HTTP请求)
                    console.log('测试4: PING测试');
                    start4 = Date.now();
                    return [4 /*yield*/, axios_1.default.post(endpoint.url, { jsonrpc: '2.0', id: 1, method: 'getHealth' })];
                case 5:
                    _a.sent();
                    latency4 = Date.now() - start4;
                    console.log("\u5EF6\u8FDF: ".concat(latency4, "ms"));
                    avgLatency = (latency1 + latency2 + latency3 + latency4) / 4;
                    console.log("\u5E73\u5747\u5EF6\u8FDF: ".concat(avgLatency.toFixed(2), "ms"));
                    return [2 /*return*/, {
                            name: endpoint.name,
                            url: endpoint.url,
                            latencies: { slot: latency1, blockhash: latency2, balance: latency3, ping: latency4 },
                            average: avgLatency
                        }];
                case 6:
                    error_1 = _a.sent();
                    console.error("\u6D4B\u8BD5\u5931\u8D25: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                    return [2 /*return*/, {
                            name: endpoint.name,
                            url: endpoint.url,
                            latencies: { slot: -1, blockhash: -1, balance: -1, ping: -1 },
                            average: -1,
                            error: error_1 instanceof Error ? error_1.message : String(error_1)
                        }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * 主函数
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var results, _i, RPC_ENDPOINTS_1, endpoint, result, _a, results_1, result, bestResult;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('===== Solana节点延迟测试 =====');
                    console.log('测试环境：本地机器到各Solana RPC节点的网络延迟');
                    console.log('测试项目：区块高度查询、区块哈希查询、余额查询、简单PING');
                    results = [];
                    _i = 0, RPC_ENDPOINTS_1 = RPC_ENDPOINTS;
                    _b.label = 1;
                case 1:
                    if (!(_i < RPC_ENDPOINTS_1.length)) return [3 /*break*/, 4];
                    endpoint = RPC_ENDPOINTS_1[_i];
                    return [4 /*yield*/, measureRpcLatency(endpoint)];
                case 2:
                    result = _b.sent();
                    results.push(result);
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    // 结果汇总
                    console.log('\n===== 测试结果汇总 =====');
                    results.sort(function (a, b) { return a.average - b.average; });
                    for (_a = 0, results_1 = results; _a < results_1.length; _a++) {
                        result = results_1[_a];
                        if (result.average > 0) {
                            console.log("".concat(result.name, ": \u5E73\u5747\u5EF6\u8FDF ").concat(result.average.toFixed(2), "ms"));
                        }
                        else {
                            console.log("".concat(result.name, ": \u8FDE\u63A5\u5931\u8D25 (").concat(result.error, ")"));
                        }
                    }
                    bestResult = results.find(function (r) { return r.average > 0; });
                    if (bestResult) {
                        console.log("\n\u6700\u4F73\u8282\u70B9: ".concat(bestResult.name, " (").concat(bestResult.url, "), \u5E73\u5747\u5EF6\u8FDF: ").concat(bestResult.average.toFixed(2), "ms"));
                        if (bestResult.average < 100) {
                            console.log('延迟评估: 极佳 - 适合高频MEV操作');
                        }
                        else if (bestResult.average < 200) {
                            console.log('延迟评估: 良好 - 适合一般MEV操作，但高频场景可能落后');
                        }
                        else if (bestResult.average < 500) {
                            console.log('延迟评估: 一般 - 可能会错过部分MEV机会');
                        }
                        else {
                            console.log('延迟评估: 较高 - 不建议用于MEV操作，建议更换节点或服务器位置');
                        }
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// 执行测试
main().catch(function (error) {
    console.error('测试过程中出现错误:', error);
    process.exit(1);
});
