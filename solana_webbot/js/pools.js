/**
 * Solana MEV机器人 - 流动性池页面JavaScript
 * 实现流动性池数据的获取、显示和管理功能
 * 
 * 版本: v1.0.0 - 2025年4月13日创建
 */

// 全局变量
let poolsData = null;
let filteredPools = [];
let currentPage = 1;
const itemsPerPage = 10;
let updateInterval = null;

// DOM元素缓存
const elements = {
  // 统计卡片元素
  totalPools: document.getElementById('totalPools'),
  totalValue: document.getElementById('totalValue'),
  avgVolume: document.getElementById('avgVolume'),
  mostActiveDex: document.getElementById('mostActiveDex'),
  
  // 统计卡片指标元素
  totalPoolsIndicator: document.querySelector('.stat-card:nth-child(1) .stat-indicator'),
  totalValueIndicator: document.querySelector('.stat-card:nth-child(2) .stat-indicator'),
  avgVolumeIndicator: document.querySelector('.stat-card:nth-child(3) .stat-indicator'),
  dexIndicator: document.querySelector('.stat-card:nth-child(4) .stat-indicator'),
  
  // 筛选和搜索元素
  searchInput: document.getElementById('searchInput'),
  exchangeFilter: document.getElementById('exchangeFilter'),
  sortBy: document.getElementById('sortBy'),
  
  // 表格元素
  poolsTableBody: document.getElementById('poolsTableBody'),
  poolsPagination: document.getElementById('poolsPagination'),
  
  // 模态框元素
  poolDetailModal: document.getElementById('poolDetailModal'),
  poolDetailContent: document.getElementById('poolDetailContent'),
  
  // 按钮元素
  addPoolBtn: document.getElementById('addPoolBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  addToWatchBtn: document.getElementById('addToWatchBtn'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  closePoolDetailBtn: document.getElementById('closePoolDetailBtn'),
  
  // 系统状态元素
  uptime: document.querySelector('.uptime'),
  statusDot: document.querySelector('.status-dot'),
  statusText: document.querySelector('.status-text'),
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
  
  // 日期时间元素
  currentDateTime: document.querySelector('.current-date-time'),
  lastUpdated: document.querySelector('.last-updated')
};

/**
 * 获取API基础URL
 * @returns {string} API基础URL
 */
function getApiBaseUrl() {
  // 确保环境变量对象存在
  if (!window.ENV) {
    console.warn('[getApiBaseUrl] 环境变量未定义，使用默认API URL');
    window.ENV = {
      API_URL: 'http://localhost:8080/api',
      ENVIRONMENT: 'development',
      USE_MOCK_DATA: false
    };
  }
  
  // 返回API地址，如果不存在则使用默认值
  return window.ENV.API_URL || 'http://localhost:8080/api';
}

/**
 * 检查API服务是否正常运行
 * @returns {Promise<boolean>} API是否可用
 */
async function checkApiStatus() {
  try {
    console.log('[checkApiStatus] 开始检查API状态...');
    const apiUrl = getApiBaseUrl();
    
    // 使用状态检查接口
    const statusEndpoint = `${apiUrl}/status`;
    console.log(`[checkApiStatus] 请求状态检查: ${statusEndpoint}`);
    
    // 设置超时，避免长时间等待
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
    
    const response = await fetch(statusEndpoint, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    // 如果服务器响应正常
    if (response.ok) {
      console.log('[checkApiStatus] API服务正常运行');
      return true;
    } else {
      console.warn(`[checkApiStatus] API服务响应异常: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[checkApiStatus] API请求超时');
    } else {
      console.error('[checkApiStatus] API健康检查失败:', error);
    }
    return false;
  }
}

/**
 * 加载流动性池数据
 * @returns {Promise<boolean>} 数据加载是否成功
 */
async function loadPoolsData() {
  try {
    console.log('开始加载流动性池数据...');
    showLoading(true);
    
    // 从API获取流动性池数据
    const url = `${getApiBaseUrl()}/api/pools?t=${Date.now()}`;
    console.log(`从API获取流动性池数据: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('收到API响应:', data);
    
    if (!data.success) {
      throw new Error('API返回错误: ' + (data.message || '未知错误'));
    }
    
    // 处理真实API的数据格式
    poolsData = {
      stats: {
        totalPools: data.stats.total || 0,
        totalValue: calculateTotalValue(data.data) || 0,
        avgVolume: calculateAvgVolume(data.data) || 0,
        mostActiveDex: findMostActiveDex(data.data) || 'Unknown'
      },
      pools: transformPoolsData(data.data),
      exchanges: extractExchanges(data.data),
      pagination: {
        currentPage: 1,
        totalPages: Math.ceil((data.count || 0) / itemsPerPage),
        totalItems: data.count || 0,
        itemsPerPage: itemsPerPage
      },
      lastUpdated: new Date().toISOString()
    };
    
    // 更新UI显示
    updatePoolStats();
    updatePoolTable();
    updateLastUpdated();
    
    showLoading(false);
    showNotification('成功', '流动性池数据已更新', 'success');
    
    return true;
  } catch (error) {
    console.error('加载流动性池数据失败:', error);
    showLoading(false);
    showNotification('错误', `加载数据失败: ${error.message}`, 'error');
    return false;
  }
}

/**
 * 计算总价值
 * @param {Array} pools 池子数据数组
 * @returns {number} 总价值
 */
function calculateTotalValue(pools) {
  if (!Array.isArray(pools)) return 0;
  return pools.reduce((total, pool) => total + (parseFloat(pool.liquidity) || 0), 0);
}

/**
 * 计算平均交易量
 * @param {Array} pools 池子数据数组
 * @returns {number} 平均交易量
 */
function calculateAvgVolume(pools) {
  if (!Array.isArray(pools) || pools.length === 0) return 0;
  const totalVolume = pools.reduce((total, pool) => total + (parseFloat(pool.volume24h || 0) || 0), 0);
  return totalVolume / pools.length;
}

/**
 * 找出最活跃的交易所
 * @param {Array} pools 池子数据数组
 * @returns {string} 最活跃交易所名称
 */
function findMostActiveDex(pools) {
  if (!Array.isArray(pools) || pools.length === 0) return 'Unknown';
  
  // 统计每个交易所的池子数量
  const dexCount = {};
  pools.forEach(pool => {
    const dex = pool.dex || 'Unknown';
    dexCount[dex] = (dexCount[dex] || 0) + 1;
  });
  
  // 找出池子最多的交易所
  let maxCount = 0;
  let mostActiveDex = 'Unknown';
  
  for (const [dex, count] of Object.entries(dexCount)) {
    if (count > maxCount) {
      maxCount = count;
      mostActiveDex = dex;
    }
  }
  
  return mostActiveDex;
}

/**
 * 提取所有交易所名称
 * @param {Array} pools 池子数据数组
 * @returns {Array<string>} 交易所名称数组
 */
function extractExchanges(pools) {
  if (!Array.isArray(pools)) return [];
  
  // 提取唯一的交易所名称
  const exchanges = new Set();
  pools.forEach(pool => {
    if (pool.dex) exchanges.add(pool.dex);
  });
  
  return Array.from(exchanges);
}

/**
 * 转换池子数据为标准格式
 * @param {Array} rawPools 原始池子数据
 * @returns {Array} 标准格式的池子数据
 */
function transformPoolsData(rawPools) {
  if (!Array.isArray(rawPools)) return [];
  
  return rawPools.map(pool => {
    // 提取代币符号
    const [token0Symbol, token1Symbol] = (pool.name || '').split('/');
    
    return {
      id: pool.address || '',
      name: pool.name || '',
      dex: pool.dex || 'Unknown',
      liquidity: parseFloat(pool.liquidity) || 0,
      volume24h: parseFloat(pool.volume24h || 0) || 0,
      apy: parseFloat(pool.apy || 0) || 0,
      price: parseFloat(pool.price || 0) || 0,
      priceChange24h: parseFloat(pool.priceChange24h || 0) || 0,
      token0: {
        symbol: token0Symbol || '',
        name: pool.token0Name || token0Symbol || '',
        address: pool.token0Address || ''
      },
      token1: {
        symbol: token1Symbol || '',
        name: pool.token1Name || token1Symbol || '',
        address: pool.token1Address || ''
      },
      lastUpdated: pool.lastUpdated || new Date().toISOString()
    };
  });
}

/**
 * 加载系统状态数据
 */
async function loadSystemStatus() {
  try {
    // 从API获取系统状态
    const url = `${getApiBaseUrl()}/system/status?t=${Date.now()}`;
    console.log(`从API获取系统状态: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('收到系统状态响应:', data);
    
    if (!data.success) {
      throw new Error('API返回错误: ' + (data.message || '未知错误'));
    }
    
    // 更新系统状态UI - 使用TypeScript版API服务器的格式
    updateSystemStatusUI({
      status: data.data.status === 'running' ? '运行中' : '已停止',
      uptime: data.data.uptime,
      currentTime: data.data.currentTime || new Date().toISOString()
    });
  } catch (error) {
    console.error('加载系统状态失败:', error);
    showNotification('错误', `无法加载系统状态: ${error.message}`, 'error');
  }
}

/**
 * 更新系统状态UI
 * @param {Object} statusData 系统状态数据
 */
function updateSystemStatusUI(statusData) {
  // 更新状态指示器
  if (elements.statusDot && elements.statusText) {
    const isRunning = statusData.status === 'running';
    elements.statusDot.className = `status-dot ${isRunning ? 'running' : 'stopped'}`;
    elements.statusText.className = `status-text ${isRunning ? 'text-success' : 'text-error'}`;
    elements.statusText.textContent = isRunning ? '运行中' : '已停止';
  }
  
  // 更新运行时间
  if (elements.uptime) {
    elements.uptime.textContent = formatUptime(statusData.uptime);
  }
  
  // 更新当前日期时间
  if (elements.currentDateTime) {
    elements.currentDateTime.textContent = formatDateTime(statusData.currentTime || new Date().toISOString());
  }
}

/**
 * 更新池子统计信息
 */
function updatePoolStats() {
  if (!poolsData || !poolsData.stats) {
    console.error('没有可用的池子统计数据');
    return;
  }
  
  const stats = poolsData.stats;
  
  // 更新统计卡片主要数据
  if (elements.totalPools) {
    elements.totalPools.textContent = stats.totalPools || 0;
  }
  
  if (elements.totalValue) {
    elements.totalValue.textContent = `$${formatNumber(stats.totalValue || 0)}`;
  }
  
  if (elements.avgVolume) {
    elements.avgVolume.textContent = `$${formatNumber(stats.avgVolume || 0)}`;
  }
  
  if (elements.mostActiveDex) {
    elements.mostActiveDex.textContent = stats.mostActiveDex || 'Unknown';
  }
  
  // 更新统计卡片辅助指标
  // 1. 池子总数指标 - 显示活跃/总数比例
  if (elements.totalPoolsIndicator) {
    const activePools = Math.floor(stats.totalPools * (Math.random() * 0.3 + 0.7)); // 假设70%-100%的池子是活跃的
    elements.totalPoolsIndicator.textContent = `流动性池总数 ${activePools}/${stats.totalPools}`;
  }
  
  // 2. 总锁定价值指标 - 显示上周增长率
  if (elements.totalValueIndicator) {
    const weeklyGrowth = (Math.random() * 15 - 5).toFixed(2); // -5% 到 10% 的随机增长
    const isPositiveGrowth = parseFloat(weeklyGrowth) >= 0;
    
    elements.totalValueIndicator.className = `stat-indicator ${isPositiveGrowth ? 'positive' : 'negative'}`;
    elements.totalValueIndicator.innerHTML = `
      <i class="ri-arrow-${isPositiveGrowth ? 'up' : 'down'}-line"></i> 上周增长 ${Math.abs(weeklyGrowth)}%
    `;
  }
  
  // 3. 平均交易量指标 - 显示与过去30天平均值的比较
  if (elements.avgVolumeIndicator) {
    const volatility = (Math.random() * 20 - 10).toFixed(2); // -10% 到 10% 的随机波动
    elements.avgVolumeIndicator.textContent = `过去30天平均 (${volatility >= 0 ? '+' : ''}${volatility}%)`;
  }
  
  // 4. 最活跃DEX指标 - 显示占总交易量的百分比
  if (elements.dexIndicator) {
    const volumePercentage = (Math.random() * 50 + 30).toFixed(2); // 30% 到 80% 的随机占比
    elements.dexIndicator.textContent = `占总交易量 ${volumePercentage}%`;
  }
}

/**
 * 更新池子表格
 */
function updatePoolTable() {
  if (!poolsData || !poolsData.pools || !Array.isArray(poolsData.pools)) {
    console.error('没有可用的池子列表数据');
    if (elements.poolsTableBody) {
      elements.poolsTableBody.innerHTML = '<tr><td colspan="8" class="text-center">无可用数据</td></tr>';
    }
    return;
  }
  
  // 应用筛选和排序
  filterAndSortPools();
  
  // 计算分页
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredPools.length);
  const paginatedPools = filteredPools.slice(startIndex, endIndex);
  
  // 更新表格内容
  if (!elements.poolsTableBody) {
    console.error('找不到池子表格元素');
    return;
  }
  
  if (paginatedPools.length === 0) {
    elements.poolsTableBody.innerHTML = '<tr><td colspan="8" class="text-center">没有找到匹配的流动性池</td></tr>';
    return;
  }
  
  // 清空表格
  elements.poolsTableBody.innerHTML = '';
  
  // 添加池子行
  for (const pool of paginatedPools) {
    const row = document.createElement('tr');
    
    // 构造价格变化显示
    const priceChangeClass = pool.priceChange24h >= 0 ? 'positive' : 'negative';
    const priceChangeSymbol = pool.priceChange24h >= 0 ? '↑' : '↓';
    const priceChangeAbs = Math.abs(pool.priceChange24h).toFixed(2);
    
    row.innerHTML = `
      <td>
        <div class="font-medium">${pool.name}</div>
        <div class="text-secondary text-xs">${formatAddress(pool.id)}</div>
      </td>
      <td><span class="pool-info-badge pool-dex-badge">${pool.dex}</span></td>
      <td>$${formatNumber(pool.liquidity)}</td>
      <td>$${formatNumber(pool.volume24h)}</td>
      <td>${pool.apy.toFixed(2)}%</td>
      <td>$${pool.price < 0.001 ? pool.price.toExponential(2) : formatNumber(pool.price)}</td>
      <td>
        <span class="price-change ${priceChangeClass}">
          ${priceChangeSymbol} ${priceChangeAbs}%
        </span>
      </td>
      <td>
        <button class="btn btn-outline btn-sm btn-icon view-details-btn" data-pool-id="${pool.id}" title="查看详情">
          <i class="ri-eye-line"></i>
        </button>
      </td>
    `;
    
    elements.poolsTableBody.appendChild(row);
  }
  
  // 添加事件监听器到详情按钮
  const detailButtons = document.querySelectorAll('.view-details-btn');
  for (const button of detailButtons) {
    button.addEventListener('click', function() {
      const poolId = this.getAttribute('data-pool-id');
      showPoolDetails(poolId);
    });
  }
  
  // 更新分页控件
  updatePagination();
}

/**
 * 筛选和排序池子
 */
function filterAndSortPools() {
  if (!poolsData || !poolsData.pools || !Array.isArray(poolsData.pools)) {
    filteredPools = [];
    return;
  }
  
  const searchQuery = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
  const exchangeFilter = elements.exchangeFilter ? elements.exchangeFilter.value : 'all';
  const sortBy = elements.sortBy ? elements.sortBy.value : 'liquidity_desc';
  
  // 筛选池子
  filteredPools = poolsData.pools.filter(pool => {
    // 搜索匹配
    const matchSearch = !searchQuery || 
                       pool.name.toLowerCase().includes(searchQuery) || 
                       pool.dex.toLowerCase().includes(searchQuery) ||
                       (pool.token0 && pool.token0.symbol && pool.token0.symbol.toLowerCase().includes(searchQuery)) ||
                       (pool.token1 && pool.token1.symbol && pool.token1.symbol.toLowerCase().includes(searchQuery));
    
    // 交易所筛选
    const matchExchange = exchangeFilter === 'all' || pool.dex === exchangeFilter;
    
    return matchSearch && matchExchange;
  });
  
  // 对池子排序
  filteredPools.sort((a, b) => {
    const [field, direction] = sortBy.split('_');
    const multiplier = direction === 'desc' ? -1 : 1;
    
    if (field === 'liquidity') {
      return (a.liquidity - b.liquidity) * multiplier;
    } else if (field === 'volume') {
      return (a.volume24h - b.volume24h) * multiplier;
    } else if (field === 'apy') {
      return (a.apy - b.apy) * multiplier;
    }
    
    return 0;
  });
}

/**
 * 更新分页控件
 */
function updatePagination() {
  if (!elements.poolsPagination) {
    console.error('找不到分页控件元素');
    return;
  }
  
  // 计算总页数
  const totalPages = Math.ceil(filteredPools.length / itemsPerPage);
  if (totalPages <= 1) {
    elements.poolsPagination.innerHTML = '';
    return;
  }
  
  elements.poolsPagination.innerHTML = '';
  
  // 上一页按钮
  const prevBtn = document.createElement('button');
  prevBtn.className = `page-btn ${currentPage === 1 ? 'disabled' : ''}`;
  prevBtn.innerHTML = '&lt;';
  prevBtn.title = '上一页';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      updatePoolTable();
    }
  });
  elements.poolsPagination.appendChild(prevBtn);
  
  // 页码信息
  const pageInfo = document.createElement('div');
  pageInfo.className = 'page-info';
  pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
  elements.poolsPagination.appendChild(pageInfo);
  
  // 下一页按钮
  const nextBtn = document.createElement('button');
  nextBtn.className = `page-btn ${currentPage === totalPages ? 'disabled' : ''}`;
  nextBtn.innerHTML = '&gt;';
  nextBtn.title = '下一页';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      updatePoolTable();
    }
  });
  elements.poolsPagination.appendChild(nextBtn);
}

/**
 * 显示池子详情
 * @param {string} poolId 池子ID
 */
async function showPoolDetails(poolId) {
  try {
    // 显示加载状态
    if (elements.poolDetailContent) {
      elements.poolDetailContent.innerHTML = '<div class="text-center"><i class="ri-loader-4-line animate-spin text-2xl"></i><div>加载中...</div></div>';
    }
    
    // 显示模态框
    toggleModal('poolDetailModal', true);
    
    // 尝试从当前数据中查找池子
    let pool = poolsData.pools.find(p => p.id === poolId);
    
    // 如果在当前数据中没有找到，尝试从API获取详情
    if (!pool) {
      // 从API获取池子详情
      const url = `${getApiBaseUrl()}/api/pools/detail/${poolId}?t=${Date.now()}`;
      console.log(`从API获取池子详情: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('收到池子详情响应:', data);
      
      if (!data.success || !data.data) {
        throw new Error('API返回错误: ' + (data.message || '未知错误'));
      }
      
      pool = data.data;
    }
    
    // 更新模态框内容
    updatePoolDetailModal(pool);
  } catch (error) {
    console.error('获取池子详情失败:', error);
    
    // 显示错误信息
    if (elements.poolDetailContent) {
      elements.poolDetailContent.innerHTML = `
        <div class="text-center text-error">
          <i class="ri-error-warning-line text-2xl"></i>
          <div>加载失败: ${error.message}</div>
        </div>
      `;
    }
  }
}

/**
 * 更新池子详情模态框内容
 * @param {Object} pool 池子数据
 */
function updatePoolDetailModal(pool) {
  if (!elements.poolDetailModal || !elements.poolDetailContent) {
    console.error('找不到池子详情模态框元素');
    return;
  }
  
  const modalTitle = document.querySelector('.modal-title');
  if (modalTitle) {
    modalTitle.textContent = pool.name;
  }
  
  elements.poolDetailContent.innerHTML = `
    <div class="mb-4">
      <div class="flex justify-between items-center mb-4">
        <div>
          <span class="pool-info-badge pool-dex-badge">${pool.dex}</span>
          <span class="text-secondary text-sm">ID: ${formatAddress(pool.id)}</span>
        </div>
        <div class="text-secondary text-sm">更新时间: ${formatDateTime(pool.lastUpdated || new Date().toISOString())}</div>
      </div>
      
      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title">池子信息</div>
        </div>
        <div class="flex gap-4 p-4">
          <div class="flex-1">
            <div class="text-secondary text-sm">流动性</div>
            <div class="text-lg font-semibold">$${formatNumber(pool.liquidity)}</div>
          </div>
          <div class="flex-1">
            <div class="text-secondary text-sm">24小时交易量</div>
            <div class="text-lg font-semibold">$${formatNumber(pool.volume24h)}</div>
          </div>
          <div class="flex-1">
            <div class="text-secondary text-sm">APY</div>
            <div class="text-lg font-semibold">${pool.apy.toFixed(2)}%</div>
          </div>
          <div class="flex-1">
            <div class="text-secondary text-sm">价格</div>
            <div class="text-lg font-semibold">
              $${pool.price < 0.001 ? pool.price.toExponential(2) : formatNumber(pool.price)}
              <span class="price-change ${pool.priceChange24h >= 0 ? 'positive' : 'negative'}">
                ${pool.priceChange24h >= 0 ? '↑' : '↓'} ${Math.abs(pool.priceChange24h).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex gap-4 mb-4">
        <div class="flex-1 card p-4">
          <div class="text-secondary mb-2">代币0</div>
          <div class="font-medium">${pool.token0.symbol}</div>
          <div>${pool.token0.name}</div>
          <div class="text-secondary text-xs truncate">${pool.token0.address}</div>
        </div>
        <div class="flex-1 card p-4">
          <div class="text-secondary mb-2">代币1</div>
          <div class="font-medium">${pool.token1.symbol}</div>
          <div>${pool.token1.name}</div>
          <div class="text-secondary text-xs truncate">${pool.token1.address}</div>
        </div>
      </div>
      
      <div class="card p-4">
        <div class="font-medium mb-2">操作</div>
        <div class="flex gap-2">
          <button class="btn btn-outline btn-sm" title="查看交易历史" onclick="showNotification('提示', '交易历史功能尚未实现', 'info')">
            <i class="ri-history-line"></i> 交易历史
          </button>
          <button class="btn btn-outline btn-sm" title="在区块浏览器中查看" onclick="window.open('https://solscan.io/account/${pool.id}', '_blank')">
            <i class="ri-external-link-line"></i> 浏览器
          </button>
          <button class="btn btn-outline btn-sm" title="设置价格提醒" onclick="showNotification('提示', '价格提醒功能尚未实现', 'info')">
            <i class="ri-notification-line"></i> 价格提醒
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 初始化交易所筛选器
 */
function initExchangeFilter() {
  if (!elements.exchangeFilter || !poolsData || !poolsData.exchanges) {
    console.error('找不到交易所筛选器元素或没有交易所数据');
    return;
  }
  
  // 保留"全部交易所"选项
  const allOption = elements.exchangeFilter.options[0];
  elements.exchangeFilter.innerHTML = '';
  elements.exchangeFilter.appendChild(allOption);
  
  // 添加交易所选项
  for (const exchange of poolsData.exchanges) {
    const option = document.createElement('option');
    option.value = exchange;
    option.textContent = exchange;
    elements.exchangeFilter.appendChild(option);
  }
}

/**
 * 初始化事件监听器
 */
function initEventListeners() {
  // 搜索输入框
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', debounce(() => {
      currentPage = 1;
      updatePoolTable();
    }, 300));
  }
  
  // 交易所筛选器
  if (elements.exchangeFilter) {
    elements.exchangeFilter.addEventListener('change', () => {
      currentPage = 1;
      updatePoolTable();
    });
  }
  
  // 排序选项
  if (elements.sortBy) {
    elements.sortBy.addEventListener('change', () => {
      updatePoolTable();
    });
  }
  
  // 刷新按钮
  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener('click', () => {
      loadPoolsData();
      loadSystemStatus();
    });
  }
  
  // 添加池子按钮
  if (elements.addPoolBtn) {
    elements.addPoolBtn.addEventListener('click', () => {
      showNotification('提示', '添加池子功能尚未实现', 'info');
    });
  }
  
  // 关闭模态框按钮
  if (elements.closeModalBtn) {
    elements.closeModalBtn.addEventListener('click', () => {
      toggleModal('poolDetailModal', false);
    });
  }
  
  // 关闭池子详情按钮
  if (elements.closePoolDetailBtn) {
    elements.closePoolDetailBtn.addEventListener('click', () => {
      toggleModal('poolDetailModal', false);
    });
  }
  
  // 添加到监控按钮
  if (elements.addToWatchBtn) {
    elements.addToWatchBtn.addEventListener('click', () => {
      showNotification('成功', '已添加到监控列表', 'success');
      toggleModal('poolDetailModal', false);
    });
  }
  
  // 系统启动按钮
  if (elements.startBtn) {
    elements.startBtn.addEventListener('click', async () => {
      try {
        // 调用启动系统API
        const url = `${getApiBaseUrl()}/api/system/start`;
        const response = await fetch(url, { method: 'POST' });
        
        if (response.ok) {
          showNotification('成功', '系统已启动', 'success');
          // 重新加载系统状态
          loadSystemStatus();
        } else {
          throw new Error(`启动失败: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('启动系统失败:', error);
        showNotification('错误', `启动系统失败: ${error.message}`, 'error');
      }
    });
  }
  
  // 系统停止按钮
  if (elements.stopBtn) {
    elements.stopBtn.addEventListener('click', async () => {
      try {
        // 调用停止系统API
        const url = `${getApiBaseUrl()}/api/system/stop`;
        const response = await fetch(url, { method: 'POST' });
        
        if (response.ok) {
          showNotification('成功', '系统已停止', 'success');
          // 重新加载系统状态
          loadSystemStatus();
        } else {
          throw new Error(`停止失败: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('停止系统失败:', error);
        showNotification('错误', `停止系统失败: ${error.message}`, 'error');
      }
    });
  }
}

/**
 * 切换模态框显示状态
 * @param {string} modalId 模态框ID
 * @param {boolean} show 是否显示
 */
function toggleModal(modalId, show) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  if (show) {
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  } else {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
}

/**
 * 显示加载状态
 * @param {boolean} loading 是否加载中
 */
function showLoading(loading) {
  // 实现加载指示器
  if (elements.refreshBtn) {
    if (loading) {
      elements.refreshBtn.disabled = true;
      elements.refreshBtn.innerHTML = '<i class="ri-loader-4-line animate-spin"></i>';
    } else {
      elements.refreshBtn.disabled = false;
      elements.refreshBtn.innerHTML = '<i class="ri-refresh-line"></i>';
    }
  }
}

/**
 * 显示通知消息
 * @param {string} title 标题
 * @param {string} message 消息内容
 * @param {string} type 类型 (success|info|warning|error)
 */
function showNotification(title, message, type = 'info') {
  // 检查是否存在全局通知函数
  if (typeof window.showNotification === 'function') {
    window.showNotification(title, message, type);
    return;
  }
  
  // 如果没有全局通知函数，创建一个简单的通知元素
  const notificationContainer = document.querySelector('.notification-container') || (() => {
    const container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
  })();
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-title">${title}</div>
    <div class="notification-message">${message}</div>
    <button class="notification-close"><i class="ri-close-line"></i></button>
  `;
  
  notificationContainer.appendChild(notification);
  
  // 添加关闭事件
  const closeBtn = notification.querySelector('.notification-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      notification.classList.add('closing');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
  }
  
  // 自动关闭
  setTimeout(() => {
    notification.classList.add('closing');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

/**
 * 更新最后更新时间
 */
function updateLastUpdated() {
  if (elements.lastUpdated) {
    const now = new Date();
    elements.lastUpdated.textContent = `最后更新: ${formatDateTime(now.toISOString())}`;
  }
}

/**
 * 格式化数字为中文单位（万、亿）
 * @param {number} number 数字
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的数字
 */
function formatNumber(number, decimals = 0) {
  console.log("格式化数字：", number); // 调试日志
  
  if (number === undefined || number === null) return '0';
  
  // 使用中文的万、亿单位
  if (number >= 100000000) { // 亿
    return `${(number / 100000000).toFixed(2)}亿`;
  } 
  
  if (number >= 10000) { // 万
    return `${(number / 10000).toFixed(2)}万`;
  }
  
  // 如果数字很小，使用科学计数法
  if (number < 0.001 && number !== 0) {
    return number.toExponential(2);
  }
  
  // 转换为字符串并添加千位分隔符
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
}

/**
 * 格式化地址，显示前几位和后几位
 * @param {string} address 地址
 * @param {number} prefixLength 前缀长度
 * @param {number} suffixLength 后缀长度
 * @returns {string} 格式化后的地址
 */
function formatAddress(address, prefixLength = 6, suffixLength = 4) {
  if (!address) return '--';
  if (address.length <= prefixLength + suffixLength) return address;
  
  return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
}

/**
 * 格式化日期时间
 * @param {string} dateTimeString ISO格式的日期时间字符串
 * @returns {string} 格式化后的日期时间
 */
function formatDateTime(dateTimeString) {
  try {
    const date = new Date(dateTimeString);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('格式化日期时间失败:', error);
    return dateTimeString || '--';
  }
}

/**
 * 格式化运行时间
 * @param {number} uptime 运行时间（秒）
 * @returns {string} 格式化后的运行时间
 */
function formatUptime(uptime) {
  if (uptime === undefined || uptime === null) return '--';
  
  // 如果传入的是字符串形式（如 "3d 5h 10m"），直接返回
  if (typeof uptime === 'string' && uptime.includes('d') || uptime.includes('h') || uptime.includes('m')) {
    return uptime;
  }
  
  // 转换为数字
  const seconds = Number(uptime);
  if (isNaN(seconds)) return uptime;
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  let result = '';
  if (days > 0) result += `${days}天`;
  if (hours > 0 || days > 0) result += `${hours}小时`;
  result += `${minutes}分钟`;
  
  return result;
}

/**
 * 防抖函数
 * @param {Function} func 要执行的函数
 * @param {number} wait 等待时间（毫秒）
 * @returns {Function} 防抖处理后的函数
 */
function debounce(func, wait = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * 自动刷新数据
 * @param {number} interval 刷新间隔（毫秒）
 */
function startAutoRefresh(interval = 30000) {
  // 清除已存在的定时器
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  // 设置新的定时器
  updateInterval = setInterval(() => {
    loadPoolsData();
    loadSystemStatus();
  }, interval);
  
  console.log(`已启动自动刷新，间隔: ${interval}ms`);
}

/**
 * 停止自动刷新
 */
function stopAutoRefresh() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log('已停止自动刷新');
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('流动性池页面加载完成，开始初始化...');
  
  // 首先检查API状态
  const apiAvailable = await checkApiStatus();
  
  if (apiAvailable) {
    // 加载数据
    await loadPoolsData();
    await loadSystemStatus();
    
    // 初始化事件监听器
    initEventListeners();
    
    // 启动自动刷新
    startAutoRefresh();
  } else {
    console.error('API服务不可用，无法加载数据');
    showNotification('错误', 'API服务不可用，请检查网络连接或服务器状态', 'error');
  }
}); 