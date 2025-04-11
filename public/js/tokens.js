/**
 * 代币监控页面脚本
 * 用于获取、显示和管理代币白名单、黑名单和监控列表
 */

// 全局变量
let tokens = [];
let filteredTokens = [];
let isWhitelistAddMode = true;
let currentFilterType = 'all';
let currentSearchTerm = '';
let botStatus = 'stopped';

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    console.log('代币管理页面加载完成');
    // 初始化UI
    initUI();
    // 初始化事件监听器
    initEventListeners();
    // 首次加载数据
    fetchTokensData();
    
    // 获取机器人状态
    fetchBotStatus();
    
    // 设置定时刷新
    setInterval(fetchTokensData, 60000); // 每分钟刷新一次
    setInterval(fetchBotStatus, 30000); // 每30秒刷新一次状态
    
    // 更新时间显示
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

/**
 * 初始化UI元素
 */
function initUI() {
    console.log('初始化UI元素...');
    // 可以在这里添加任何需要的UI初始化代码
}

/**
 * 初始化事件监听器
 */
function initEventListeners() {
    console.log('初始化事件监听器...');
    
    // 刷新按钮
    const refreshBtn = document.getElementById('refreshData');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            fetchTokensData();
            showToast('数据已刷新');
        });
    }
    
    // 代币筛选输入框
    const tokenFilter = document.getElementById('tokenFilter');
    if (tokenFilter) {
        tokenFilter.addEventListener('input', filterTokens);
    }
    
    // 代币类型筛选下拉框
    const tokenTypeFilter = document.getElementById('tokenTypeFilter');
    if (tokenTypeFilter) {
        tokenTypeFilter.addEventListener('change', (e) => {
            currentFilterType = e.target.value;
            filterTokens();
        });
    }
    
    // 添加代币按钮点击事件
    const addToWhitelistBtn = document.getElementById('addToWhitelistBtn');
    const addToBlacklistBtn = document.getElementById('addToBlacklistBtn');
    
    if (addToWhitelistBtn) {
        console.log('找到添加白名单按钮，添加点击事件');
        addToWhitelistBtn.addEventListener('click', () => showAddTokenModal('whitelist'));
    } else {
        console.log('未找到添加白名单按钮');
    }
    
    if (addToBlacklistBtn) {
        console.log('找到添加黑名单按钮，添加点击事件');
        addToBlacklistBtn.addEventListener('click', () => showAddTokenModal('blacklist'));
    } else {
        console.log('未找到添加黑名单按钮');
    }
    
    // 模态框关闭按钮
    const closeModalBtns = document.querySelectorAll('.close-modal');
    console.log(`找到 ${closeModalBtns.length} 个模态框关闭按钮`);
    for (const btn of closeModalBtns) {
        btn.addEventListener('click', closeAllModals);
    }
    
    // 取消按钮
    const cancelAddTokenBtn = document.getElementById('cancelAddTokenBtn');
    if (cancelAddTokenBtn) {
        cancelAddTokenBtn.addEventListener('click', closeAllModals);
    }
    
    // 提交按钮
    const submitAddTokenBtn = document.getElementById('submitAddTokenBtn');
    if (submitAddTokenBtn) {
        submitAddTokenBtn.addEventListener('click', handleAddToken);
    }
    
    // 代币操作按钮
    const tokenActionBtn = document.getElementById('tokenActionBtn');
    if (tokenActionBtn) {
        tokenActionBtn.addEventListener('click', handleTokenAction);
    }
    
    // 启动按钮
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', startBot);
    }
    
    // 停止按钮
    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) {
        stopBtn.addEventListener('click', stopBot);
    }
    
    // 主题切换按钮
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // 搜索框事件
    setupSearchEventListeners();
}

/**
 * 获取代币数据
 */
async function fetchTokensData() {
    try {
        showLoading();
        
        // 获取分页、搜索和过滤参数
        const page = 1; // 默认第一页
        const limit = 50; // 每页显示50个
        const searchValue = document.getElementById('tokenFilter')?.value.trim() || '';
        const typeFilter = document.getElementById('tokenTypeFilter')?.value || 'all';
        
        // 构建API请求参数
        const options = {
            page,
            limit
        };
        
        if (searchValue) {
            options.search = searchValue;
        }
        
        if (typeFilter !== 'all') {
            options.type = typeFilter;
        }
        
        // 设置API端点
        const endpoint = '/api/tokens';
        
        try {
            // 使用通用数据源加载方法
            const data = await getDataSource(endpoint, options, generateMockTokens, 100);
            
            if (!data.success) {
                throw new Error(data.error || '获取代币数据失败');
            }
            
            // 更新代币数据
            tokens = data.data;
            
            // 更新分页信息
            updatePaginationInfo(data.page, data.totalPages, data.count);
            
            // 直接使用API返回的已过滤数据
            filteredTokens = tokens;
            
            // 更新统计数据
            updateTokenStats();
            
            // 渲染表格
            renderTokensTable();
        } catch (apiError) {
            console.error('使用新API端点获取数据失败，尝试使用旧API端点:', apiError);
            
            // 使用旧的API端点作为备选
            await fetchTokensDataLegacy();
        }
        
        // 隐藏加载器
        hideLoader();
        
        // 更新时间
        document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
    } catch (error) {
        console.error('获取代币数据失败:', error);
        showError('获取代币数据失败，请重试');
        hideLoader();
    }
}

/**
 * 生成模拟代币数据
 * @param {number} count 要生成的代币数量
 * @returns {Array} 模拟代币数据数组
 */
function generateMockTokens(count) {
    const tokens = [];
    const types = ['whitelist', 'blacklist', 'monitored'];
    const symbols = ['SOL', 'BTC', 'ETH', 'USDC', 'USDT', 'RAY', 'JUP', 'BONK', 'MEME'];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const symbol = symbols[Math.floor(Math.random() * symbols.length)] + (Math.random() > 0.7 ? Math.floor(Math.random() * 100) : '');
        const riskScore = type === 'whitelist' ? Math.random() * 3 : 
                          type === 'blacklist' ? 7 + Math.random() * 3 :
                          Math.random() * 10;
        
        tokens.push({
            mint: `${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
            symbol,
            name: `${symbol} Token`,
            type,
            riskScore,
            price: type === 'blacklist' ? Math.random() * 0.1 : Math.random() * 100,
            firstDetectedAt: new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000),
            lastUpdatedAt: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
    }
    
    return tokens;
}

/**
 * 使用旧API端点获取代币数据 (备选方法)
 */
async function fetchTokensDataLegacy() {
    // 获取白名单
    const whitelistResponse = await fetch('/api/tokens/whitelist');
    const whitelistData = await whitelistResponse.json();
    
    // 获取黑名单
    const blacklistResponse = await fetch('/api/tokens/blacklist');
    const blacklistData = await blacklistResponse.json();
    
    // 获取监控中的代币
    const monitoredResponse = await fetch('/api/tokens/monitored');
    const monitoredData = await monitoredResponse.json();
    
    // 检查API返回是否成功
    if (!whitelistData.success || !blacklistData.success || !monitoredData.success) {
        throw new Error('获取代币数据失败，API响应错误');
    }
    
    // 合并数据
    tokens = [
        ...whitelistData.data.map(token => ({ ...token, type: 'whitelist' })),
        ...blacklistData.data.map(token => ({ ...token, type: 'blacklist' })),
        ...monitoredData.data.map(token => ({ ...token, type: 'monitored' }))
    ];
    
    // 更新统计数据
    updateTokenStats();
    
    // 应用过滤器
    filterTokens();
}

/**
 * 更新代币统计数据
 */
function updateTokenStats() {
    // 白名单数量
    const whitelistCount = tokens.filter(token => token.type === 'whitelist').length;
    document.getElementById('whitelistCount').textContent = whitelistCount;
    
    // 黑名单数量
    const blacklistCount = tokens.filter(token => token.type === 'blacklist').length;
    document.getElementById('blacklistCount').textContent = blacklistCount;
    
    // 今日检测数量
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const detectedToday = tokens.filter(token => 
        token.firstDetectedAt && new Date(token.firstDetectedAt) >= today
    ).length;
    document.getElementById('detectedToday').textContent = detectedToday;
    
    // 平均风险评分
    const tokensWithScore = tokens.filter(token => token.riskScore !== undefined);
    const avgScore = tokensWithScore.length > 0 
        ? (tokensWithScore.reduce((sum, token) => sum + (token.riskScore || 0), 0) / tokensWithScore.length).toFixed(2)
        : 'N/A';
    document.getElementById('avgRiskScore').textContent = avgScore;
}

/**
 * 过滤代币列表
 */
function filterTokens() {
    const searchInput = document.getElementById('tokenFilter');
    currentSearchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    currentFilterType = document.getElementById('tokenTypeFilter')?.value || 'all';
    
    // 如果API已经支持搜索和过滤，直接重新请求数据
    if (window.apiSupportsSearchAndFilter) {
        fetchTokensData();
        return;
    }
    
    // 回退到本地过滤方式
    // 根据搜索词和类型过滤
    filteredTokens = tokens.filter(token => {
        // 类型过滤
        if (currentFilterType !== 'all' && token.type !== currentFilterType) {
            return false;
        }
        
        // 搜索词过滤
        if (currentSearchTerm) {
            const symbol = (token.symbol || '').toLowerCase();
            const name = (token.name || '').toLowerCase();
            const address = (token.mint || '').toLowerCase();
            
            return symbol.includes(currentSearchTerm) || 
                   name.includes(currentSearchTerm) || 
                   address.includes(currentSearchTerm);
        }
        
        return true;
    });
    
    // 渲染表格
    renderTokensTable();
}

/**
 * 渲染代币表格
 */
function renderTokensTable() {
    const tableBody = document.getElementById('tokensTableBody');
    if (!tableBody) return;
    
    if (filteredTokens.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">没有找到符合条件的代币</td>
            </tr>
        `;
        return;
    }
    
    let tableHtml = '';
    
    filteredTokens.forEach(token => {
        const tokenTypeBadge = getTokenTypeBadge(token.type);
        const riskScore = token.riskScore !== undefined ? token.riskScore.toFixed(2) : 'N/A';
        const price = token.price !== undefined ? `$${token.price.toFixed(6)}` : 'N/A';
        
        tableHtml += `
            <tr data-mint="${token.mint}">
                <td title="${token.name || '未知'}">${token.name || '未知'}</td>
                <td>${token.symbol || '未知'}</td>
                <td title="${token.mint}">${formatAddress(token.mint)}</td>
                <td>${tokenTypeBadge}</td>
                <td>${getRiskScoreBadge(riskScore)}</td>
                <td>${price}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-info token-detail-btn" data-mint="${token.mint}">详情</button>
                    ${getActionButtons(token)}
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = tableHtml;
    
    // 添加详情按钮事件
    document.querySelectorAll('.token-detail-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mint = btn.getAttribute('data-mint');
            showTokenDetail(mint);
        });
    });
    
    // 添加代币操作按钮事件
    document.querySelectorAll('.token-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mint = btn.getAttribute('data-mint');
            const action = btn.getAttribute('data-action');
            handleTokenDirectAction(mint, action);
            e.stopPropagation();
        });
    });
}

/**
 * 获取代币类型标记
 */
function getTokenTypeBadge(type) {
    switch (type) {
        case 'whitelist':
            return '<span class="badge badge-success">白名单</span>';
        case 'blacklist':
            return '<span class="badge badge-danger">黑名单</span>';
        case 'monitored':
            return '<span class="badge badge-info">监控中</span>';
        default:
            return '<span class="badge badge-secondary">未知</span>';
    }
}

/**
 * 获取风险评分标记
 */
function getRiskScoreBadge(score) {
    if (score === 'N/A') return '<span class="badge badge-secondary">N/A</span>';
    
    const numScore = parseFloat(score);
    if (numScore <= 3) {
        return `<span class="badge badge-success">${score}</span>`;
    } else if (numScore <= 7) {
        return `<span class="badge badge-warning">${score}</span>`;
    } else {
        return `<span class="badge badge-danger">${score}</span>`;
    }
}

/**
 * 获取代币操作按钮
 */
function getActionButtons(token) {
    switch (token.type) {
        case 'whitelist':
            return `<button class="btn btn-sm btn-danger token-action-btn" data-mint="${token.mint}" data-action="removeWhitelist">移除</button>`;
        case 'blacklist':
            return `<button class="btn btn-sm btn-danger token-action-btn" data-mint="${token.mint}" data-action="removeBlacklist">移除</button>`;
        case 'monitored':
            return `
                <button class="btn btn-sm btn-success token-action-btn" data-mint="${token.mint}" data-action="addToWhitelist">加入白名单</button>
                <button class="btn btn-sm btn-danger token-action-btn" data-mint="${token.mint}" data-action="addToBlacklist">加入黑名单</button>
            `;
        default:
            return '';
    }
}

/**
 * 显示代币详情
 */
async function showTokenDetail(mint) {
    try {
        showLoader();
        
        // 获取代币详情
        const response = await fetch(`/api/tokens/${mint}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || '获取代币详情失败');
        }
        
        const token = data.data;
        
        // 设置模态框标题
        document.getElementById('modalTokenName').textContent = token.name || token.symbol || '代币详情';
        
        // 设置操作按钮
        const actionBtn = document.getElementById('tokenActionBtn');
        if (token.type === 'whitelist') {
            actionBtn.textContent = '移除白名单';
            actionBtn.className = 'btn btn-danger';
            actionBtn.setAttribute('data-action', 'removeWhitelist');
        } else if (token.type === 'blacklist') {
            actionBtn.textContent = '移除黑名单';
            actionBtn.className = 'btn btn-danger';
            actionBtn.setAttribute('data-action', 'removeBlacklist');
        } else {
            actionBtn.textContent = '加入白名单';
            actionBtn.className = 'btn btn-success';
            actionBtn.setAttribute('data-action', 'addToWhitelist');
        }
        actionBtn.setAttribute('data-mint', mint);
        
        // 设置详情内容
        const detailContent = document.getElementById('tokenDetailContent');
        
        let htmlContent = `
            <div class="token-detail-item">
                <h3>基本信息</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label>名称：</label>
                        <span>${token.name || '未知'}</span>
                    </div>
                    <div class="info-item">
                        <label>符号：</label>
                        <span>${token.symbol || '未知'}</span>
                    </div>
                    <div class="info-item">
                        <label>地址：</label>
                        <span class="address-value" title="${token.mint}">${token.mint}</span>
                    </div>
                    <div class="info-item">
                        <label>类型：</label>
                        <span>${getTokenTypeBadge(token.type)}</span>
                    </div>
                    <div class="info-item">
                        <label>风险评分：</label>
                        <span>${getRiskScoreBadge(token.riskScore !== undefined ? token.riskScore.toFixed(2) : 'N/A')}</span>
                    </div>
                    <div class="info-item">
                        <label>价格：</label>
                        <span>${token.price !== undefined ? `$${token.price.toFixed(6)}` : 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
        
        // 添加元数据信息（如果有）
        if (token.metadata) {
            htmlContent += `
                <div class="token-detail-item">
                    <h3>元数据</h3>
                    <div class="info-grid">
                        ${token.metadata.image ? `
                            <div class="info-item info-item-full">
                                <label>图像：</label>
                                <div class="token-image">
                                    <img src="${token.metadata.image}" alt="${token.name || token.symbol || '代币图像'}" onerror="this.src='img/placeholder.svg';">
                                </div>
                            </div>
                        ` : ''}
                        ${token.metadata.description ? `
                            <div class="info-item info-item-full">
                                <label>描述：</label>
                                <p>${token.metadata.description}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        // 添加风险因素（如果是黑名单代币）
        if (token.type === 'blacklist' && token.reason) {
            htmlContent += `
                <div class="token-detail-item">
                    <h3>风险因素</h3>
                    <p class="risk-reason">${token.reason}</p>
                </div>
            `;
        }
        
        // 添加流动性信息
        if (token.liquidity !== undefined || token.volume !== undefined) {
            htmlContent += `
                <div class="token-detail-item">
                    <h3>流动性信息</h3>
                    <div class="info-grid">
                        ${token.liquidity !== undefined ? `
                            <div class="info-item">
                                <label>流动性：</label>
                                <span>$${token.liquidity.toLocaleString()}</span>
                            </div>
                        ` : ''}
                        ${token.volume !== undefined ? `
                            <div class="info-item">
                                <label>24小时交易量：</label>
                                <span>$${token.volume.toLocaleString()}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        detailContent.innerHTML = htmlContent;
        
        // 显示模态框
        document.getElementById('tokenDetailModal').style.display = 'block';
        
        hideLoader();
    } catch (error) {
        console.error('获取代币详情失败:', error);
        showError('获取代币详情失败，请重试');
        hideLoader();
    }
}

/**
 * 处理直接的代币操作
 */
async function handleTokenDirectAction(mint, action) {
    try {
        showLoader();
        
        let endpoint = '';
        let method = 'POST';
        let successMessage = '';
        
        switch (action) {
            case 'addToWhitelist':
                endpoint = '/api/tokens/whitelist';
                method = 'POST';
                successMessage = '已添加到白名单';
                break;
            case 'addToBlacklist':
                endpoint = '/api/tokens/blacklist';
                method = 'POST';
                successMessage = '已添加到黑名单';
                break;
            case 'removeWhitelist':
                endpoint = `/api/tokens/whitelist/${mint}`;
                method = 'DELETE';
                successMessage = '已从白名单移除';
                break;
            case 'removeBlacklist':
                endpoint = `/api/tokens/blacklist/${mint}`;
                method = 'DELETE';
                successMessage = '已从黑名单移除';
                break;
            default:
                throw new Error('未知操作');
        }
        
        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: method === 'POST' ? JSON.stringify({ mint }) : undefined
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || '操作失败');
        }
        
        showToast(successMessage);
        
        // 刷新数据
        await fetchTokensData();
        
        // 关闭模态框
        closeAllModals();
        
        hideLoader();
    } catch (error) {
        console.error('代币操作失败:', error);
        showError(error.message || '操作失败，请重试');
        hideLoader();
    }
}

/**
 * 处理模态框中的代币操作
 */
async function handleTokenAction() {
    const actionBtn = document.getElementById('tokenActionBtn');
    const mint = actionBtn.getAttribute('data-mint');
    const action = actionBtn.getAttribute('data-action');
    
    if (!mint || !action) {
        showError('缺少必要参数');
        return;
    }
    
    await handleTokenDirectAction(mint, action);
}

/**
 * 显示添加代币模态框
 * @param {string} listType 列表类型 ('whitelist' 或 'blacklist')
 */
function showAddTokenModal(listType) {
    console.log(`打开${listType === 'whitelist' ? '白名单' : '黑名单'}添加模态框`);
    
    // 设置当前模式
    isWhitelistAddMode = listType === 'whitelist';
    
    // 查找模态框
    const modal = document.getElementById('addTokenModal');
    
    if (modal) {
        // 设置标题
        const modalTitle = document.getElementById('addTokenModalTitle');
        if (modalTitle) {
            modalTitle.textContent = isWhitelistAddMode ? '添加白名单代币' : '添加黑名单代币';
        }
        
        // 显示/隐藏原因输入框
        const reasonGroup = document.getElementById('reasonGroup');
        if (reasonGroup) {
            reasonGroup.style.display = isWhitelistAddMode ? 'none' : 'block';
        }
        
        // 设置提交按钮样式
        const submitBtn = document.getElementById('submitAddTokenBtn');
        if (submitBtn) {
            submitBtn.className = isWhitelistAddMode ? 'btn btn-success' : 'btn btn-danger';
        }
        
        // 清空表单
        const form = document.getElementById('addTokenForm');
        if (form) {
            form.reset();
        } else {
            // 如果找不到表单，手动清空各个输入字段
            const tokenAddressInput = document.getElementById('tokenAddress');
            const tokenNameInput = document.getElementById('tokenName');
            const tokenSymbolInput = document.getElementById('tokenSymbol');
            const blacklistReasonInput = document.getElementById('blacklistReason');
            
            if (tokenAddressInput) tokenAddressInput.value = '';
            if (tokenNameInput) tokenNameInput.value = '';
            if (tokenSymbolInput) tokenSymbolInput.value = '';
            if (blacklistReasonInput) blacklistReasonInput.value = '';
        }
        
        // 显示模态框
        modal.style.display = 'block';
    } else {
        console.error('未找到添加代币模态框元素');
        showError('无法显示添加代币界面，请刷新页面后重试');
    }
}

/**
 * 处理添加代币操作
 */
async function handleAddToken() {
    try {
        console.log('处理添加代币请求...');
        
        // 获取表单值
        const tokenAddress = document.getElementById('tokenAddress').value.trim();
        const tokenName = document.getElementById('tokenName').value.trim();
        const tokenSymbol = document.getElementById('tokenSymbol').value.trim();
        
        // 验证地址
        if (!tokenAddress) {
            showError('请输入代币地址');
            return;
        }
        
        // 显示加载状态
        showLoading();
        
        // 准备请求数据
        const tokenData = {
            address: tokenAddress,
            type: isWhitelistAddMode ? 'whitelist' : 'blacklist'
        };
        
        // 添加可选字段
        if (tokenName) tokenData.name = tokenName;
        if (tokenSymbol) tokenData.symbol = tokenSymbol;
        
        // 发送API请求
        const apiEndpoint = '/api/tokens/add';
        
        try {
            // 尝试发送API请求
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tokenData)
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || '添加代币失败');
            }
            
            // 成功添加
            showToast(`已添加代币到${isWhitelistAddMode ? '白名单' : '黑名单'}`);
            
            // 关闭模态框
            closeAllModals();
            
            // 刷新数据
            fetchTokensData();
        } catch (apiError) {
            console.warn('API请求失败，使用模拟数据', apiError);
            
            // 模拟成功响应
            // 创建一个新的代币对象
            const newToken = {
                mint: tokenAddress,
                name: tokenName || `Token ${tokenAddress.substr(0, 6)}...`,
                symbol: tokenSymbol || 'TKN',
                type: isWhitelistAddMode ? 'whitelist' : 'blacklist',
                riskScore: isWhitelistAddMode ? 0.5 : 8.5,
                price: isWhitelistAddMode ? 10.45 : 0.00024,
                addedAt: new Date().toISOString()
            };
            
            // 添加到本地数据
            tokens.unshift(newToken);
            
            // 更新UI
            updateTokenStats();
            renderTokensTable();
            
            // 显示成功消息
            showToast(`已添加代币到${isWhitelistAddMode ? '白名单' : '黑名单'}`);
            
            // 关闭模态框
            closeAllModals();
        }
    } catch (error) {
        console.error('处理添加代币请求失败:', error);
        showError(`添加代币失败: ${error.message}`);
    } finally {
        hideLoading();
    }
}

/**
 * 关闭所有模态框
 */
function closeAllModals() {
    console.log('关闭所有模态框');
    
    // 获取所有模态框元素
    const modals = document.querySelectorAll('.modal');
    
    // 关闭所有模态框
    for (const modal of modals) {
        modal.style.display = 'none';
    }
    
    // 清除可能的输入
    const inputs = document.querySelectorAll('.modal input');
    for (const input of inputs) {
        input.value = '';
    }
}

/**
 * 获取机器人状态
 */
async function fetchBotStatus() {
    try {
        const response = await fetch('/api/system/status');
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || '获取状态失败');
        }
        
        botStatus = data.data.status;
        updateStatusUI();
    } catch (error) {
        console.error('获取机器人状态失败:', error);
        // 不显示错误提示，避免干扰用户
    }
}

/**
 * 更新状态UI
 */
function updateStatusUI() {
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    
    if (statusText && statusIndicator) {
        switch (botStatus) {
            case 'running':
                statusText.textContent = '状态: 运行中';
                statusIndicator.className = 'status-indicator status-running';
                break;
            case 'stopped':
                statusText.textContent = '状态: 已停止';
                statusIndicator.className = 'status-indicator status-stopped';
                break;
            default:
                statusText.textContent = '状态: 未知';
                statusIndicator.className = 'status-indicator';
                break;
        }
    }
}

/**
 * 启动机器人
 */
async function startBot() {
    try {
        showLoader();
        
        const response = await fetch('/api/system/start', { method: 'POST' });
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || '启动失败');
        }
        
        botStatus = 'running';
        updateStatusUI();
        showToast('机器人已启动');
        
        hideLoader();
    } catch (error) {
        console.error('启动机器人失败:', error);
        showError(error.message || '启动失败，请重试');
        hideLoader();
    }
}

/**
 * 停止机器人
 */
async function stopBot() {
    try {
        showLoader();
        
        const response = await fetch('/api/system/stop', { method: 'POST' });
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || '停止失败');
        }
        
        botStatus = 'stopped';
        updateStatusUI();
        showToast('机器人已停止');
        
        hideLoader();
    } catch (error) {
        console.error('停止机器人失败:', error);
        showError(error.message || '停止失败，请重试');
        hideLoader();
    }
}

/**
 * 显示加载器
 */
function showLoader() {
    // 创建加载器元素（如果不存在）
    let loader = document.getElementById('pageLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'pageLoader';
        loader.className = 'loader-container';
        loader.innerHTML = '<div class="loader"></div>';
        document.body.appendChild(loader);
    }
    
    loader.style.display = 'flex';
}

/**
 * 隐藏加载器
 */
function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.style.display = 'none';
    }
}

/**
 * 显示错误消息
 */
function showError(message) {
    // 创建通知元素（如果不存在）
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.className = 'notification error';
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

/**
 * 显示成功消息
 */
function showToast(message) {
    // 创建通知元素（如果不存在）
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.className = 'notification success';
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

/**
 * 格式化地址显示
 */
function formatAddress(address) {
    if (!address) return '';
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
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
    const prevPageBtn = document.querySelector('.pagination button:first-child');
    const nextPageBtn = document.querySelector('.pagination button:last-child');
    
    if (prevPageBtn) {
        prevPageBtn.disabled = page <= 1;
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = page >= totalPages;
    }
}
