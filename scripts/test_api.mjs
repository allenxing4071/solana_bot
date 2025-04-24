import axios from 'axios';
import chalk from 'chalk';

const API_BASE_URL = 'http://localhost:8080/api';

// 测试结果存储
const testResults = {
    success: [],
    failed: []
};

// 测试单个接口
async function testEndpoint(endpoint, method = 'GET', data = null) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await axios({
            method,
            url,
            data
        });
        
        if (response.status >= 200 && response.status < 300) {
            testResults.success.push({
                endpoint,
                status: response.status,
                data: response.data
            });
            return true;
        } else {
            testResults.failed.push({
                endpoint,
                status: response.status,
                error: response.statusText
            });
            return false;
        }
    } catch (error) {
        testResults.failed.push({
            endpoint,
            error: error.message
        });
        return false;
    }
}

// 打印测试结果
function printResults() {
    console.log('\n=== API 测试结果 ===\n');
    
    // 打印成功的接口
    console.log(chalk.green('✓ 成功的接口:'));
    testResults.success.forEach(result => {
        console.log(chalk.green(`  ${result.endpoint}`));
        console.log(`    状态码: ${result.status}`);
        console.log('    数据:', JSON.stringify(result.data, null, 2));
        console.log('');
    });
    
    // 打印失败的接口
    if (testResults.failed.length > 0) {
        console.log(chalk.red('✗ 失败的接口:'));
        testResults.failed.forEach(result => {
            console.log(chalk.red(`  ${result.endpoint}`));
            if (result.status) {
                console.log(`    状态码: ${result.status}`);
            }
            console.log(`    错误: ${result.error}`);
            console.log('');
        });
    }
}

// 运行所有测试
async function runTests() {
    console.log('开始测试API接口...\n');
    
    // 系统状态接口
    await testEndpoint('/status');
    await testEndpoint('/memory');
    await testEndpoint('/start');
    await testEndpoint('/stop');
    await testEndpoint('/optimize');
    await testEndpoint('/health');
    
    // 代币相关接口
    await testEndpoint('/tokens');
    await testEndpoint('/tokens/all');
    await testEndpoint('/tokens/blacklist');
    await testEndpoint('/tokens/details');
    
    // 流动性池接口
    await testEndpoint('/pools');
    await testEndpoint('/pools/stats');
    
    // 交易相关接口
    await testEndpoint('/transactions');
    await testEndpoint('/transactions/recent');
    
    // 统计接口
    await testEndpoint('/stats/profit/trend');
    await testEndpoint('/stats/token/trend');
    await testEndpoint('/stats/profit/summary');
    await testEndpoint('/stats/system');
    await testEndpoint('/stats/transactions');
    await testEndpoint('/stats/tokens');
    
    // 设置接口
    await testEndpoint('/settings');
    
    // 打印结果
    printResults();
}

// 运行测试
runTests().catch(error => {
    console.error('测试过程中发生错误:', error);
}); 