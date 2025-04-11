/**
 * 交易记录页面脚本
 * 用于管理和显示系统交易记录
 */

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 初始化页面
    initPage();
    
    // 加载交易数据
    loadTradesData();
    
    // 更新时间
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

/**
 * 初始化页面
 */
function initPage() {
    console.log('初始化交易记录页面...');
    
    // 绑定搜索和筛选事件
    document.getElementById('tradeFilter').addEventListener('input', filterTrades);
    document.getElementById('tradeStatusFilter').addEventListener('change', filterTrades);
    document.getElementById('tradeTypeFilter').addEventListener('change', filterTrades);
    
    // 绑定导出数据按钮事件
    document.getElementById('exportTradesBtn').addEventListener('click', exportTradesData);
    
    // 绑定分页按钮事件
    document.getElementById('prevPageBtn').addEventListener('click', goToPrevPage);
    document.getElementById('nextPageBtn').addEventListener('click', goToNextPage);
    
    // 绑定交易详情模态框关闭按钮事件
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('tradeDetailModal').style.display = 'none';
    });
    
    document.getElementById('closeModalBtn').addEventListener('click', () => {
        document.getElementById('tradeDetailModal').style.display = 'none';
    });
    
    // 绑定查看区块浏览器按钮事件
    document.getElementById('viewExplorerBtn').addEventListener('click', viewInExplorer);
    
    // 初始化图表
    initCharts();
}

// 交易分页变量
let currentPage = 1;
let totalPages = 5;
const pageSize = 10;
let allTrades = [];
let filteredTrades = [];

/**
 * 加载交易数据
 */
async function loadTradesData() {
    try {
        console.log('加载交易数据...');
        showLoading();
        
        // 构建API请求参数
        const searchValue = document.getElementById('tradeFilter').value.trim();
        const statusValue = document.getElementById('tradeStatusFilter').value;
        const typeValue = document.getElementById('tradeTypeFilter').value;
        
        // 请求参数
        const options = {
            page: currentPage,
            limit: pageSize
        };
        
        // 添加搜索参数
        if (searchValue) {
            options.search = searchValue;
        }
        
        // 添加过滤参数
        if (statusValue !== 'all') {
            options.status = statusValue;
        }
        
        if (typeValue !== 'all') {
            options.type = typeValue;
        }
        
        // 构建API端点URL
        const endpoint = '/api/trades';
        
        // 使用统一的数据源加载方法
        const responseData = await getDataSource(endpoint, options, generateMockTrades, 50);
        
        // 检查响应是否成功
        if (!responseData.success) {
            throw new Error(responseData.error || '获取交易数据失败');
        }
        
        // 使用返回的数据
        filteredTrades = responseData.data;
        
        // 更新分页信息
        currentPage = responseData.page;
        totalPages = responseData.totalPages;
        const totalItems = responseData.count;
        
        // 更新分页UI
        updatePaginationInfo(currentPage, totalPages, totalItems);
        
        // 渲染数据表格
        renderTradesTable();
        
        // 如果这是第一次加载或需要刷新统计数据
        if (!allTrades.length || responseData.isBackupData) {
            // 尝试获取所有数据用于统计和图表
            try {
                // 尝试获取更多数据用于统计（无需分页）
                const allDataOptions = { limit: 1000 };
                const allDataResponse = await getDataSource(endpoint, allDataOptions, generateMockTrades, 1000);
                
                if (allDataResponse.success) {
                    allTrades = allDataResponse.data;
                }
            } catch (error) {
                console.warn('获取完整交易数据失败，使用当前数据进行统计:', error);
                allTrades = filteredTrades;
            }
            
            // 更新统计数据和图表
            updateTradeStats(allTrades);
            updateCharts(allTrades);
        }
        
        console.log('交易数据加载完成');
        hideLoading();
    } catch (error) {
        console.error('加载交易数据失败:', error);
        showError(`加载交易数据失败: ${error.message}`);
        hideLoading();
    }
}

/**
 * 生成模拟交易数据
 */
function generateMockTrades(count) {
    const trades = [];
    const tokenSymbols = ['SOL', 'BTC', 'ETH', 'JUP', 'RAY', 'mSOL', 'USDC', 'BONK', 'WIF', 'PYTH'];
    const statuses = ['success', 'failed', 'pending'];
    const types = ['buy', 'sell'];
    const pools = ['Orca', 'Raydium', 'Jupiter', 'Meteora', 'Drift'];
    
    // 更真实的价格
    const tokenPrices = {
        'SOL': { min: 98, max: 110 },
        'BTC': { min: 59000, max: 62000 },
        'ETH': { min: 2900, max: 3200 },
        'JUP': { min: 0.8, max: 1.2 },
        'RAY': { min: 0.4, max: 0.7 },
        'mSOL': { min: 100, max: 115 },
        'USDC': { min: 0.99, max: 1.01 },
        'BONK': { min: 0.00002, max: 0.00003 },
        'WIF': { min: 2.5, max: 3.5 },
        'PYTH': { min: 0.5, max: 0.8 }
    };
    
    // 获取随机价格
    const getRandomPrice = (token) => {
        const range = tokenPrices[token];
        return range.min + Math.random() * (range.max - range.min);
    };
    
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
        const tokenSymbol = tokenSymbols[Math.floor(Math.random() * tokenSymbols.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // 成功率设置为85%，更符合实际情况
        const statusRandom = Math.random();
        const status = statusRandom < 0.85 ? 'success' : 
                      statusRandom < 0.95 ? 'failed' : 'pending';
        
        // 根据代币类型设置合理的数量范围
        let amount;
        if (tokenSymbol === 'BTC') {
            amount = 0.001 + Math.random() * 0.05; // 小数量BTC
        } else if (tokenSymbol === 'ETH') {
            amount = 0.01 + Math.random() * 0.5; // 适量ETH
        } else if (tokenSymbol === 'SOL' || tokenSymbol === 'mSOL') {
            amount = 0.1 + Math.random() * 10; // 适量SOL
        } else if (tokenSymbol === 'USDC') {
            amount = 10 + Math.random() * 1000; // 较大数量稳定币
        } else if (tokenSymbol === 'BONK') {
            amount = 1000000 + Math.random() * 10000000; // 超大数量迷因币
        } else if (tokenSymbol === 'WIF') {
            amount = 10 + Math.random() * 200; // 中等数量迷因币
        } else {
            amount = 1 + Math.random() * 100; // 其他代币
        }
        
        const price = getRandomPrice(tokenSymbol);
        const value = amount * price;
        const fee = 0.000005 + Math.random() * 0.0001; // 交易费
        
        // 生成随机时间，最近7天内，时间分布更集中在最近几天
        const dayOffset = Math.random() ** 2 * 7; // 使用幂函数让时间更集中在最近
        const timestamp = new Date(now - dayOffset * 24 * 60 * 60 * 1000);
        
        // 生成符合Solana格式的交易ID
        const generateTxId = () => {
            let id = '';
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            for (let i = 0; i < 44; i++) {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return id;
        };
        
        const fullTxId = generateTxId();
        const shortTxId = `${fullTxId.substring(0, 7)}...${fullTxId.substring(fullTxId.length - 4)}`;
        
        // 随机交易池
        const pool = pools[Math.floor(Math.random() * pools.length)];
        
        trades.push({
            id: shortTxId,
            tokenSymbol,
            type,
            status,
            amount,
            price,
            value,
            fee,
            timestamp,
            fullTxId,
            pool
        });
    }
    
    // 按时间排序，最新的在前
    return trades.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * 更新交易统计数据
 */
function updateTradeStats(trades) {
    // 总交易数
    const totalTrades = trades.length;
    document.getElementById('totalTrades').textContent = totalTrades;
    
    // 成功率
    const successTrades = trades.filter(trade => trade.status === 'success').length;
    const successRate = totalTrades > 0 ? ((successTrades / totalTrades) * 100).toFixed(2) : '0.00';
    document.getElementById('successRate').textContent = `${successRate}%`;
    
    // 总收益
    const totalProfit = trades
        .filter(trade => trade.status === 'success')
        .reduce((sum, trade) => {
            // 买入交易算作支出，卖出交易算作收入
            return sum + (trade.type === 'sell' ? trade.value : -trade.value);
        }, 0);
    document.getElementById('totalProfit').textContent = `$${totalProfit.toFixed(2)}`;
    
    // 平均收益
    const avgProfit = successTrades > 0 ? (totalProfit / successTrades).toFixed(2) : '0.00';
    document.getElementById('avgProfit').textContent = `$${avgProfit}`;
}

/**
 * 初始化图表
 */
function initCharts() {
    try {
        // 检查是否有Chart全局对象（依赖于chart.min.js）
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js未找到，图表将不会显示');
            return;
        }
        
        // 交易量趋势图表
        const volumeChartCtx = document.getElementById('tradeVolumeChart');
        if (volumeChartCtx) {
            window.volumeChart = new Chart(volumeChartCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: '交易量 ($)',
                        data: [],
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        // 收益分析图表
        const profitChartCtx = document.getElementById('profitChart');
        if (profitChartCtx) {
            window.profitChart = new Chart(profitChartCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: '收益 ($)',
                        data: [],
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        tension: 0.1,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: false
                        }
                    }
                }
            });
        }
        
        // 绑定图表时间范围切换事件
        document.getElementById('tradeVolumeTimeRange').addEventListener('change', () => {
            updateCharts(allTrades);
        });
        
        document.getElementById('profitTimeRange').addEventListener('change', () => {
            updateCharts(allTrades);
        });
    } catch (error) {
        console.error('初始化图表失败:', error);
    }
}

/**
 * 更新图表
 */
function updateCharts(trades) {
    try {
        if (!window.volumeChart || !window.profitChart) {
            return;
        }
        
        const volumeTimeRange = document.getElementById('tradeVolumeTimeRange').value;
        const profitTimeRange = document.getElementById('profitTimeRange').value;
        
        // 交易量图表数据
        const volumeData = prepareChartData(trades, volumeTimeRange, 'volume');
        window.volumeChart.data.labels = volumeData.labels;
        window.volumeChart.data.datasets[0].data = volumeData.data;
        window.volumeChart.update();
        
        // 收益图表数据
        const profitData = prepareChartData(trades, profitTimeRange, 'profit');
        window.profitChart.data.labels = profitData.labels;
        window.profitChart.data.datasets[0].data = profitData.data;
        window.profitChart.update();
    } catch (error) {
        console.error('更新图表失败:', error);
    }
}

/**
 * 准备图表数据
 */
function prepareChartData(trades, timeRange, dataType) {
    const now = new Date();
    let startDate;
    const labels = [];
    const data = [];
    let groupBy;
    
    // 根据时间范围设置起始日期和分组方式
    if (timeRange === 'day') {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - 1);
        groupBy = 'hour';
    } else if (timeRange === 'week') {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - 7);
        groupBy = 'day';
    } else if (timeRange === 'month') {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - 30);
        groupBy = 'day';
    }
    
    // 过滤时间范围内的交易
    const filteredTrades = trades.filter(trade => new Date(trade.timestamp) >= startDate);
    
    // 根据分组方式创建标签和数据
    if (groupBy === 'hour') {
        // 按小时分组
        for (let i = 0; i < 24; i++) {
            const hour = `${i.toString().padStart(2, '0')}:00`;
            labels.push(hour);
            
            const hourStart = new Date(startDate);
            hourStart.setHours(startDate.getHours() + i, 0, 0, 0);
            
            const hourEnd = new Date(hourStart);
            hourEnd.setHours(hourStart.getHours() + 1, 0, 0, 0);
            
            const hourTrades = filteredTrades.filter(trade => 
                new Date(trade.timestamp) >= hourStart && 
                new Date(trade.timestamp) < hourEnd
            );
            
            if (dataType === 'volume') {
                // 计算交易量
                data.push(hourTrades.reduce((sum, trade) => sum + trade.value, 0).toFixed(2));
            } else if (dataType === 'profit') {
                // 计算收益
                data.push(hourTrades.reduce((sum, trade) => {
                    return sum + (trade.type === 'sell' ? trade.value : -trade.value);
                }, 0).toFixed(2));
            }
        }
    } else if (groupBy === 'day') {
        // 按天分组
        const days = timeRange === 'week' ? 7 : 30;
        
        for (let i = 0; i < days; i++) {
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + i);
            const label = `${dayDate.getMonth() + 1}/${dayDate.getDate()}`;
            labels.push(label);
            
            const dayStart = new Date(dayDate);
            dayStart.setHours(0, 0, 0, 0);
            
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayStart.getDate() + 1);
            
            const dayTrades = filteredTrades.filter(trade => 
                new Date(trade.timestamp) >= dayStart && 
                new Date(trade.timestamp) < dayEnd
            );
            
            if (dataType === 'volume') {
                // 计算交易量
                data.push(dayTrades.reduce((sum, trade) => sum + trade.value, 0).toFixed(2));
            } else if (dataType === 'profit') {
                // 计算收益
                data.push(dayTrades.reduce((sum, trade) => {
                    return sum + (trade.type === 'sell' ? trade.value : -trade.value);
                }, 0).toFixed(2));
            }
        }
    }
    
    return { labels, data };
}

/**
 * 过滤交易
 */
function filterTrades() {
    // 在服务端已经支持搜索和过滤的情况下，直接重新获取数据
    currentPage = 1; // 重置到第一页
    loadTradesData();
}

/**
 * 获取代币图标HTML
 * @param {string} tokenSymbol 代币符号
 * @returns {string} HTML字符串
 */
function getTokenIconHtml(tokenSymbol) {
    const defaultIcon = 'unknown.svg';
    const symbol = tokenSymbol.toLowerCase();
    
    return `
        <div style="display: flex; align-items: center;">
            <img src="img/tokens/${symbol}.svg" 
                onerror="this.onerror=null; this.src='img/tokens/${defaultIcon}'" 
                alt="${tokenSymbol}" 
                width="20" height="20" 
                style="border-radius: 50%; margin-right: 5px;">
            <span>${tokenSymbol}</span>
        </div>
    `;
}

/**
 * 渲染交易表格
 */
function renderTradesTable() {
    const tableBody = document.getElementById('tradesTableBody');
    
    // 计算当前页的数据
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredTrades.length);
    const pageData = filteredTrades.slice(startIndex, endIndex);
    
    if (pageData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center">没有找到匹配的交易记录</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    for (const trade of pageData) {
        const formattedDate = new Date(trade.timestamp).toLocaleString();
        const statusClass = trade.status === 'success' ? 'success' : 
                        trade.status === 'failed' ? 'failed' : 'pending';
        const typeClass = trade.type === 'buy' ? 'badge-success' : 'badge-danger';
        const typeText = trade.type === 'buy' ? '买入' : '卖出';
        
        html += `
            <tr>
                <td><a href="javascript:void(0)" onclick="viewTradeDetails('${trade.id}')" class="trade-id-link">${trade.id}</a></td>
                <td>${formattedDate}</td>
                <td>${getTokenIconHtml(trade.tokenSymbol)}</td>
                <td><span class="badge ${typeClass}">${typeText}</span></td>
                <td><span class="pool-info">${trade.pool || 'Unknown'}</span></td>
                <td>${trade.amount.toFixed(6)}</td>
                <td>$${trade.price.toFixed(2)}</td>
                <td>$${trade.value.toFixed(2)}</td>
                <td>${trade.fee.toFixed(6)} SOL</td>
                <td><span class="status ${statusClass}">${getStatusText(trade.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewTradeDetails('${trade.id}')">
                        详情
                    </button>
                </td>
            </tr>
        `;
    }
    
    tableBody.innerHTML = html;
}

/**
 * 获取状态文本
 */
function getStatusText(status) {
    switch (status) {
        case 'success': return '成功';
        case 'failed': return '失败';
        case 'pending': return '处理中';
        default: return '未知';
    }
}

/**
 * 更新分页导航
 */
function updatePagination() {
    const paginationInfo = document.querySelector('.pagination span');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    // 已被updatePaginationInfo函数替代
    updatePaginationInfo(currentPage, totalPages, filteredTrades.length);
}

/**
 * 更新分页信息
 * @param {number} page 当前页码
 * @param {number} totalPages 总页数
 * @param {number} totalItems 总项目数
 */
function updatePaginationInfo(page, totalPages, totalItems) {
    const paginationInfo = document.querySelector('.pagination span');
    if (paginationInfo) {
        paginationInfo.textContent = `第 ${page} 页，共 ${totalPages} 页 (${totalItems} 个结果)`;
    }
    
    // 更新翻页按钮状态
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    if (prevPageBtn) {
        prevPageBtn.disabled = page <= 1;
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = page >= totalPages;
    }
}

/**
 * 前往上一页
 */
function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadTradesData();
    }
}

/**
 * 前往下一页
 */
function goToNextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        loadTradesData();
    }
}

/**
 * 导出交易数据
 */
function exportTradesData() {
    const statusFilter = document.getElementById('tradeStatusFilter').value;
    const typeFilter = document.getElementById('tradeTypeFilter').value;
    
    let filename = 'trades_export';
    if (statusFilter !== 'all') filename += `_${statusFilter}`;
    if (typeFilter !== 'all') filename += `_${typeFilter}`;
    filename += `_${new Date().toISOString().slice(0, 10)}.csv`;
    
    // 构建CSV内容
    let csvContent = 'ID,时间,代币,类型,数量,价格,价值,费用,状态\n';
    
    for (const trade of filteredTrades) {
        const formattedDate = new Date(trade.timestamp).toLocaleString();
        const typeText = trade.type === 'buy' ? '买入' : '卖出';
        const statusText = getStatusText(trade.status);
        
        csvContent += `"${trade.id}","${formattedDate}","${trade.tokenSymbol}","${typeText}","${trade.amount.toFixed(6)}","$${trade.price.toFixed(2)}","$${trade.value.toFixed(2)}","${trade.fee.toFixed(6)} SOL","${statusText}"\n`;
    }
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('交易数据已导出');
}

/**
 * 查看交易详情
 */
function viewTradeDetails(tradeId) {
    // 查找交易数据
    const trade = allTrades.find(t => t.id === tradeId);
    
    if (!trade) {
        showError('未找到交易数据');
        return;
    }
    
    // 设置模态框标题
    document.getElementById('modalTradeId').textContent = `交易详情: ${trade.id}`;
    
    // 设置模态框内容
    const detailContent = document.getElementById('tradeDetailContent');
    
    // 构建详情HTML
    const formattedDate = new Date(trade.timestamp).toLocaleString();
    const statusClass = trade.status === 'success' ? 'success' : 
                     trade.status === 'failed' ? 'failed' : 'pending';
    const typeClass = trade.type === 'buy' ? 'badge-success' : 'badge-danger';
    const typeText = trade.type === 'buy' ? '买入' : '卖出';
    
    const detailHtml = `
        <div class="trade-detail-grid">
            <div class="detail-section">
                <h3>基本信息</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label>交易ID:</label>
                        <span>${trade.id}</span>
                    </div>
                    <div class="info-item">
                        <label>完整交易ID:</label>
                        <span class="monospace">${trade.fullTxId}</span>
                    </div>
                    <div class="info-item">
                        <label>时间:</label>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="info-item">
                        <label>状态:</label>
                        <span class="status ${statusClass}">${getStatusText(trade.status)}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>交易详情</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label>代币:</label>
                        ${getTokenIconHtml(trade.tokenSymbol)}
                    </div>
                    <div class="info-item">
                        <label>类型:</label>
                        <span class="badge ${typeClass}">${typeText}</span>
                    </div>
                    <div class="info-item">
                        <label>交易池:</label>
                        <span class="pool-info">${trade.pool || 'Unknown'}</span>
                    </div>
                    <div class="info-item">
                        <label>数量:</label>
                        <span>${trade.amount.toFixed(6)} ${trade.tokenSymbol}</span>
                    </div>
                    <div class="info-item">
                        <label>价格:</label>
                        <span>$${trade.price.toFixed(4)}</span>
                    </div>
                    <div class="info-item">
                        <label>总价值:</label>
                        <span>$${trade.value.toFixed(2)}</span>
                    </div>
                    <div class="info-item">
                        <label>交易费:</label>
                        <span>${trade.fee.toFixed(6)} SOL</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    detailContent.innerHTML = detailHtml;
    
    // 设置区块浏览器查看按钮
    document.getElementById('viewExplorerBtn').setAttribute('data-tx', trade.fullTxId);
    
    // 显示模态框
    document.getElementById('tradeDetailModal').style.display = 'block';
}

/**
 * 在区块浏览器中查看交易
 */
function viewInExplorer() {
    const txId = document.getElementById('viewExplorerBtn').getAttribute('data-tx');
    if (txId) {
        window.open(`https://solscan.io/tx/${txId}`, '_blank');
    }
}

/**
 * 显示错误消息
 * @param {string} message 错误消息
 */
function showError(message) {
    // 创建通知元素
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '1000';
        notification.style.color = 'white';
        document.body.appendChild(notification);
    }
    
    notification.style.backgroundColor = '#ef476f';
    notification.textContent = message;
    notification.style.display = 'block';
    
    // 3秒后隐藏
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

/**
 * 显示成功消息
 * @param {string} message 成功消息
 */
function showToast(message) {
    // 创建通知元素
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '1000';
        notification.style.color = 'white';
        document.body.appendChild(notification);
    }
    
    notification.style.backgroundColor = '#06d6a0';
    notification.textContent = message;
    notification.style.display = 'block';
    
    // 3秒后隐藏
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}
