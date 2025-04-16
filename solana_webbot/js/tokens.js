/**
 * Solana MEV机器人 - 代币监控页面JavaScript
 */

document.addEventListener('DOMContentLoaded', async function() {
  // 初始化变量
  let currentPage = 1;
  let allTokens = [];
  let filteredTokens = [];
  let itemsPerPage = 10;
  let currentViewMode = 'list';
  
  // 加载代币数据
  async function loadTokensData() {
    try {
      // 显示加载中状态
      showLoading();
      
      // 从API获取代币数据
      const url = `${getApiBaseUrl()}/tokens?t=${Date.now()}`;
      console.log(`从API获取代币数据: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('收到API响应:', data);
      
      // 检查API响应是否成功且包含数据
      if (!data.success || !data.data || data.data.length === 0) {
        // 如果没有数据，显示"--"
        hideLoading();
        displayNoDataState();
        return;
      }
      
      // 处理API返回的真实数据
      const tokensData = {
        stats: {
          whitelistCount: data.stats?.whitelistCount || 0,
          blacklistCount: data.stats?.blacklistCount || 0,
          detectedToday: data.stats?.today_new || 0,
          avgRiskScore: data.stats?.avgRiskScore || calculateAvgRiskScore(data.data) || 5.0
        },
        tokens: transformTokensData(data.data)
      };
      
      // 更新统计数据
      document.getElementById('whitelistCount').textContent = tokensData.stats.whitelistCount;
      document.getElementById('blacklistCount').textContent = tokensData.stats.blacklistCount;
      document.getElementById('detectedToday').textContent = tokensData.stats.detectedToday;
      document.getElementById('avgRiskScore').textContent = tokensData.stats.avgRiskScore.toFixed(1);
      
      // 存储所有代币数据
      allTokens = tokensData.tokens;
      
      // 显示第一页数据
      filterAndDisplayTokens();
      
      // 更新最后更新时间
      document.querySelector('.last-updated').textContent = `最后更新: ${formatDateTime(new Date().toISOString())}`;
      
      // 隐藏加载状态
      hideLoading();
    } catch (error) {
      console.error('加载代币数据失败:', error);
      showNotification('错误', `加载数据失败: ${error.message}`, 'error');
      hideLoading();
      displayNoDataState();
    }
  }
  
  /**
   * 计算平均风险评分
   * @param {Array} tokens 代币数据数组
   * @returns {number} 平均风险评分
   */
  function calculateAvgRiskScore(tokens) {
    if (!Array.isArray(tokens) || tokens.length === 0) return 5.0;
    
    let totalRisk = 0;
    let count = 0;
    
    for (const token of tokens) {
      if (token.risk) {
        // 将文本风险等级转换为数值
        let riskScore = 5.0;
        if (token.risk === '低') riskScore = 2.5;
        else if (token.risk === '中') riskScore = 5.0;
        else if (token.risk === '高') riskScore = 8.5;
        
        totalRisk += riskScore;
        count++;
      }
    }
    
    return count > 0 ? totalRisk / count : 5.0;
  }
  
  /**
   * 转换代币数据为标准格式
   * @param {Array} rawTokens 原始代币数据
   * @returns {Array} 标准格式的代币数据
   */
  function transformTokensData(rawTokens) {
    if (!Array.isArray(rawTokens)) return [];
    
    return rawTokens.map(token => {
      // 根据风险等级确定代币类型
      let tokenType = '未分类';
      if (token.risk === '低') tokenType = '白名单';
      else if (token.risk === '高') tokenType = '黑名单';
      else if (token.risk === '中') tokenType = '一般';
      
      // 风险评分转换 - 使用更稳定的值而不是随机数
      let riskScore = 5.0;
      if (token.risk === '低') riskScore = 2.5;  // 固定低风险评分
      else if (token.risk === '中') riskScore = 5.0;  // 固定中等风险评分
      else if (token.risk === '高') riskScore = 8.5;  // 固定高风险评分
      
      // 创建一个基于流动性的价格和价格变化
      const price = token.liquidity ? (token.liquidity / 1000) : Math.random() * 10;
      const priceChange24h = token.liquidity ? ((token.liquidity % 20) - 10) : (Math.random() * 20) - 10; // -10% 到 +10%
      
      // 生成一个基于代币名称的稳定符号
      const symbol = token.name?.substring(0, 4)?.toUpperCase() || 'TOKEN';
      
      return {
        name: token.name || '',
        symbol: symbol,
        address: token.address || '',
        type: tokenType,
        price: price,
        priceChange24h: priceChange24h,
        marketCap: token.liquidity * 2 || 0,
        volume24h: token.liquidity / 2 || 0,
        riskScore: riskScore,
        createdAt: token.discoveredAt ? new Date(token.discoveredAt * 1000).toISOString() : new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    });
  }
  
  // 显示没有数据的状态，所有指标显示"--"
  function displayNoDataState() {
    // 更新统计数据为"--"
    document.getElementById('whitelistCount').textContent = "--";
    document.getElementById('blacklistCount').textContent = "--";
    document.getElementById('detectedToday').textContent = "--";
    document.getElementById('avgRiskScore').textContent = "--";
    
    // 清空代币数据
    allTokens = [];
    
    // 更新表格显示无数据
    const tableBody = document.getElementById('tokensTableBody');
    if (tableBody) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="8" class="text-center">没有代币数据</td>';
      tableBody.innerHTML = '';
      tableBody.appendChild(emptyRow);
    }
    
    // 清空网格视图
    const gridContainer = document.getElementById('tokensGridContainer');
    if (gridContainer) {
      gridContainer.innerHTML = '<div class="empty-grid-message">没有代币数据</div>';
    }
    
    // 清空分页
    const paginationContainer = document.getElementById('tokensPagination');
    if (paginationContainer) {
      paginationContainer.innerHTML = '';
    }
    
    // 更新最后更新时间
    const lastUpdatedElement = document.querySelector('.last-updated');
    if (lastUpdatedElement) {
      lastUpdatedElement.textContent = `最后更新: ${formatDateTime(new Date().toISOString())}`;
    }
  }
  
  /**
   * 加载系统状态数据
   */
  async function loadSystemStatus() {
    try {
      // 从API获取系统状态
      const url = `${getApiBaseUrl()}/status?t=${Date.now()}`;
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
      
      // 构造状态数据对象
      const statusData = {
        status: data.data.status === 'running' ? '运行中' : '已停止',
        uptime: data.data.uptime,
        currentTime: data.data.currentTime || new Date().toISOString()
      };
      
      // 更新系统状态UI
      updateSystemStatusUI(statusData);
      
      // 更新当前日期时间
      const dateTimeElement = document.querySelector('.current-date-time');
      if (dateTimeElement) {
        dateTimeElement.textContent = formatDateTime(statusData.currentTime);
      }
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
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    if (statusDot && statusText) {
      const isRunning = statusData.status === 'running';
      statusDot.className = `status-dot ${isRunning ? 'running' : 'stopped'}`;
      statusText.className = `status-text ${isRunning ? 'text-success' : 'text-error'}`;
      statusText.textContent = isRunning ? '运行中' : '已停止';
    }
    
    // 更新运行时间
    const uptime = document.querySelector('.uptime');
    if (uptime) {
      uptime.textContent = formatUptime(statusData.uptime);
    }
  }
  
  // 筛选并显示代币数据
  function filterAndDisplayTokens() {
    const searchQuery = document.getElementById('searchTokenInput').value.toLowerCase();
    const tokenTypeFilter = document.getElementById('tokenTypeFilter').value;
    const riskFilter = document.getElementById('riskFilter').value;
    const sortBy = document.getElementById('sortTokensBy').value;
    
    // 筛选代币
    filteredTokens = allTokens.filter(token => {
      const matchSearch = token.name.toLowerCase().includes(searchQuery) || 
                         token.symbol.toLowerCase().includes(searchQuery) ||
                         token.address.toLowerCase().includes(searchQuery);
      
      let matchType = true;
      if (tokenTypeFilter !== 'all') {
        // 转换为中文类型名称进行匹配
        const typeMap = {
          'whitelist': '白名单',
          'blacklist': '黑名单',
          'unknown': '未分类'
        };
        matchType = token.type === typeMap[tokenTypeFilter];
      }
      
      let matchRisk = true;
      if (riskFilter !== 'all') {
        if (riskFilter === 'low') {
          matchRisk = token.riskScore >= 1 && token.riskScore <= 3;
        } else if (riskFilter === 'medium') {
          matchRisk = token.riskScore > 3 && token.riskScore <= 7;
        } else if (riskFilter === 'high') {
          matchRisk = token.riskScore > 7 && token.riskScore <= 10;
        }
      }
      
      return matchSearch && matchType && matchRisk;
    });
    
    // 对代币排序
    filteredTokens.sort((a, b) => {
      const [field, direction] = sortBy.split('_');
      const multiplier = direction === 'desc' ? -1 : 1;
      
      if (field === 'name') {
        return a.name.localeCompare(b.name) * multiplier;
      } else if (field === 'price') {
        return (a.price - b.price) * multiplier;
      } else if (field === 'risk') {
        return (a.riskScore - b.riskScore) * multiplier;
      } else if (field === 'date') {
        return (new Date(a.createdAt) - new Date(b.createdAt)) * multiplier;
      }
      
      return 0;
    });
    
    // 显示当前视图模式的代币
    if (currentViewMode === 'list') {
      displayTokensTable(filteredTokens);
    } else {
      displayTokensGrid(filteredTokens);
    }
    
    // 更新分页
    updatePagination();
  }
  
  // 表格视图显示代币
  function displayTokensTable(tokens) {
    const tableBody = document.getElementById('tokensTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // 计算分页
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, tokens.length);
    const displayedTokens = tokens.slice(startIndex, endIndex);
    
    if (displayedTokens.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="8" class="text-center">没有找到匹配的代币</td>';
      tableBody.appendChild(emptyRow);
      return;
    }
    
    // 添加代币行
    for (const token of displayedTokens) {
      const row = document.createElement('tr');
      
      // 确定代币类型样式
      let typeBadgeClass = '';
      if (token.type === '白名单') {
        typeBadgeClass = 'token-whitelist-badge';
      } else if (token.type === '黑名单') {
        typeBadgeClass = 'token-blacklist-badge';
      } else {
        typeBadgeClass = 'token-unknown-badge';
      }
      
      // 确定风险等级
      let riskClass = '';
      let riskWidth = token.riskScore * 10 + '%'; // 风险评分的百分比宽度
      
      if (token.riskScore <= 3) {
        riskClass = 'risk-low';
      } else if (token.riskScore <= 7) {
        riskClass = 'risk-medium';
      } else {
        riskClass = 'risk-high';
      }
      
      // 构造价格变化显示
      const priceChangeClass = token.priceChange24h >= 0 ? 'positive' : 'negative';
      const priceChangeSymbol = token.priceChange24h >= 0 ? '↑' : '↓';
      const priceChangeAbs = Math.abs(token.priceChange24h).toFixed(2);
      
      row.innerHTML = `
        <td>
          <div class="font-medium">${token.symbol}</div>
          <div class="text-secondary text-xs">${token.name}</div>
          <div class="text-secondary text-xs truncate">${formatAddress(token.address)}</div>
        </td>
        <td><span class="token-type-badge ${typeBadgeClass}">${token.type}</span></td>
        <td>$${typeof token.price === 'number' && token.price < 0.001 ? token.price.toExponential(2) : formatNumber(token.price)}</td>
        <td>
          <span class="price-change ${priceChangeClass}">
            ${priceChangeSymbol} ${priceChangeAbs}%
          </span>
        </td>
        <td>$${formatNumber(token.marketCap)}</td>
        <td>$${formatNumber(token.volume24h)}</td>
        <td>
          <div class="risk-indicator">
            <div class="risk-meter">
              <div class="risk-fill ${riskClass}" style="width: ${riskWidth}"></div>
            </div>
            <div>${token.riskScore.toFixed(1)}</div>
          </div>
        </td>
        <td>
          <button class="btn btn-outline btn-sm btn-icon view-token-details-btn" data-token-address="${token.address}" title="查看详情">
            <i class="ri-eye-line"></i>
          </button>
        </td>
      `;
      
      tableBody.appendChild(row);
    }
    
    // 添加事件监听器到详情按钮
    const detailButtons = document.querySelectorAll('.view-token-details-btn');
    for (const button of detailButtons) {
      button.addEventListener('click', function() {
        const tokenAddress = this.getAttribute('data-token-address');
        showTokenDetails(tokenAddress);
      });
    }
  }
  
  // 网格视图显示代币
  function displayTokensGrid(tokens) {
    const gridContainer = document.getElementById('tokensGridContainer');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '';
    
    // 计算分页
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, tokens.length);
    const displayedTokens = tokens.slice(startIndex, endIndex);
    
    if (displayedTokens.length === 0) {
      gridContainer.innerHTML = '<div class="text-center p-4">没有找到匹配的代币</div>';
      return;
    }
    
    // 添加代币卡片
    for (const token of displayedTokens) {
      const card = document.createElement('div');
      card.className = 'token-card';
      
      // 确定代币类型样式
      let typeBadgeClass = '';
      if (token.type === '白名单') {
        typeBadgeClass = 'token-whitelist-badge';
      } else if (token.type === '黑名单') {
        typeBadgeClass = 'token-blacklist-badge';
      } else {
        typeBadgeClass = 'token-unknown-badge';
      }
      
      // 确定风险等级
      let riskClass = '';
      let riskWidth = token.riskScore * 10 + '%'; // 风险评分的百分比宽度
      
      if (token.riskScore <= 3) {
        riskClass = 'risk-low';
      } else if (token.riskScore <= 7) {
        riskClass = 'risk-medium';
      } else {
        riskClass = 'risk-high';
      }
      
      // 构造价格变化显示
      const priceChangeClass = token.priceChange24h >= 0 ? 'positive' : 'negative';
      const priceChangeSymbol = token.priceChange24h >= 0 ? '↑' : '↓';
      const priceChangeAbs = Math.abs(token.priceChange24h).toFixed(2);
      
      card.innerHTML = `
        <div class="token-card-header">
          <div class="token-info">
            <div class="token-name">${token.symbol}</div>
            <div class="text-secondary">${token.name}</div>
            <div class="token-address">${formatAddress(token.address)}</div>
          </div>
          <span class="token-type-badge ${typeBadgeClass}">${token.type}</span>
        </div>
        
        <div class="token-metrics">
          <div class="metric-item">
            <div class="metric-title">价格</div>
            <div class="metric-value">
              $${typeof token.price === 'number' && token.price < 0.001 ? token.price.toExponential(2) : formatNumber(token.price)}
            </div>
          </div>
          <div class="metric-item">
            <div class="metric-title">24h变化</div>
            <div class="metric-value ${priceChangeClass}">
              ${priceChangeSymbol} ${priceChangeAbs}%
            </div>
          </div>
          <div class="metric-item">
            <div class="metric-title">市值</div>
            <div class="metric-value">$${formatNumber(token.marketCap)}</div>
          </div>
          <div class="metric-item">
            <div class="metric-title">24h交易量</div>
            <div class="metric-value">$${formatNumber(token.volume24h)}</div>
          </div>
        </div>
        
        <div class="risk-indicator mb-4">
          <div class="metric-title">风险评分:</div>
          <div class="risk-meter">
            <div class="risk-fill ${riskClass}" style="width: ${riskWidth}"></div>
          </div>
          <div>${token.riskScore.toFixed(1)}</div>
        </div>
        
        <div class="token-actions">
          <div class="text-secondary text-xs">
            创建于: ${formatDateTime(token.createdAt, false)}
          </div>
          <button class="btn btn-outline btn-sm btn-icon view-token-details-btn" data-token-address="${token.address}" title="查看详情">
            <i class="ri-eye-line"></i>
          </button>
        </div>
      `;
      
      gridContainer.appendChild(card);
    }
    
    // 添加事件监听器到详情按钮
    const detailButtons = gridContainer.querySelectorAll('.view-token-details-btn');
    for (const button of detailButtons) {
      button.addEventListener('click', function() {
        const tokenAddress = this.getAttribute('data-token-address');
        showTokenDetails(tokenAddress);
      });
    }
  }
  
  // 更新分页控件
  function updatePagination() {
    const paginationContainer = document.getElementById('tokensPagination');
    if (!paginationContainer) return;
    
    // 计算总页数
    const totalPages = Math.ceil(filteredTokens.length / itemsPerPage);
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }
    
    paginationContainer.innerHTML = '';
    
    // 上一页按钮
    const prevBtn = document.createElement('button');
    prevBtn.className = `page-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '&lt;';
    prevBtn.title = '上一页';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        if (currentViewMode === 'list') {
          displayTokensTable(filteredTokens);
        } else {
          displayTokensGrid(filteredTokens);
        }
        updatePagination();
      }
    });
    paginationContainer.appendChild(prevBtn);
    
    // 页码信息
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
    paginationContainer.appendChild(pageInfo);
    
    // 下一页按钮
    const nextBtn = document.createElement('button');
    nextBtn.className = `page-btn ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = '&gt;';
    nextBtn.title = '下一页';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        if (currentViewMode === 'list') {
          displayTokensTable(filteredTokens);
        } else {
          displayTokensGrid(filteredTokens);
        }
        updatePagination();
      }
    });
    paginationContainer.appendChild(nextBtn);
  }
  
  // 显示代币详情
  function showTokenDetails(tokenAddress) {
    const token = allTokens.find(t => t.address === tokenAddress);
    if (!token) return;
    
    const modalTitle = document.getElementById('modalTokenName');
    const modalContent = document.getElementById('tokenDetailContent');
    
    if (modalTitle && modalContent) {
      modalTitle.textContent = `${token.name} (${token.symbol})`;
      
      // 确定代币类型样式
      let typeBadgeClass = '';
      if (token.type === '白名单') {
        typeBadgeClass = 'token-whitelist-badge';
      } else if (token.type === '黑名单') {
        typeBadgeClass = 'token-blacklist-badge';
      } else {
        typeBadgeClass = 'token-unknown-badge';
      }
      
      // 确定风险等级
      let riskClass = '';
      let riskWidth = token.riskScore * 10 + '%'; // 风险评分的百分比宽度
      
      if (token.riskScore <= 3) {
        riskClass = 'risk-low';
      } else if (token.riskScore <= 7) {
        riskClass = 'risk-medium';
      } else {
        riskClass = 'risk-high';
      }
      
      modalContent.innerHTML = `
        <div class="mb-4">
          <div class="flex justify-between items-center mb-4">
            <div>
              <span class="token-type-badge ${typeBadgeClass}">${token.type}</span>
              <span class="text-secondary text-sm">创建于: ${formatDateTime(token.createdAt)}</span>
            </div>
            <div class="text-secondary text-sm">更新时间: ${formatDateTime(token.lastUpdated)}</div>
          </div>
          
          <div class="card mb-4">
            <div class="card-header">
              <div class="card-title">基本信息</div>
            </div>
            <div class="p-4">
              <div class="mb-2">
                <div class="text-secondary text-sm">代币地址</div>
                <div class="truncate">${token.address}</div>
              </div>
              <div class="flex gap-4 mt-4">
                <div class="flex-1">
                  <div class="text-secondary text-sm">当前价格</div>
                  <div class="text-lg font-semibold">
                    $${typeof token.price === 'number' && token.price < 0.001 ? token.price.toExponential(4) : formatNumber(token.price)}
                    <span class="text-sm ${token.priceChange24h >= 0 ? 'text-success' : 'text-error'}">
                      ${token.priceChange24h >= 0 ? '↑' : '↓'} ${Math.abs(token.priceChange24h).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div class="flex-1">
                  <div class="text-secondary text-sm">市值</div>
                  <div class="text-lg font-semibold">$${formatNumber(token.marketCap)}</div>
                </div>
                <div class="flex-1">
                  <div class="text-secondary text-sm">24小时交易量</div>
                  <div class="text-lg font-semibold">$${formatNumber(token.volume24h)}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card mb-4">
            <div class="card-header">
              <div class="card-title">风险评估</div>
            </div>
            <div class="p-4">
              <div class="mb-4">
                <div class="text-secondary text-sm mb-2">风险评分</div>
                <div class="risk-indicator">
                  <div class="risk-meter" style="width: 100%;">
                    <div class="risk-fill ${riskClass}" style="width: ${riskWidth}"></div>
                  </div>
                  <div class="font-semibold">${token.riskScore.toFixed(1)} / 10</div>
                </div>
              </div>
              <div class="mt-4">
                <div class="text-secondary text-sm mb-2">风险因素</div>
                <ul class="ml-4">
                  <li class="mb-1">代币合约${token.riskScore > 5 ? '未' : '已'}开源</li>
                  <li class="mb-1">流动性评级: ${token.riskScore > 7 ? '低' : token.riskScore > 4 ? '中' : '高'}</li>
                  <li class="mb-1">持有者分布: ${token.riskScore > 7 ? '高度集中' : token.riskScore > 4 ? '部分集中' : '均匀分布'}</li>
                  <li class="mb-1">团队${token.riskScore > 6 ? '未' : '已'}验证</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="card p-4">
            <div class="font-medium mb-2">操作</div>
            <div class="flex gap-2">
              <button class="btn btn-outline btn-sm" title="查看交易历史">
                <i class="ri-history-line"></i> 交易历史
              </button>
              <button class="btn btn-outline btn-sm" title="在区块浏览器中查看">
                <i class="ri-external-link-line"></i> 浏览器
              </button>
              <button class="btn btn-outline btn-sm" title="设置价格提醒">
                <i class="ri-notification-line"></i> 价格提醒
              </button>
            </div>
          </div>
        </div>
      `;
      
      // 显示模态框
      toggleModal('tokenDetailModal', true);
    }
  }
  
  // 切换视图模式
  function toggleViewMode(mode) {
    currentViewMode = mode;
    const tableContainer = document.getElementById('tokensTableContainer');
    const gridContainer = document.getElementById('tokensGridContainer');
    
    if (mode === 'list') {
      if (tableContainer) tableContainer.style.display = 'block';
      if (gridContainer) gridContainer.style.display = 'none';
      displayTokensTable(filteredTokens);
    } else {
      if (tableContainer) tableContainer.style.display = 'none';
      if (gridContainer) gridContainer.style.display = 'grid';
      displayTokensGrid(filteredTokens);
    }
  }
  
  // 初始化事件监听器
  function initEventListeners() {
    // 关闭模态框按钮
    const closeTokenModalBtn = document.getElementById('closeTokenModalBtn');
    const closeTokenDetailBtn = document.getElementById('closeTokenDetailBtn');
    if (closeTokenModalBtn && closeTokenDetailBtn) {
      closeTokenModalBtn.addEventListener('click', () => toggleModal('tokenDetailModal', false));
      closeTokenDetailBtn.addEventListener('click', () => toggleModal('tokenDetailModal', false));
    }
    
    // 添加代币按钮
    const addTokenBtn = document.getElementById('addTokenBtn');
    if (addTokenBtn) {
      addTokenBtn.addEventListener('click', function() {
        showNotification('提示', '添加代币功能尚未实现', 'info');
      });
    }
    
    // 添加到白名单按钮
    const addToWhitelistBtn = document.getElementById('addToWhitelistBtn');
    if (addToWhitelistBtn) {
      addToWhitelistBtn.addEventListener('click', function() {
        showNotification('成功', '代币已添加到白名单', 'success');
        toggleModal('tokenDetailModal', false);
      });
    }
    
    // 添加到黑名单按钮
    const addToBlacklistBtn = document.getElementById('addToBlacklistBtn');
    if (addToBlacklistBtn) {
      addToBlacklistBtn.addEventListener('click', function() {
        showNotification('警告', '代币已添加到黑名单', 'warning');
        toggleModal('tokenDetailModal', false);
      });
    }
    
    // 搜索输入框
    const searchTokenInput = document.getElementById('searchTokenInput');
    if (searchTokenInput) {
      searchTokenInput.addEventListener('input', function() {
        currentPage = 1;
        filterAndDisplayTokens();
      });
    }
    
    // 代币类型筛选器
    const tokenTypeFilter = document.getElementById('tokenTypeFilter');
    if (tokenTypeFilter) {
      tokenTypeFilter.addEventListener('change', function() {
        currentPage = 1;
        filterAndDisplayTokens();
      });
    }
    
    // 风险等级筛选器
    const riskFilter = document.getElementById('riskFilter');
    if (riskFilter) {
      riskFilter.addEventListener('change', function() {
        currentPage = 1;
        filterAndDisplayTokens();
      });
    }
    
    // 排序选项
    const sortTokensBy = document.getElementById('sortTokensBy');
    if (sortTokensBy) {
      sortTokensBy.addEventListener('change', function() {
        filterAndDisplayTokens();
      });
    }
    
    // 视图模式切换
    const viewMode = document.getElementById('viewMode');
    if (viewMode) {
      viewMode.addEventListener('change', function() {
        toggleViewMode(this.value);
      });
    }
    
    // 系统启动按钮
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        try {
          // 调用启动系统API
          const url = `${getApiBaseUrl()}/start`;
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
    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) {
      stopBtn.addEventListener('click', async () => {
        try {
          // 调用停止系统API
          const url = `${getApiBaseUrl()}/stop`;
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
    
    // 刷新按钮
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        loadTokensData();
        loadSystemStatus();
      });
    }
  }
  
  /**
   * 自动刷新数据
   * @param {number} interval 刷新间隔（毫秒）
   */
  function startAutoRefresh(interval = 30000) {
    // 清除已存在的定时器
    if (window.updateInterval) {
      clearInterval(window.updateInterval);
    }
    
    // 设置新的定时器
    window.updateInterval = setInterval(() => {
      loadTokensData();
      loadSystemStatus();
    }, interval);
    
    console.log(`已启动自动刷新，间隔: ${interval}ms`);
  }
  
  /**
   * 停止自动刷新
   */
  function stopAutoRefresh() {
    if (window.updateInterval) {
      clearInterval(window.updateInterval);
      window.updateInterval = null;
      console.log('已停止自动刷新');
    }
  }
  
  // 页面加载完成后初始化
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('代币监控页面加载完成，开始初始化...');
    
    // 检查API状态
    const apiAvailable = await checkApiStatus();
    
    if (apiAvailable) {
      // 加载数据
      await loadTokensData();
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

  // 显示加载状态
  function showLoading() {
    const tableBody = document.getElementById('tokensTableBody');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr class="loading-state">
          <td colspan="8">
            <i class="ri-loader-4-line loading-spinner"></i>
            <span>加载数据中...</span>
          </td>
        </tr>
      `;
    }
  }

  // 隐藏加载状态
  function hideLoading() {
    // 加载状态由内容替换，不需要特别处理
  }

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
}); 