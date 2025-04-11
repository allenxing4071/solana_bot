/**
 * 流动性池页面脚本
 * 用于获取和显示系统中的流动性池信息
 */

// DOM加载完成后执行初始化
document.addEventListener('DOMContentLoaded', () => {
  initPage();
  
  // 更新时间显示
  updateDateTime();
  setInterval(updateDateTime, 1000);
});

// DOM元素
const poolsTableBody = document.getElementById('poolsTableBody');
const refreshBtn = document.getElementById('refreshBtn');
const searchInput = document.querySelector('.search-input');
const dexSelect = document.querySelector('[aria-label="选择交易所"]');
const sortSelect = document.querySelector('[aria-label="排序方式"]');
const prevPageBtn = document.querySelector('.pagination button:first-child');
const nextPageBtn = document.querySelector('.pagination button:last-child');
const paginationInfo = document.querySelector('.pagination span');

// 状态变量
let allPools = [];
let filteredPools = [];
let currentPage = 1;
const pageSize = 10;
let statusUpdateInterval;
let poolStats = null; // 池统计数据

// 系统状态元素
const statusIndicator = document.querySelector('.status-indicator');
const statusText = document.getElementById('statusText');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');

/**
 * 初始化页面
 */
function initPage() {
  // 绑定事件
  refreshBtn.addEventListener('click', fetchPoolsData);
  searchInput.addEventListener('input', filterPools);
  dexSelect.addEventListener('change', filterPools);
  sortSelect.addEventListener('change', sortPools);
  prevPageBtn.addEventListener('click', goToPrevPage);
  nextPageBtn.addEventListener('click', goToNextPage);
  
  // 设置系统状态处理
  setupSystemControls();
  
  // 定期刷新数据
  fetchPoolsData();
  setInterval(fetchPoolsData, 30000); // 每30秒刷新一次
}

/**
 * 设置系统状态控制
 */
function setupSystemControls() {
  // 启动系统
  startBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/system/start', { method: 'POST' });
      if (response.ok) {
        updateSystemStatus('running');
      }
    } catch (error) {
      console.error('启动系统失败:', error);
    }
  });
  
  // 停止系统
  stopBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/system/stop', { method: 'POST' });
      if (response.ok) {
        updateSystemStatus('stopped');
      }
    } catch (error) {
      console.error('停止系统失败:', error);
    }
  });
  
  // 定期检查系统状态
  fetchSystemStatus();
  setInterval(fetchSystemStatus, 5000); // 每5秒检查一次
}

/**
 * 获取系统状态
 */
async function fetchSystemStatus() {
  try {
    const response = await fetch('/api/system/status');
    if (response.ok) {
      const data = await response.json();
      updateSystemStatus(data.status);
    }
  } catch (error) {
    console.error('获取系统状态失败:', error);
  }
}

/**
 * 更新系统状态显示
 * @param {string} status 系统状态
 */
function updateSystemStatus(status) {
  // 移除所有状态类
  statusIndicator.classList.remove('status-running', 'status-stopped', 'status-error', 'status-paused');
  
  // 根据状态更新显示
  switch (status) {
    case 'running':
      statusIndicator.classList.add('status-running');
      statusText.textContent = '系统运行中';
      startBtn.disabled = true;
      stopBtn.disabled = false;
      break;
    case 'stopped':
      statusIndicator.classList.add('status-stopped');
      statusText.textContent = '系统已停止';
      startBtn.disabled = false;
      stopBtn.disabled = true;
      break;
    case 'error':
      statusIndicator.classList.add('status-error');
      statusText.textContent = '系统错误';
      startBtn.disabled = false;
      stopBtn.disabled = true;
      break;
    case 'paused':
      statusIndicator.classList.add('status-paused');
      statusText.textContent = '系统已暂停';
      startBtn.disabled = false;
      stopBtn.disabled = false;
      break;
    default:
      statusIndicator.classList.add('status-stopped');
      statusText.textContent = '状态未知';
      startBtn.disabled = false;
      stopBtn.disabled = true;
  }
}

/**
 * 获取流动性池数据
 */
async function fetchPoolsData() {
    try {
        console.log('正在获取流动性池数据...');
        
        // 显示加载状态
        showLoading();
        
        // 获取过滤和排序参数
        const searchInput = document.querySelector('.search-input').value.trim();
        const dexFilter = document.querySelector('select[aria-label="选择交易所"]').value;
        const sortBy = document.querySelector('select[aria-label="排序方式"]').value;
        
        // 构建API请求参数
        const options = {
            page: currentPage,
            limit: pageSize,
            sort: sortBy,
            sortDirection: 'desc'
        };
        
        // 添加搜索参数
        if (searchInput) {
            options.search = searchInput;
        }
        
        // 添加DEX过滤参数
        if (dexFilter !== 'all') {
            options.dex = dexFilter;
        }
        
        // 设置API端点
        const endpoint = '/api/pools';
        
        // 使用统一的数据源加载方法
        const data = await getDataSource(endpoint, options, generateMockPools, 100);
        
        // 检查是否成功获取数据
        if (!data.success) {
            throw new Error(data.error || '获取流动性池数据失败');
        }
        
        // 使用返回的分页数据
        allPools = data.data;
        
        // 更新分页信息
        const totalPools = data.count;
        const totalPages = data.totalPages;
        
        // 渲染池数据
        renderPools();
        
        // 更新分页UI
        updatePaginationInfo(currentPage, totalPages, totalPools);
        
        // 如果这是第一次加载或数据已更新
        if (!poolStats || data.isBackupData) {
            // 获取池统计数据
            await fetchPoolStats();
        }
        
        // 隐藏加载状态
        hideLoading();
        
        console.log(`已加载 ${allPools.length} 个池，总计 ${totalPools} 个`);
        
        // 设置上次更新时间
        document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
    } catch (error) {
        console.error('获取流动性池数据失败:', error);
        showError(`获取流动性池数据失败: ${error.message}`);
        hideLoading();
    }
}

/**
 * 生成模拟流动性池数据
 * @param {number} count 要生成的池数量
 * @returns {Array} 模拟池数据数组
 */
function generateMockPools(count) {
    const pools = [];
    const dexes = ['Raydium', 'Orca', 'Jupiter', 'Meteora'];
    const tokenPairs = [
        { pair: 'SOL-USDC', token1: 'SOL', token2: 'USDC' },
        { pair: 'BTC-USDC', token1: 'BTC', token2: 'USDC' },
        { pair: 'ETH-USDC', token1: 'ETH', token2: 'USDC' },
        { pair: 'JUP-USDC', token1: 'JUP', token2: 'USDC' },
        { pair: 'RAY-USDC', token1: 'RAY', token2: 'USDC' },
        { pair: 'BONK-SOL', token1: 'BONK', token2: 'SOL' },
        { pair: 'SOL-USDT', token1: 'SOL', token2: 'USDT' },
        { pair: 'mSOL-SOL', token1: 'mSOL', token2: 'SOL' }
    ];
    
    for (let i = 0; i < count; i++) {
        const dex = dexes[Math.floor(Math.random() * dexes.length)];
        const tokenPair = tokenPairs[Math.floor(Math.random() * tokenPairs.length)];
        const liquidity = Math.random() * 1000000000 + 1000000;
        const volume24h = liquidity * (Math.random() * 0.5 + 0.1);
        const apy = Math.random() * 30 + 2;
        const price = tokenPair.token1 === 'SOL' ? 100 + Math.random() * 20 - 10 :
                     tokenPair.token1 === 'BTC' ? 60000 + Math.random() * 5000 - 2500 :
                     tokenPair.token1 === 'ETH' ? 3000 + Math.random() * 500 - 250 :
                     tokenPair.token1 === 'JUP' ? 0.5 + Math.random() * 0.2 - 0.1 :
                     tokenPair.token1 === 'RAY' ? 0.3 + Math.random() * 0.1 - 0.05 :
                     tokenPair.token1 === 'BONK' ? 0.00001 + Math.random() * 0.000005 - 0.0000025 :
                     tokenPair.token1 === 'mSOL' ? 110 + Math.random() * 20 - 10 : 1;
        const priceChange = Math.random() * 20 - 10; // -10% 到 +10%
        
        pools.push({
            address: `${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
            pair: tokenPair.pair,
            token1: tokenPair.token1,
            token2: tokenPair.token2,
            dex,
            liquidity,
            volume24h,
            apy,
            price,
            priceChange,
            createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
        });
    }
    
    // 模拟按照排序参数排序
    pools.sort((a, b) => b.liquidity - a.liquidity);
    
    return pools;
}

/**
 * 获取池子统计信息
 */
async function fetchPoolStats() {
  try {
    // 尝试从API获取数据
    try {
      const response = await fetch('/api/pools/stats');
      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.error || '获取统计信息失败');
      }
      
      // 更新统计信息
      poolStats = responseData.data;
      console.log('池子统计:', poolStats);
      
      // 更新UI统计显示
      updatePoolStatsUI(poolStats);
    } catch (apiError) {
      console.warn('API请求失败，使用模拟统计数据', apiError);
      // 使用模拟统计数据
      poolStats = {
        totalPools: allPools.length || 147,
        totalValueLocked: 5432109876,
        avgDailyVolume: 342567890,
        mostActiveNetwork: 'Raydium',
        activePoolsCount: Math.floor(allPools.length * 0.7) || 98,
        totalTransactions24h: 12345,
        newPools24h: 5
      };
      console.log('模拟池子统计:', poolStats);
      
      // 更新UI统计显示
      updatePoolStatsUI(poolStats);
    }
  } catch (error) {
    console.error('获取池子统计信息出错:', error);
    addLog('获取池子统计失败，使用模拟数据', 'warning');
  }
}

/**
 * 更新池统计信息UI显示
 * @param {Object} stats 统计数据
 */
function updatePoolStatsUI(stats) {
  // 更新各个统计指标的显示
  // 检查元素是否存在后再更新内容
  const totalPoolsElement = document.getElementById('totalPools');
  if (totalPoolsElement) {
    totalPoolsElement.textContent = formatNumber(stats.totalPools);
  }
  
  const totalValueElement = document.getElementById('totalValue');
  if (totalValueElement) {
    totalValueElement.textContent = formatUSD(stats.totalValueLocked);
  }
  
  const avgVolumeElement = document.getElementById('avgVolume');
  if (avgVolumeElement) {
    avgVolumeElement.textContent = formatUSD(stats.avgDailyVolume);
  }
  
  const mostActiveDexElement = document.getElementById('mostActiveDex');
  if (mostActiveDexElement) {
    mostActiveDexElement.textContent = stats.mostActiveNetwork;
  }
  
  const activePoolsElement = document.getElementById('activePools');
  if (activePoolsElement) {
    activePoolsElement.textContent = formatNumber(stats.activePoolsCount);
  }
  
  // 更新其他可能的统计元素...
}

/**
 * 过滤池子数据
 */
function filterPools() {
  if (!allPools || allPools.length === 0) {
    filteredPools = [];
    renderPools();
    updatePagination();
    return;
  }

  // 在服务端分页和过滤的情况下，仅当使用模拟数据时才需要客户端过滤
  if (window.usingMockData) {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedDex = dexSelect.value;
    
    // 应用过滤
    filteredPools = allPools.filter(pool => {
      // 搜索词过滤 (池子地址、代币符号)
      const tokenPair = `${pool.token1 || ''}-${pool.token2 || ''}`.toLowerCase();
      const poolAddress = pool.address.toString().toLowerCase();
      const searchMatch = !searchTerm || 
                          tokenPair.includes(searchTerm) || 
                          poolAddress.includes(searchTerm);
      
      // DEX过滤
      const dexMatch = selectedDex === 'all' || pool.dex.toLowerCase() === selectedDex.toLowerCase();
      
      return searchMatch && dexMatch;
    });
    
    // 应用排序
    sortPools();
    
    // 重置到第一页
    currentPage = 1;
    
    // 计算总页数
    const totalPages = Math.ceil(filteredPools.length / pageSize) || 1;
    
    // 更新分页信息
    updatePaginationInfo(currentPage, totalPages, filteredPools.length);
  } else {
    // 使用服务端分页和过滤，重新请求数据
    fetchPoolsData();
  }
}

/**
 * 排序池子数据
 */
function sortPools() {
  const sortBy = sortSelect.value;
  
  filteredPools.sort((a, b) => {
    switch (sortBy) {
      case 'liquidity':
        return (b.liquidity || 0) - (a.liquidity || 0);
      case 'volume':
        return (b.volume24h || 0) - (a.volume24h || 0);
      case 'apy':
        return (b.apy || 0) - (a.apy || 0);
      default:
        return b.createdAt - a.createdAt; // 默认按创建时间排序
    }
  });
  
  renderPools();
}

/**
 * 渲染池子数据到表格
 */
function renderPools() {
  // 计算当前页显示的池子
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPools = filteredPools.slice(startIndex, endIndex);
  
  // 如果没有数据
  if (paginatedPools.length === 0) {
    poolsTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center">
          <div class="py-5">没有找到匹配的流动性池</div>
        </td>
      </tr>
    `;
    return;
  }
  
  // 构建表格行
  let html = '';
  for (const pool of paginatedPools) {
    const token1Symbol = pool.token1 || '未知';
    const token2Symbol = pool.token2 || '未知';
    
    // 准备代币图标路径 (如果不存在则使用默认图标)
    const token1Icon = `img/tokens/${token1Symbol.toLowerCase()}.svg`;
    const token2Icon = `img/tokens/${token2Symbol.toLowerCase()}.svg`;
    
    html += `
      <tr>
        <td>
          <div style="display: flex; align-items: center;">
            <div style="display: flex; margin-right: 10px;">
              <img src="${token1Icon}" onerror="this.src='img/tokens/unknown.svg'" alt="${token1Symbol}" width="24" height="24" style="border-radius: 50%; margin-right: -8px; z-index: 2;">
              <img src="${token2Icon}" onerror="this.src='img/tokens/unknown.svg'" alt="${token2Symbol}" width="24" height="24" style="border-radius: 50%; z-index: 1;">
            </div>
            <div>${token1Symbol}-${token2Symbol}</div>
          </div>
        </td>
        <td>${capitalizeFirstLetter(pool.dex)}</td>
        <td>${formatUSD(pool.liquidity || 0)}</td>
        <td>${formatUSD(pool.volume24h || 0)}</td>
        <td>${formatPercentage(pool.apy || 0)}</td>
        <td>${formatUSD(pool.price || 0)}</td>
        <td class="${getChangeClass(pool.priceChange || 0)}">${formatChange(pool.priceChange || 0)}</td>
        <td>
          <button class="btn btn-outline-primary btn-sm" onclick="viewPoolDetails('${pool.address}')">
            查看详情
          </button>
        </td>
      </tr>
    `;
  }
  
  poolsTableBody.innerHTML = html;
}

/**
 * 更新分页控件
 */
function updatePagination() {
  const totalPages = Math.ceil(filteredPools.length / pageSize) || 1;
  paginationInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
  
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
}

/**
 * 前往上一页
 */
function goToPrevPage() {
  if (currentPage > 1) {
    currentPage--;
    fetchPoolsData();
  }
}

/**
 * 前往下一页
 */
function goToNextPage() {
  if (currentPage < Math.ceil(filteredPools.length / pageSize)) {
    currentPage++;
    fetchPoolsData();
  }
}

/**
 * 查看池子详情
 * @param {string} address 池子地址
 */
function viewPoolDetails(address) {
  // 显示弹窗
  const modal = document.getElementById('poolDetailsModal');
  const modalTitle = document.getElementById('modalPoolTitle');
  const modalContent = document.getElementById('poolDetailsContent');
  
  modal.style.display = 'block';
  modalTitle.textContent = '加载中...';
  modalContent.innerHTML = '<div class="text-center py-5">正在加载池子详情...</div>';
  
  // 获取池子详情
  fetchPoolDetails(address)
    .then(pool => {
      if (!pool) {
        modalContent.innerHTML = '<div class="alert alert-danger">无法加载池子详情</div>';
        return;
      }
      
      const token1Symbol = pool.token1 || '未知代币';
      const token2Symbol = pool.token2 || '未知代币';
      
      modalTitle.textContent = `${token1Symbol}-${token2Symbol} 池子详情`;
      
      // 构建详情内容
      modalContent.innerHTML = `
        <div class="pool-details">
          <div class="detail-section">
            <h3>基本信息</h3>
            <table class="detail-table">
              <tr>
                <th>池子地址</th>
                <td>${pool.address}</td>
              </tr>
              <tr>
                <th>DEX</th>
                <td>${capitalizeFirstLetter(pool.dex)}</td>
              </tr>
              <tr>
                <th>创建时间</th>
                <td>${formatDate(pool.createdAt)}</td>
              </tr>
            </table>
          </div>
          
          <div class="detail-section mt-4">
            <h3>代币信息</h3>
            <div class="token-cards">
              <div class="token-card">
                <div class="token-header">
                  <img src="img/tokens/${token1Symbol.toLowerCase()}.svg" onerror="this.src='img/tokens/unknown.svg'" alt="${token1Symbol}" width="32" height="32" style="border-radius: 50%;">
                  <h4>${token1Symbol}</h4>
                </div>
                <div class="token-body">
                  <p><strong>Mint地址:</strong> ${pool.tokenAMint}</p>
                  <p><strong>余额:</strong> ${formatNumber(pool.reserves?.tokenA || 0)}</p>
                </div>
              </div>
              
              <div class="token-card">
                <div class="token-header">
                  <img src="img/tokens/${token2Symbol.toLowerCase()}.svg" onerror="this.src='img/tokens/unknown.svg'" alt="${token2Symbol}" width="32" height="32" style="border-radius: 50%;">
                  <h4>${token2Symbol}</h4>
                </div>
                <div class="token-body">
                  <p><strong>Mint地址:</strong> ${pool.tokenBMint}</p>
                  <p><strong>余额:</strong> ${formatNumber(pool.reserves?.tokenB || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .catch(error => {
      console.error('获取池子详情失败:', error);
      modalContent.innerHTML = `<div class="alert alert-danger">获取池子详情失败: ${error.message}</div>`;
    });
}

/**
 * 获取池子详情
 * @param {string} address 池子地址
 * @returns {Promise<Object>} 池子详情
 */
async function fetchPoolDetails(address) {
  try {
    const response = await fetch(`/api/pools/${address}`);
    
    if (!response.ok) {
      throw new Error(`获取池子详情失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
    
    throw new Error(data.error || '未知错误');
  } catch (error) {
    console.error('获取池子详情出错:', error);
    throw error;
  }
}

/**
 * 关闭池子详情弹窗
 */
function closePoolDetails() {
  const modal = document.getElementById('poolDetailsModal');
  modal.style.display = 'none';
}

// 工具函数
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function formatUSD(value) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'USD' }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatPercentage(value) {
  return `${value.toFixed(2)}%`;
}

function formatChange(value) {
  return value > 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
}

function getChangeClass(value) {
  return value > 0 ? 'text-success' : value < 0 ? 'text-danger' : '';
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('zh-CN');
}

/**
 * 显示加载器
 */
function showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
  } else {
    // 如果HTML中没有加载器元素，则创建一个
    const newOverlay = document.createElement('div');
    newOverlay.id = 'loadingOverlay';
    newOverlay.className = 'loading-overlay';
    newOverlay.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner-border" role="status">
          <span class="sr-only">Loading...</span>
        </div>
      </div>
    `;
    newOverlay.style.position = 'fixed';
    newOverlay.style.top = '0';
    newOverlay.style.left = '0';
    newOverlay.style.width = '100%';
    newOverlay.style.height = '100%';
    newOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    newOverlay.style.display = 'flex';
    newOverlay.style.justifyContent = 'center';
    newOverlay.style.alignItems = 'center';
    newOverlay.style.zIndex = '9999';
    
    document.body.appendChild(newOverlay);
  }
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

/**
 * 添加日志
 * @param {string} message 消息内容
 * @param {string} level 日志级别 (info, success, warning, error)
 */
function addLog(message, level = 'info') {
  console.log(`[${level.toUpperCase()}] ${message}`);
  
  // 添加到系统消息区域
  const systemMessages = document.getElementById('systemMessages');
  if (systemMessages) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `system-message ${level}`;
    
    let iconHtml = '';
    switch(level) {
      case 'success':
        iconHtml = '<span class="message-icon">✓</span>';
        break;
      case 'warning':
        iconHtml = '<span class="message-icon">⚠</span>';
        break;
      case 'error':
        iconHtml = '<span class="message-icon">✗</span>';
        break;
      default:
        iconHtml = '<span class="message-icon">ℹ</span>';
    }
    
    messageDiv.innerHTML = `
      ${iconHtml}
      <div class="message-content">
        <div class="message-text">${message}</div>
        <div class="message-time">${timeString}</div>
      </div>
    `;
    
    systemMessages.appendChild(messageDiv);
    
    // 5秒后自动移除消息
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.style.opacity = '0';
        messageDiv.style.height = '0';
        messageDiv.style.transition = 'opacity 0.5s ease, height 0.5s ease, margin 0.5s ease, padding 0.5s ease';
        messageDiv.style.overflow = 'hidden';
        messageDiv.style.margin = '0';
        messageDiv.style.padding = '0';
        
        // 完全移除元素
        setTimeout(() => {
          if (messageDiv.parentNode) {
            systemMessages.removeChild(messageDiv);
          }
        }, 500);
      }
    }, 5000);
    
    // 限制消息数量
    while (systemMessages.children.length > 3) {
      systemMessages.removeChild(systemMessages.firstChild);
    }
  }
  
  // 如果页面上有日志容器，则添加日志到容器中
  const logContainer = document.getElementById('logContainer');
  if (logContainer) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${level}`;
    logEntry.innerHTML = `
      <span class="log-time">${timeString}</span>
      <span class="log-message">${message}</span>
    `;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // 限制日志条数
    while (logContainer.children.length > 100) {
      logContainer.removeChild(logContainer.firstChild);
    }
  }
}

/**
 * 更新分页信息
 * @param {number} page 当前页码
 * @param {number} totalPages 总页数
 * @param {number} totalItems 总项目数
 */
function updatePaginationInfo(page, totalPages, totalItems) {
  if (paginationInfo) {
    paginationInfo.textContent = `第 ${page} 页，共 ${totalPages} 页 (${totalItems} 个结果)`;
  }
  
  // 更新翻页按钮状态
  if (prevPageBtn) {
    prevPageBtn.disabled = page <= 1;
  }
  
  if (nextPageBtn) {
    nextPageBtn.disabled = page >= totalPages;
  }
}

/**
 * 更新日期时间显示
 */
function updateDateTime() {
  const now = new Date();
  const formattedDateTime = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const dateTimeElement = document.getElementById('currentDateTime');
  if (dateTimeElement) {
    dateTimeElement.textContent = formattedDateTime;
  }
  
  // 也更新"上次更新"时间
  const lastUpdated = document.getElementById('lastUpdated');
  if (lastUpdated && lastUpdated.textContent === '') {
    lastUpdated.textContent = formattedDateTime;
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage); 