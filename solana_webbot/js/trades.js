/**
 * Solana MEV机器人 - 交易记录页面JavaScript
 */

document.addEventListener('DOMContentLoaded', async function() {
  // 初始化变量
  let currentPage = 1;
  let allTrades = [];
  let filteredTrades = [];
  let itemsPerPage = 10;
  
  // 加载交易数据
  async function loadTradesData() {
    const data = await fetchData('recent_trades.json');
    if (!data || !data.success) return;
    
    const tradesData = data.data;
    
    // 更新统计数据
    document.getElementById('totalTradesCount').textContent = tradesData.stats.totalCount;
    document.getElementById('totalProfit').textContent = `$${formatNumber(tradesData.stats.totalProfit)}`;
    document.getElementById('successRate').textContent = `${tradesData.stats.successRate}%`;
    document.getElementById('avgExecutionTime').textContent = `${tradesData.stats.avgExecutionTime}ms`;
    
    // 存储所有交易数据
    allTrades = tradesData.trades;
    
    // 显示第一页数据
    filterAndDisplayTrades();
  }
  
  // 筛选并显示交易数据
  function filterAndDisplayTrades() {
    const searchQuery = document.getElementById('searchTradeInput').value.toLowerCase();
    const tradeTypeFilter = document.getElementById('tradeTypeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const dateRangeFilter = document.getElementById('dateRangeFilter').value;
    const profitFilter = document.getElementById('profitFilter').value;
    const sortBy = document.getElementById('sortTradesBy').value;
    
    // 筛选交易
    filteredTrades = allTrades.filter(trade => {
      const matchSearch = 
        trade.id.toLowerCase().includes(searchQuery) ||
        trade.hash.toLowerCase().includes(searchQuery) ||
        trade.tokenSymbol.toLowerCase().includes(searchQuery);
      
      let matchType = true;
      if (tradeTypeFilter !== 'all') {
        matchType = trade.type === tradeTypeFilter;
      }
      
      let matchStatus = true;
      if (statusFilter !== 'all') {
        matchStatus = trade.status === statusFilter;
      }
      
      let matchProfit = true;
      if (profitFilter !== 'all') {
        if (profitFilter === 'profit') {
          matchProfit = trade.profit > 0;
        } else if (profitFilter === 'loss') {
          matchProfit = trade.profit < 0;
        }
      }
      
      let matchDate = true;
      if (dateRangeFilter !== 'all') {
        const tradeDate = new Date(trade.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (dateRangeFilter === 'today') {
          matchDate = isSameDay(tradeDate, today);
        } else if (dateRangeFilter === 'yesterday') {
          matchDate = isSameDay(tradeDate, yesterday);
        } else if (dateRangeFilter === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchDate = tradeDate >= weekAgo;
        } else if (dateRangeFilter === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchDate = tradeDate >= monthAgo;
        }
      }
      
      return matchSearch && matchType && matchStatus && matchProfit && matchDate;
    });
    
    // 对交易排序
    filteredTrades.sort((a, b) => {
      const [field, direction] = sortBy.split('_');
      const multiplier = direction === 'desc' ? -1 : 1;
      
      if (field === 'date') {
        return (new Date(a.timestamp) - new Date(b.timestamp)) * multiplier;
      } else if (field === 'profit') {
        return (a.profit - b.profit) * multiplier;
      } else if (field === 'gas') {
        return (a.gasCost - b.gasCost) * multiplier;
      }
      
      return 0;
    });
    
    // 显示交易数据
    displayTrades(filteredTrades);
    
    // 更新分页
    updatePagination();
  }
  
  // 显示交易数据
  function displayTrades(trades) {
    const tableBody = document.getElementById('tradesTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // 计算分页
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, trades.length);
    const displayedTrades = trades.slice(startIndex, endIndex);
    
    if (displayedTrades.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="10" class="text-center">没有找到匹配的交易记录</td>';
      tableBody.appendChild(emptyRow);
      return;
    }
    
    // 添加交易行
    for (const trade of displayedTrades) {
      const row = document.createElement('tr');
      
      // 交易类型样式
      let typeClass = '';
      let typeName = '';
      if (trade.type === 'swap') {
        typeClass = 'trade-type-swap';
        typeName = '代币互换';
      } else if (trade.type === 'arbitrage') {
        typeClass = 'trade-type-arbitrage';
        typeName = '套利交易';
      } else if (trade.type === 'liquidation') {
        typeClass = 'trade-type-liquidation';
        typeName = '清算';
      } else if (trade.type === 'sandwich') {
        typeClass = 'trade-type-sandwich';
        typeName = '三明治攻击';
      }
      
      // 交易状态样式
      let statusClass = '';
      let statusName = '';
      if (trade.status === 'successful') {
        statusClass = 'status-success';
        statusName = '成功';
      } else if (trade.status === 'failed') {
        statusClass = 'status-failed';
        statusName = '失败';
      } else if (trade.status === 'pending') {
        statusClass = 'status-pending';
        statusName = '处理中';
      }
      
      // 盈利样式
      const profitClass = trade.profit >= 0 ? 'positive' : 'negative';
      const profitPrefix = trade.profit >= 0 ? '+' : '';
      
      // 价格变化样式
      const priceChangeClass = trade.priceChange >= 0 ? 'positive' : 'negative';
      const priceChangePrefix = trade.priceChange >= 0 ? '+' : '';
      
      row.innerHTML = `
        <td>
          <div>${formatDateTime(trade.timestamp)}</div>
        </td>
        <td><span class="badge ${typeClass}">${typeName}</span></td>
        <td>
          <div class="truncate-hash" title="${trade.hash}">${formatAddress(trade.hash)}</div>
        </td>
        <td>
          <div class="flex items-center">
            <span class="token-symbol">${trade.tokenSymbol}</span>
          </div>
        </td>
        <td>${formatNumber(trade.amount)}</td>
        <td><span class="price-change ${priceChangeClass}">${priceChangePrefix}${Math.abs(trade.priceChange).toFixed(2)}%</span></td>
        <td><span class="trade-profit ${profitClass}">${profitPrefix}$${formatNumber(Math.abs(trade.profit))}</span></td>
        <td>$${formatNumber(trade.gasCost)}</td>
        <td><span class="status-badge ${statusClass}">${statusName}</span></td>
        <td>
          <button class="btn btn-outline btn-sm btn-icon view-trade-details-btn" data-trade-id="${trade.id}" title="查看详情">
            <i class="ri-eye-line"></i>
          </button>
        </td>
      `;
      
      tableBody.appendChild(row);
    }
    
    // 添加事件监听器到详情按钮
    const detailButtons = document.querySelectorAll('.view-trade-details-btn');
    for (const button of detailButtons) {
      button.addEventListener('click', function() {
        const tradeId = this.getAttribute('data-trade-id');
        showTradeDetails(tradeId);
      });
    }
  }
  
  // 更新分页控件
  function updatePagination() {
    const paginationContainer = document.getElementById('tradesPagination');
    if (!paginationContainer) return;
    
    // 计算总页数
    const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
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
        displayTrades(filteredTrades);
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
        displayTrades(filteredTrades);
        updatePagination();
      }
    });
    paginationContainer.appendChild(nextBtn);
  }
  
  // 显示交易详情
  function showTradeDetails(tradeId) {
    const trade = allTrades.find(t => t.id === tradeId);
    if (!trade) return;
    
    const modalTitle = document.getElementById('modalTradeId');
    const modalContent = document.getElementById('tradeDetailContent');
    
    if (modalTitle && modalContent) {
      modalTitle.textContent = `交易 #${trade.id}`;
      
      // 交易类型映射
      const tradeTypeMap = {
        'swap': '代币互换',
        'arbitrage': '套利交易',
        'liquidation': '清算',
        'sandwich': '三明治攻击'
      };
      
      // 交易状态映射
      const statusMap = {
        'successful': '成功',
        'failed': '失败',
        'pending': '处理中'
      };
      
      // 交易类型样式
      let typeClass = '';
      if (trade.type === 'swap') {
        typeClass = 'trade-type-swap';
      } else if (trade.type === 'arbitrage') {
        typeClass = 'trade-type-arbitrage';
      } else if (trade.type === 'liquidation') {
        typeClass = 'trade-type-liquidation';
      } else if (trade.type === 'sandwich') {
        typeClass = 'trade-type-sandwich';
      }
      
      // 交易状态样式
      let statusClass = '';
      if (trade.status === 'successful') {
        statusClass = 'status-success';
      } else if (trade.status === 'failed') {
        statusClass = 'status-failed';
      } else if (trade.status === 'pending') {
        statusClass = 'status-pending';
      }
      
      // 盈利样式
      const profitClass = trade.profit >= 0 ? 'positive' : 'negative';
      const profitPrefix = trade.profit >= 0 ? '+' : '';
      
      modalContent.innerHTML = `
        <div class="mb-4">
          <div class="flex justify-between items-center mb-4">
            <div>
              <span class="badge ${typeClass}">${tradeTypeMap[trade.type]}</span>
              <span class="status-badge ${statusClass}">${statusMap[trade.status]}</span>
            </div>
            <div class="text-secondary text-sm">时间: ${formatDateTime(trade.timestamp, true)}</div>
          </div>
          
          <div class="card mb-4">
            <div class="card-header">
              <div class="card-title">基本信息</div>
            </div>
            <div class="p-4">
              <div class="mb-2">
                <div class="text-secondary text-sm">交易哈希</div>
                <div>${trade.hash}</div>
              </div>
              <div class="flex gap-4 mt-4">
                <div class="flex-1">
                  <div class="text-secondary text-sm">代币</div>
                  <div class="text-lg font-semibold">${trade.tokenSymbol}</div>
                </div>
                <div class="flex-1">
                  <div class="text-secondary text-sm">交易数量</div>
                  <div class="text-lg font-semibold">${formatNumber(trade.amount)}</div>
                </div>
                <div class="flex-1">
                  <div class="text-secondary text-sm">价格变化</div>
                  <div class="text-lg font-semibold ${trade.priceChange >= 0 ? 'text-success' : 'text-error'}">
                    ${trade.priceChange >= 0 ? '+' : ''}${trade.priceChange.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card mb-4">
            <div class="card-header">
              <div class="card-title">交易结果</div>
            </div>
            <div class="p-4">
              <div class="flex gap-4">
                <div class="flex-1">
                  <div class="text-secondary text-sm">盈利</div>
                  <div class="text-lg font-semibold ${profitClass}">
                    ${profitPrefix}$${formatNumber(Math.abs(trade.profit))}
                  </div>
                </div>
                <div class="flex-1">
                  <div class="text-secondary text-sm">Gas费用</div>
                  <div class="text-lg font-semibold">$${formatNumber(trade.gasCost)}</div>
                </div>
                <div class="flex-1">
                  <div class="text-secondary text-sm">执行时间</div>
                  <div class="text-lg font-semibold">${trade.executionTime}ms</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card mb-4">
            <div class="card-header">
              <div class="card-title">交易详情</div>
            </div>
            <div class="p-4">
              <div class="text-secondary text-sm mb-2">交易路径</div>
              <div class="trade-path">
                ${formatTradePath(trade)}
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <div class="card-title">日志</div>
            </div>
            <div class="p-4">
              <pre class="trade-logs">${trade.logs || '无日志记录'}</pre>
            </div>
          </div>
        </div>
      `;
      
      // 显示模态框
      toggleModal('tradeDetailModal', true);
    }
  }
  
  // 格式化交易路径
  function formatTradePath(trade) {
    if (!trade.path || !Array.isArray(trade.path) || trade.path.length === 0) {
      return '<div class="text-secondary">无交易路径数据</div>';
    }
    
    let pathHtml = '<div class="trade-path-container">';
    
    for (let i = 0; i < trade.path.length; i++) {
      const node = trade.path[i];
      
      pathHtml += `
        <div class="trade-path-node">
          <div class="path-node-icon">
            <i class="ri-exchange-fill"></i>
          </div>
          <div class="path-node-content">
            <div class="path-node-title">${node.platform || '未知平台'}</div>
            <div class="path-node-details">${node.action || '交易'}</div>
          </div>
        </div>
      `;
      
      // 添加连接线，最后一个节点不需要
      if (i < trade.path.length - 1) {
        pathHtml += '<div class="path-connector"></div>';
      }
    }
    
    pathHtml += '</div>';
    return pathHtml;
  }
  
  // 检查两个日期是否是同一天
  function isSameDay(date1, date2) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
  
  // 初始化事件监听
  function initEventListeners() {
    // 关闭模态框按钮
    const closeTradeModalBtn = document.getElementById('closeTradeModalBtn');
    const closeTradeDetailBtn = document.getElementById('closeTradeDetailBtn');
    if (closeTradeModalBtn && closeTradeDetailBtn) {
      closeTradeModalBtn.addEventListener('click', () => toggleModal('tradeDetailModal', false));
      closeTradeDetailBtn.addEventListener('click', () => toggleModal('tradeDetailModal', false));
    }
    
    // 刷新按钮
    const refreshTradesBtn = document.getElementById('refreshTradesBtn');
    if (refreshTradesBtn) {
      refreshTradesBtn.addEventListener('click', async function() {
        await loadTradesData();
        showNotification('成功', '交易数据已刷新', 'success');
      });
    }
    
    // 导出按钮
    const exportTradesBtn = document.getElementById('exportTradesBtn');
    if (exportTradesBtn) {
      exportTradesBtn.addEventListener('click', function() {
        showNotification('提示', '导出功能尚未实现', 'info');
      });
    }
    
    // 重放交易按钮
    const replayTradeBtn = document.getElementById('replayTradeBtn');
    if (replayTradeBtn) {
      replayTradeBtn.addEventListener('click', function() {
        showNotification('提示', '交易重放功能尚未实现', 'info');
        toggleModal('tradeDetailModal', false);
      });
    }
    
    // 搜索输入框
    const searchTradeInput = document.getElementById('searchTradeInput');
    if (searchTradeInput) {
      searchTradeInput.addEventListener('input', function() {
        currentPage = 1;
        filterAndDisplayTrades();
      });
    }
    
    // 交易类型筛选器
    const tradeTypeFilter = document.getElementById('tradeTypeFilter');
    if (tradeTypeFilter) {
      tradeTypeFilter.addEventListener('change', function() {
        currentPage = 1;
        filterAndDisplayTrades();
      });
    }
    
    // 状态筛选器
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', function() {
        currentPage = 1;
        filterAndDisplayTrades();
      });
    }
    
    // 日期范围筛选器
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    if (dateRangeFilter) {
      dateRangeFilter.addEventListener('change', function() {
        currentPage = 1;
        filterAndDisplayTrades();
      });
    }
    
    // 盈利筛选器
    const profitFilter = document.getElementById('profitFilter');
    if (profitFilter) {
      profitFilter.addEventListener('change', function() {
        currentPage = 1;
        filterAndDisplayTrades();
      });
    }
    
    // 排序选项
    const sortTradesBy = document.getElementById('sortTradesBy');
    if (sortTradesBy) {
      sortTradesBy.addEventListener('change', function() {
        filterAndDisplayTrades();
      });
    }
  }
  
  // 加载数据
  await loadTradesData();
  
  // 初始化事件监听
  initEventListeners();
}); 