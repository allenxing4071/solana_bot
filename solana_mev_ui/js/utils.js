/**
 * Solana MEV机器人 - 通用JavaScript工具函数
 */

// API基础URL
const API_BASE_URL = './mock_data';

/**
 * 格式化日期时间字符串
 * @param {string} dateStr - ISO日期字符串
 * @param {boolean} showTime - 是否显示时间
 * @returns {string} 格式化后的日期时间
 */
function formatDateTime(dateStr, showTime = true) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateFormatted = `${year}-${month}-${day}`;
  
  if (!showTime) return dateFormatted;
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${dateFormatted} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化数字，添加千位分隔符
 * @param {number} num - 需要格式化的数字
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的数字字符串
 */
function formatNumber(num, decimals = 2) {
  if (isNaN(num)) return '0';
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * 格式化货币
 * @param {number} num - 需要格式化的数字
 * @param {string} currency - 货币符号
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的货币字符串
 */
function formatCurrency(num, currency = '$', decimals = 2) {
  if (isNaN(num)) return `${currency}0`;
  return `${currency}${formatNumber(num, decimals)}`;
}

/**
 * 格式化代币地址，显示前几位和后几位
 * @param {string} address - 完整代币地址
 * @param {number} prefixLength - 前缀长度
 * @param {number} suffixLength - 后缀长度
 * @returns {string} 格式化后的地址
 */
function formatAddress(address, prefixLength = 6, suffixLength = 4) {
  if (!address || address.length <= prefixLength + suffixLength) return address;
  return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
}

/**
 * 根据百分比变化返回对应的CSS类名
 * @param {number} change - 百分比变化值
 * @returns {string} CSS类名
 */
function getChangeClass(change) {
  if (change > 0) return 'text-success';
  if (change < 0) return 'text-error';
  return 'text-secondary';
}

/**
 * 根据百分比变化返回对应的符号
 * @param {number} change - 百分比变化值
 * @returns {string} 变化符号
 */
function getChangeSymbol(change) {
  if (change > 0) return '↑';
  if (change < 0) return '↓';
  return '';
}

/**
 * 格式化百分比变化
 * @param {number} change - 百分比变化值
 * @param {boolean} showSymbol - 是否显示符号
 * @returns {string} 格式化后的百分比变化
 */
function formatChange(change, showSymbol = true) {
  const absChange = Math.abs(change);
  const symbol = showSymbol ? getChangeSymbol(change) : '';
  return `${symbol} ${absChange.toFixed(2)}%`;
}

/**
 * 从API获取数据
 * @param {string} endpoint - API端点
 * @returns {Promise<Object>} 返回API响应数据
 */
async function fetchData(endpoint) {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`获取数据错误：${error.message}`);
    showNotification('错误', `获取数据失败: ${error.message}`, 'error');
    return null;
  }
}

/**
 * 初始化系统状态
 * @returns {Promise<void>}
 */
async function initSystemStatus() {
  const data = await fetchData('system_status.json');
  if (!data || !data.success) return;
  
  const systemStatus = data.data;
  
  // 更新系统状态指示器
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');
  
  if (statusDot && statusText) {
    if (systemStatus.status === 'running【M】') {
      statusDot.className = 'status-dot running';
      statusText.textContent = '运行中';
      statusText.className = 'status-text text-success';
    } else {
      statusDot.className = 'status-dot stopped';
      statusText.textContent = '已停止';
      statusText.className = 'status-text text-error';
    }
  }
  
  // 更新运行时间
  const uptimeEl = document.querySelector('.uptime');
  if (uptimeEl) {
    uptimeEl.textContent = systemStatus.uptime;
  }
  
  // 更新CPU进度条
  const cpuBar = document.querySelector('.cpu-bar');
  const cpuUsage = document.querySelector('.cpu-usage');
  if (cpuBar && cpuUsage) {
    cpuBar.style.width = `${systemStatus.cpu.usage}%`;
    cpuUsage.textContent = `${systemStatus.cpu.usage.toFixed(1)}%`;
  }
  
  // 更新内存进度条
  const memoryBar = document.querySelector('.memory-bar');
  const memoryUsage = document.querySelector('.memory-usage');
  if (memoryBar && memoryUsage) {
    memoryBar.style.width = `${systemStatus.memory.usagePercent}%`;
    memoryUsage.textContent = `${systemStatus.memory.usagePercent.toFixed(1)}%`;
  }
  
  // 更新最后更新时间
  const lastUpdatedElements = document.querySelectorAll('.last-updated');
  lastUpdatedElements.forEach(el => {
    el.textContent = `最后更新: ${formatDateTime(systemStatus.lastUpdated)}`;
  });
}

/**
 * 显示通知消息
 * @param {string} title - 通知标题
 * @param {string} message - 通知内容
 * @param {string} type - 通知类型 (success, error, warning, info)
 * @param {number} duration - 显示时间(毫秒)
 */
function showNotification(title, message, type = 'info', duration = 3000) {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // 设置通知内容
  notification.innerHTML = `
    <div class="notification-header">
      <div class="notification-title">${title}</div>
      <button class="notification-close">&times;</button>
    </div>
    <div class="notification-body">${message}</div>
  `;
  
  // 获取或创建通知容器
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
  }
  
  // 添加通知到容器
  container.appendChild(notification);
  
  // 关闭按钮事件
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    notification.classList.add('notification-hide');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // 自动关闭
  setTimeout(() => {
    notification.classList.add('notification-hide');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
}

/**
 * 初始化图表
 * @param {string} elementId - 图表容器ID
 * @param {Object} options - 图表配置选项
 * @returns {Object} 图表实例
 */
function initChart(elementId, options) {
  const chartElement = document.getElementById(elementId);
  if (!chartElement) return null;
  
  // 使用Mock图表（实际项目中应替换为ECharts或其他图表库）
  return {
    element: chartElement,
    options: options,
    updateData: function(data) {
      console.log(`更新图表 ${elementId} 数据:`, data);
      // 实际项目中这里应该调用图表库的更新方法
    }
  };
}

/**
 * 初始化数据表格
 * @param {string} tableId - 表格ID
 * @param {Array} data - 表格数据
 * @param {Array} columns - 列配置
 * @param {Object} options - 表格选项
 */
function initTable(tableId, data, columns, options = {}) {
  const table = document.getElementById(tableId);
  if (!table) return;
  
  // 清空表格
  table.innerHTML = '';
  
  // 创建表头
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  columns.forEach(column => {
    const th = document.createElement('th');
    th.textContent = column.title;
    if (column.width) th.style.width = column.width;
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // 创建表体
  const tbody = document.createElement('tbody');
  
  data.forEach(item => {
    const row = document.createElement('tr');
    
    columns.forEach(column => {
      const td = document.createElement('td');
      
      if (column.render) {
        // 使用自定义渲染函数
        td.innerHTML = column.render(item[column.key], item);
      } else {
        // 直接使用数据
        td.textContent = item[column.key] || '';
      }
      
      if (column.align) td.style.textAlign = column.align;
      row.appendChild(td);
    });
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
}

/**
 * 初始化分页
 * @param {string} paginationId - 分页容器ID
 * @param {Object} pagination - 分页数据
 * @param {Function} onPageChange - 页码变化回调函数
 */
function initPagination(paginationId, pagination, onPageChange) {
  const paginationContainer = document.getElementById(paginationId);
  if (!paginationContainer) return;
  
  // 清空分页容器
  paginationContainer.innerHTML = '';
  
  // 上一页按钮
  const prevBtn = document.createElement('button');
  prevBtn.className = `page-btn ${pagination.currentPage === 1 ? 'disabled' : ''}`;
  prevBtn.innerHTML = '&lt;';
  prevBtn.disabled = pagination.currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (pagination.currentPage > 1) {
      onPageChange(pagination.currentPage - 1);
    }
  });
  paginationContainer.appendChild(prevBtn);
  
  // 页码信息
  const pageInfo = document.createElement('div');
  pageInfo.className = 'page-info';
  pageInfo.textContent = `第 ${pagination.currentPage} 页，共 ${pagination.totalPages} 页`;
  paginationContainer.appendChild(pageInfo);
  
  // 下一页按钮
  const nextBtn = document.createElement('button');
  nextBtn.className = `page-btn ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`;
  nextBtn.innerHTML = '&gt;';
  nextBtn.disabled = pagination.currentPage === pagination.totalPages;
  nextBtn.addEventListener('click', () => {
    if (pagination.currentPage < pagination.totalPages) {
      onPageChange(pagination.currentPage + 1);
    }
  });
  paginationContainer.appendChild(nextBtn);
}

/**
 * 切换模态框显示
 * @param {string} modalId - 模态框ID
 * @param {boolean} show - 是否显示
 */
function toggleModal(modalId, show) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  if (show) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  } else {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

/**
 * 初始化模态框
 * @param {string} modalId - 模态框ID
 */
function initModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  // 关闭按钮事件
  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      toggleModal(modalId, false);
    });
  }
  
  // 点击遮罩层关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      toggleModal(modalId, false);
    }
  });
}

/**
 * 全局初始化函数
 */
function initApp() {
  // 初始化系统状态
  initSystemStatus();
  
  // 初始化主题切换
  initThemeToggle();
  
  // 初始化移动端菜单
  initMobileMenu();
  
  // 初始化表格滚动效果
  initTableScroll();
  
  // 其他初始化
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      location.reload();
    });
  }
}

/**
 * 初始化移动端菜单
 */
function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
    
    // 点击主内容区域时关闭菜单
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') && !e.target.closest('.menu-toggle')) {
          sidebar.classList.remove('open');
        }
      });
    }
  }
}

/**
 * 初始化主题切换
 */
function initThemeToggle() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      
      const isDarkTheme = !document.body.classList.contains('light-theme');
      const icon = themeToggleBtn.querySelector('i');
      
      if (icon) {
        icon.className = isDarkTheme ? 'ri-moon-line' : 'ri-sun-line';
      }
    });
  }
}

/**
 * 初始化表格滚动效果
 */
function initTableScroll() {
  const tableContainers = document.querySelectorAll('.table-container');
  
  for (const container of tableContainers) {
    // 检查是否需要显示阴影
    checkScrollShadow(container);
    
    // 添加滚动监听
    container.addEventListener('scroll', function() {
      checkScrollShadow(this);
    });
  }
}

/**
 * 检查表格容器是否需要显示滚动阴影
 * @param {HTMLElement} container - 表格容器元素
 */
function checkScrollShadow(container) {
  if (container.scrollHeight > container.clientHeight) {
    container.classList.add('scrollable');
    
    // 如果滚动到底部，移除阴影
    if (container.scrollHeight - container.scrollTop <= container.clientHeight + 5) {
      container.classList.remove('scrollable');
    }
  } else {
    container.classList.remove('scrollable');
  }
}

// 当文档加载完成时初始化应用
document.addEventListener('DOMContentLoaded', initApp); 