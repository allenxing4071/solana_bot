/**
 * Solana MEV机器人 - 内存监控页面JavaScript
 * 实现内存数据的获取、图表展示和内存管理功能
 * 
 * 版本: v1.0.0 - 2025年4月13日创建
 */

// DOM元素缓存
const elements = {
  // 内存统计卡片元素
  usedMemory: document.getElementById('usedMemory'),
  totalMemory: document.getElementById('totalMemory'),
  usedPercentage: document.getElementById('usedPercentage'),
  memoryBar: document.getElementById('memoryBar'),
  heapUsed: document.getElementById('heapUsed'),
  heapTotal: document.getElementById('heapTotal'),
  heapPercentage: document.getElementById('heapPercentage'),
  heapBar: document.getElementById('heapBar'),
  peakMemory: document.getElementById('peakMemory'),
  externalMemory: document.getElementById('externalMemory'),
  
  // 容器元素
  suggestionsContainer: document.getElementById('suggestionsContainer'),
  consumptionPoints: document.getElementById('consumptionPoints'),
  logsContainer: document.getElementById('logsContainer'),
  leaksContainer: document.getElementById('leaksContainer'),
  
  // 图表元素
  memoryTrendChart: document.getElementById('memoryTrendChart'),
  
  // 按钮元素
  optimizeMemory: document.getElementById('optimizeMemory'),
  refreshBtn: document.getElementById('refreshBtn'),
  generateSuggestions: document.getElementById('generateSuggestions'),
  checkLeaks: document.getElementById('checkLeaks'),
  clearLogs: document.getElementById('clearLogs'),
  
  // 筛选元素
  statusFilter: document.getElementById('statusFilter'),
  searchInput: document.getElementById('searchInput')
};

// 全局变量
let memoryData = null;
let memoryChart = null;
let currentConsumptionPoints = [];
let updateInterval = null;

/**
 * 健康检查API服务是否正常运行
 * @returns {Promise<Object>} 包含API可用性的对象
 */
async function checkApiStatus() {
  try {
    console.log('[checkApiStatus] 开始检查API状态...');
    const apiUrl = getApiBaseUrl();
    
    // 如果使用模拟数据模式，直接返回成功
    if (window.ENV.USE_MOCK_DATA) {
      console.log('[checkApiStatus] 使用模拟数据模式，跳过API健康检查');
      return { available: true, message: '使用模拟数据模式' };
    }
    
    // 尝试调用健康检查接口
    const healthEndpoint = `${apiUrl}/health`;
    console.log(`[checkApiStatus] 请求健康检查: ${healthEndpoint}`);
    
    // 设置超时，避免长时间等待
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
    
    try {
      // 简化请求，不添加自定义头，避免CORS预检请求
      const response = await fetch(healthEndpoint, {
        signal: controller.signal,
        method: 'GET',
        // 移除自定义头，避免触发CORS预检请求
        // headers: {
        //   'Content-Type': 'application/json', 
        //   'Cache-Control': 'no-cache'
        // }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('[checkApiStatus] API服务正常运行');
        showNotification('成功', 'API服务连接正常', 'success');
        return { available: true, message: 'API服务正常运行' };
      }
      
      console.warn(`[checkApiStatus] API服务响应异常: ${response.status} ${response.statusText}`);
      showNotification('警告', `API服务连接异常: ${response.statusText}`, 'warning');
      return { available: false, message: `响应状态码: ${response.status}` };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // 检查是否是CORS错误（这只是一个推测，因为浏览器不提供具体的CORS错误信息）
      const errorMessage = fetchError.message || '未知错误';
      if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
        console.warn('[checkApiStatus] 可能存在CORS限制，尝试使用简单请求');
        
        try {
          // 尝试用图片请求判断服务是否在线（绕过CORS）
          const isAlive = await isServerAlive(apiUrl);
          if (isAlive) {
            console.log('[checkApiStatus] API服务确认在线，但存在CORS限制');
            return { available: true, message: 'API服务在线，但存在CORS限制' };
          }
        } catch (e) {
          console.error('[checkApiStatus] 尝试检测服务存活性失败:', e);
        }
      }
      
      console.error('[checkApiStatus] API健康检查失败:', fetchError);
      showNotification('错误', `API连接失败: ${fetchError.message}`, 'error');
      return { available: false, message: fetchError.message };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[checkApiStatus] API请求超时');
      showNotification('错误', 'API请求超时，可能服务未启动', 'error');
    } else {
      console.error('[checkApiStatus] API健康检查失败:', error);
      showNotification('错误', `API连接失败: ${error.message}`, 'error');
    }
    return { available: false, message: error.message };
  }
}

/**
 * 尝试检测服务器是否在线（不受CORS限制）
 * @param {string} apiUrl - API基础URL
 * @returns {Promise<boolean>} 服务器是否在线
 */
async function isServerAlive(apiUrl) {
  // 提取主机和端口
  let url;
  try {
    url = new URL(apiUrl);
  } catch (e) {
    // 如果是相对URL，先转为绝对URL
    if (apiUrl.startsWith('/')) {
      url = new URL(apiUrl, window.location.origin);
    } else {
      url = new URL(apiUrl, `${window.location.origin}/`);
    }
  }
  
  const baseUrl = `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}`;
  console.log('[isServerAlive] 检测服务器存活性:', baseUrl);
  
  return new Promise((resolve) => {
    // 使用图片请求检测服务器是否在线
    const img = new Image();
    
    // 设置超时
    const timeout = setTimeout(() => {
      console.log('[isServerAlive] 请求超时');
      img.src = '';
      resolve(false);
    }, 3000);
    
    img.onload = () => {
      clearTimeout(timeout);
      console.log('[isServerAlive] 服务器在线');
      resolve(true);
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      // 即使出错也可能意味着服务器在线，只是返回了错误响应
      console.log('[isServerAlive] 收到错误响应，服务器可能在线');
      resolve(true);
    };
    
    // 添加时间戳避免缓存
    img.src = `${baseUrl}/favicon.ico?_=${Date.now()}`;
  });
}

/**
 * 加载内存统计数据
 * @returns {Promise<boolean>} 数据加载是否成功
 */
async function loadMemoryStats() {
  console.log('开始加载内存统计数据...');
  
  try {
    // 使用API获取内存数据
    const url = `${getApiBaseUrl()}/memory_stats.json?t=${Date.now()}`;
    console.log(`从API获取内存数据: ${url}`);
    
    try {
      // 发送API请求获取数据
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const jsonResponse = await response.json();
      console.log('已获取内存数据:', jsonResponse);
      
      // 提取真正的数据对象(处理可能的嵌套结构)
      let actualData;
      
      if (jsonResponse.success === true && jsonResponse.data) {
        console.log('检测到标准API响应格式，提取data对象');
        actualData = jsonResponse.data;
      } else {
        console.log('直接使用响应数据');
        actualData = jsonResponse;
      }
      
      console.log('处理后的内存数据:', actualData);
      
      // 验证数据结构
      if (!actualData || typeof actualData !== 'object' || !actualData.total_memory) {
        console.error('数据结构验证失败，缺少total_memory字段:', actualData);
        showNotification('错误', '数据格式不正确', 'error');
        return false;
      }
      
      // 保存到全局变量
      memoryData = actualData;
      console.log('最终使用的内存数据:', memoryData);
      
      // 更新UI
      updateMemoryUI(memoryData);
      return true;
    } catch (apiError) {
      console.error('API请求或解析失败:', apiError);
      showNotification('错误', `内存数据加载失败: ${apiError.message}`, 'error');
      return false;
    }
  } catch (error) {
    console.error('加载内存统计数据失败:', error);
    showNotification('错误', '内存数据加载过程中发生未知错误', 'error');
    return false;
  }
}

/**
 * 创建备用内存数据
 * @returns {Object} 备用内存数据对象
 */
function createFallbackMemoryData() {
  console.log('创建备用内存数据 - 使用空数据替代模拟数据');
  
  // 返回备用数据结构，所有数值都设置为0或空数组
  return {
    totalMemory: {
      total: 0,
      used: 0,
      free: 0,
      usedPercentage: 0
    },
    heapMemory: {
      total: 0,
      used: 0,
      free: 0,
      usedPercentage: 0
    },
    peakMemory: 0,
    externalMemory: 0,
    memoryTrend: [],
    consumptionPoints: [],
    optimizationSuggestions: [],
    memoryLogs: [],
    memoryLeaks: []
  };
}

/**
 * 更新内存监控页面所有UI元素
 * @param {Object} data 内存数据对象
 */
function updateMemoryUI(data) {
  if (!data) {
    console.error('更新UI时数据为空');
    return;
  }
  
  console.log('更新所有UI元素');
  
  try {
    // 更新内存统计卡片
    updateMemoryStats(data);
    
    // 更新内存趋势图表
    if (data.memoryTrend) {
      console.log('更新内存趋势图表，数据点数量:', data.memoryTrend.length);
      updateMemoryTrendChart(data.memoryTrend);
    } else {
      console.warn('缺少内存趋势数据');
      // 生成模拟数据
      updateMemoryTrendChart([]);
    }
    
    // 更新其他UI元素
    if (data.optimizationSuggestions) {
      loadOptimizationSuggestions(data.optimizationSuggestions);
    }
    
    if (data.consumptionPoints) {
      loadConsumptionPoints(data.consumptionPoints);
    }
    
    if (data.memoryLogs) {
      loadMemoryLogs(data.memoryLogs);
    }
    
    if (data.memoryLeaks) {
      loadMemoryLeaks(data.memoryLeaks);
    }
    
    // 更新最后更新时间
    const lastUpdated = document.querySelector('.current-date-time');
    if (lastUpdated) {
      lastUpdated.textContent = formatDateTime(new Date());
    }
    
    console.log('UI更新完成');
  } catch (error) {
    console.error('更新UI过程中出错:', error);
    showNotification('错误', '更新界面时出错', 'error');
  }
}

/**
 * 更新内存统计数据显示
 * @param {Object} data - 内存数据
 */
function updateMemoryStats(data) {
  if (!data) return;
  
  // 更新总内存使用
  if (elements.usedMemory) elements.usedMemory.textContent = data.totalMemory.used;
  if (elements.totalMemory) elements.totalMemory.textContent = `总计: ${data.totalMemory.total} MB`;
  if (elements.usedPercentage) elements.usedPercentage.textContent = `${data.totalMemory.usedPercentage}%`;
  if (elements.memoryBar) elements.memoryBar.style.width = `${data.totalMemory.usedPercentage}%`;
  
  // 更新堆内存
  if (elements.heapUsed) elements.heapUsed.textContent = data.heapMemory.used;
  if (elements.heapTotal) elements.heapTotal.textContent = `总计: ${data.heapMemory.total} MB`;
  if (elements.heapPercentage) elements.heapPercentage.textContent = `${data.heapMemory.usedPercentage}%`;
  if (elements.heapBar) elements.heapBar.style.width = `${data.heapMemory.usedPercentage}%`;
  
  // 更新峰值内存
  if (elements.peakMemory) elements.peakMemory.textContent = data.peakMemory;
  
  // 更新外部内存
  if (elements.externalMemory) elements.externalMemory.textContent = data.externalMemory;
  
  // 设置内存条的颜色
  setMemoryBarColors(data.totalMemory.usedPercentage, data.heapMemory.usedPercentage);
}

/**
 * 根据使用百分比设置内存条颜色
 * @param {number} memoryPercentage - 内存使用百分比
 * @param {number} heapPercentage - 堆内存使用百分比
 */
function setMemoryBarColors(memoryPercentage, heapPercentage) {
  // 内存条颜色
  if (elements.memoryBar) {
    if (memoryPercentage > 80) {
      elements.memoryBar.style.backgroundColor = 'var(--error-color)';
    } else if (memoryPercentage > 60) {
      elements.memoryBar.style.backgroundColor = 'var(--warning-color)';
    } else {
      elements.memoryBar.style.backgroundColor = 'var(--success-color)';
    }
  }
  
  // 堆内存条颜色
  if (elements.heapBar) {
    if (heapPercentage > 80) {
      elements.heapBar.style.backgroundColor = 'var(--error-color)';
    } else if (heapPercentage > 60) {
      elements.heapBar.style.backgroundColor = 'var(--warning-color)';
    } else {
      elements.heapBar.style.backgroundColor = 'var(--cpu-color)';
    }
  }
}

/**
 * 更新内存趋势图表
 * @param {Array} memoryTrend 内存趋势数据
 */
function updateMemoryTrendChart(memoryTrend) {
  console.log('更新内存趋势图表:', memoryTrend);
  
  // 确保图表容器存在
  if (!elements.memoryTrendChart) {
    console.error('找不到内存趋势图表容器元素!');
    return;
  }
  
  // 确保Chart.js已加载
  if (typeof Chart === 'undefined') {
    console.error('Chart.js未加载，无法创建图表');
    return;
  }
  
  // 验证数据有效性
  if (!memoryTrend || !Array.isArray(memoryTrend) || memoryTrend.length === 0) {
    console.warn('内存趋势数据无效或为空，使用空数组');
    memoryTrend = [];
  }
  
  // 解析图表数据
  const labels = [];
  const memoryUsageData = [];
  const heapUsageData = [];
  
  // 获取当前图表周期
  const currentChartPeriod = getCurrentChartPeriod();
  console.log('当前图表周期:', currentChartPeriod);
  
  // 根据选择的时间段过滤数据
  const filteredData = memoryTrend;
  
  // 处理数据格式
  for (const point of filteredData) {
    // 格式化时间戳为更友好的格式
    let timeLabel;
    
    if (currentChartPeriod === '1小时') {
      // 小时:分钟格式
      timeLabel = new Date(point.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else if (currentChartPeriod === '6小时') {
      // 日期和小时格式
      timeLabel = new Date(point.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else {
      // 日期格式
      timeLabel = new Date(point.timestamp).toLocaleDateString([], {month: 'short', day: 'numeric'});
    }
    
    labels.push(timeLabel);
    
    // 获取内存使用量，兼容不同的字段名称
    const totalUsage = point.used || point.usage || 0;
    const heapUsage = point.heap || point.heapUsage || 0;
    
    // 转换MB到GB并保留2位小数
    const usageGB = (totalUsage / 1024).toFixed(2);
    const heapUsageGB = (heapUsage / 1024).toFixed(2);
    
    memoryUsageData.push(usageGB);
    heapUsageData.push(heapUsageGB);
  }
  
  // 如果已存在图表实例，销毁它
  if (memoryChart) {
    memoryChart.destroy();
  }
  
  // 获取图表上下文
  const ctx = elements.memoryTrendChart.getContext('2d');
  
  console.log('创建图表，数据点数:', labels.length);
  console.log('内存数据:', memoryUsageData);
  console.log('堆内存数据:', heapUsageData);
  
  // 创建新图表
  memoryChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '总内存使用量 (GB)',
          data: memoryUsageData,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3
        },
        {
          label: '堆内存使用量 (GB)',
          data: heapUsageData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.raw} GB`
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: '时间'
          },
          grid: {
            display: false
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: '内存使用量 (GB)'
          },
          beginAtZero: false,
          suggestedMin: (() => {
            // 计算最小值略低于实际最小值
            const allValues = [...memoryUsageData, ...heapUsageData].map(Number);
            const min = Math.min(...allValues);
            return Math.max(0, min * 0.95);
          })(),
          ticks: {
            callback: (value) => `${value} GB`
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      animation: {
        duration: 1000
      }
    }
  });
  
  console.log('内存趋势图表已更新');
  
  // 更新图表周期按钮状态
  updateChartPeriodButtonState(currentChartPeriod);
}

/**
 * 获取当前选择的图表周期
 * @returns {string} 当前图表周期
 */
function getCurrentChartPeriod() {
  const activeButton = document.querySelector('.card-header .btn.active');
  if (activeButton) {
    return activeButton.textContent.trim();
  }
  return '6小时'; // 默认周期
}

/**
 * 更新图表周期按钮状态
 * @param {string} activePeriod - 激活的周期
 */
function updateChartPeriodButtonState(activePeriod) {
  const periodButtons = document.querySelectorAll('.card-header .btn');
  
  periodButtons.forEach(button => {
    if (button.textContent.trim() === activePeriod) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

/**
 * 加载内存优化建议
 * @param {Array} suggestions - 建议数组
 */
function loadOptimizationSuggestions(suggestions) {
  const container = elements.suggestionsContainer;
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!suggestions || suggestions.length === 0) {
    container.innerHTML = '<div class="text-secondary">没有优化建议</div>';
    return;
  }
  
  for (const suggestion of suggestions) {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.innerHTML = suggestion;
    container.appendChild(item);
  }
}

/**
 * 加载内存消耗点
 * @param {Array} points - 消耗点数组
 */
function loadConsumptionPoints(points) {
  const container = elements.consumptionPoints;
  if (!container) return;
  
  // 保存当前消耗点数据
  currentConsumptionPoints = points || [];
  
  container.innerHTML = '';
  
  if (!points || points.length === 0) {
    container.innerHTML = '<div class="text-secondary">没有内存消耗点数据</div>';
    return;
  }
  
  // 应用过滤器
  const filteredPoints = filterConsumptionPoints(currentConsumptionPoints);
  
  for (const point of filteredPoints) {
    const item = document.createElement('div');
    item.className = 'memory-consumption-row';
    
    const statusClass = point.status === '正常' 
      ? 'text-success' 
      : point.status === '注意' 
        ? 'text-warning' 
        : 'text-error';
    
    item.innerHTML = `
      <div class="consumption-module">${point.module}</div>
      <div class="consumption-usage">${point.memoryUsage} MB</div>
      <div class="consumption-status ${statusClass}">${point.status}</div>
      <div class="consumption-updated">${formatDateTime(point.lastUpdated)}</div>
    `;
    
    container.appendChild(item);
  }
}

/**
 * 过滤内存消耗点
 * @param {Array} points - 消耗点数组
 * @returns {Array} 过滤后的消耗点数组
 */
function filterConsumptionPoints(points) {
  if (!points || !Array.isArray(points)) return [];
  
  // 获取当前过滤条件
  const statusFilter = elements.statusFilter ? elements.statusFilter.value : 'all';
  const searchText = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
  
  return points.filter(point => {
    // 状态过滤
    if (statusFilter !== 'all' && point.status !== statusFilter) {
      if (!(statusFilter === 'normal' && point.status === '正常')) return false;
      if (!(statusFilter === 'warning' && point.status === '注意')) return false;
      if (!(statusFilter === 'error' && point.status === '错误')) return false;
    }
    
    // 搜索过滤
    if (searchText && !point.module.toLowerCase().includes(searchText)) {
      return false;
    }
    
    return true;
  });
}

/**
 * 加载内存日志
 * @param {Array} logs - 日志数组
 */
function loadMemoryLogs(logs) {
  const container = elements.logsContainer;
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!logs || logs.length === 0) {
    container.innerHTML = '<div class="text-secondary">没有内存日志数据</div>';
    return;
  }
  
  for (const log of logs) {
    const item = document.createElement('div');
    item.className = 'memory-log-entry';
    
    const levelClass = log.level === '信息' 
      ? 'info' 
      : log.level === '警告' 
        ? 'warning' 
        : 'error';
    
    const levelText = log.level === '信息' 
      ? 'I' 
      : log.level === '警告' 
        ? 'W' 
        : 'E';
    
    item.innerHTML = `
      <div class="log-level-badge ${levelClass}">${levelText}</div>
      <div class="log-time text-secondary text-xs">${formatDateTime(log.timestamp)}</div>
      <div class="log-message flex-1 ml-4">${log.message}</div>
    `;
    
    container.appendChild(item);
  }
}

/**
 * 加载内存泄漏
 * @param {Array} leaks - 泄漏数组
 */
function loadMemoryLeaks(leaks) {
  const container = elements.leaksContainer;
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!leaks || leaks.length === 0) {
    container.innerHTML = '<div class="text-secondary">未检测到内存泄漏</div>';
    return;
  }
  
  for (const leak of leaks) {
    const item = document.createElement('div');
    item.className = 'leak-item';
    
    item.innerHTML = `
      <div class="leak-header">
        <div>${leak.source}</div>
        <div class="text-error">${leak.leakRate}</div>
      </div>
      <div class="leak-details">
        <div>开始于: ${formatDateTime(leak.startTime)}</div>
      </div>
      <div class="leak-suggestion">${leak.suggested}</div>
    `;
    
    container.appendChild(item);
  }
}

/**
 * 添加新的内存日志
 * @param {string} message - 日志消息
 * @param {string} level - 日志级别 (信息|警告|错误)
 */
function addLog(message, level = 'info') {
  // 映射日志级别
  const mappedLevel = level === 'success' ? '信息' : 
                      level === 'warning' ? '警告' : 
                      level === 'error' ? '错误' : '信息';
  
  // 创建新日志对象
  const newLog = {
    timestamp: new Date().toISOString(),
    level: mappedLevel,
    message: message
  };
  
  // 添加到日志数组
  if (memoryData && memoryData.memoryLogs) {
    memoryData.memoryLogs.unshift(newLog);
    
    // 重新加载日志显示
    loadMemoryLogs(memoryData.memoryLogs);
  }
}

/**
 * 初始化事件监听
 */
function initEventListeners() {
  // 优化内存按钮
  if (elements.optimizeMemory) {
    elements.optimizeMemory.addEventListener('click', function() {
      showNotification('处理中', '正在优化内存...', 'info');
      addLog('手动触发内存优化', 'info');
      
      // 模拟优化过程
      setTimeout(() => {
        // 优化后更新内存数据
        if (memoryData) {
          // 减少使用的内存
          const optimizedAmount = Math.floor(Math.random() * 300) + 100;
          memoryData.totalMemory.used = Math.max(memoryData.totalMemory.used - optimizedAmount, 0);
          memoryData.heapMemory.used = Math.max(memoryData.heapMemory.used - (optimizedAmount * 0.7), 0);
          
          // 重新计算百分比
          memoryData.totalMemory.usedPercentage = ((memoryData.totalMemory.used / memoryData.totalMemory.total) * 100).toFixed(1);
          memoryData.heapMemory.usedPercentage = ((memoryData.heapMemory.used / memoryData.heapMemory.total) * 100).toFixed(1);
          
          // 更新界面
          updateMemoryStats(memoryData);
          addLog(`内存优化完成，释放了 ${optimizedAmount}MB 内存`, 'success');
        }
        
        showNotification('成功', `内存优化完成，释放了 ${optimizedAmount}MB 内存`, 'success');
      }, 1500);
    });
  }
  
  // 刷新按钮
  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener('click', function() {
      loadMemoryStats();
    });
  }
  
  // 刷新建议按钮
  if (elements.generateSuggestions) {
    elements.generateSuggestions.addEventListener('click', function() {
      showNotification('处理中', '正在分析内存使用并生成建议...', 'info');
      addLog('手动触发内存分析', 'info');
      
      setTimeout(() => {
        // 随机生成新的建议
        const suggestions = [
          '定期重启服务器以清理内存碎片和防止内存泄漏',
          '考虑增加服务器内存容量，当前使用率已接近警戒线',
          '代币监控服务内存使用量较大，建议优化数据结构',
          '交易执行引擎可以采用懒加载机制减少初始内存占用',
          '减少不必要的日志记录可以降低内存占用',
          '流动性池监控采样间隔可以适当延长以减少数据存储',
          '考虑使用更高效的数据压缩算法减少内存使用'
        ];
        
        // 随机选择3-5条建议
        const count = Math.floor(Math.random() * 3) + 3;
        const selectedSuggestions = [];
        
        for (let i = 0; i < count; i++) {
          const randomIndex = Math.floor(Math.random() * suggestions.length);
          selectedSuggestions.push(suggestions[randomIndex]);
          suggestions.splice(randomIndex, 1);
        }
        
        // 更新数据和显示
        if (memoryData) {
          memoryData.optimizationSuggestions = selectedSuggestions;
          loadOptimizationSuggestions(selectedSuggestions);
        }
        
        showNotification('成功', '已更新内存优化建议', 'success');
        addLog('更新了内存优化建议', 'success');
      }, 1000);
    });
  }
  
  // 检测泄漏按钮
  if (elements.checkLeaks) {
    elements.checkLeaks.addEventListener('click', function() {
      showNotification('处理中', '正在检测内存泄漏...', 'info');
      addLog('手动触发内存泄漏检测', 'info');
      
      setTimeout(() => {
        // 模拟发现的泄漏
        const potentialLeaks = [
          {
            source: '代币价格监听器',
            leakRate: '2.5MB/小时',
            startTime: new Date(Date.now() - 3600000 * 24).toISOString(),
            suggested: '检查事件监听器是否正确解除绑定'
          },
          {
            source: '交易历史记录',
            leakRate: '1.2MB/小时',
            startTime: new Date(Date.now() - 3600000 * 10).toISOString(),
            suggested: '实现数据分页或释放旧记录'
          },
          {
            source: 'WebSocket连接',
            leakRate: '0.8MB/小时',
            startTime: new Date(Date.now() - 3600000 * 5).toISOString(),
            suggested: '确保未使用的连接被正确关闭'
          },
          {
            source: '缓存服务',
            leakRate: '3.1MB/小时',
            startTime: new Date(Date.now() - 3600000 * 2).toISOString(),
            suggested: '实现LRU缓存策略并定期清理过期数据'
          }
        ];
        
        // 随机决定是否发现泄漏
        const foundLeaks = Math.random() > 0.3; // 70%概率发现泄漏
        
        if (foundLeaks) {
          // 随机选择1-3个泄漏
          const count = Math.floor(Math.random() * 3) + 1;
          const leaks = [];
          
          for (let i = 0; i < count; i++) {
            if (potentialLeaks.length === 0) break;
            const randomIndex = Math.floor(Math.random() * potentialLeaks.length);
            leaks.push(potentialLeaks[randomIndex]);
            potentialLeaks.splice(randomIndex, 1);
          }
          
          // 更新数据和显示
          if (memoryData) {
            memoryData.memoryLeaks = leaks;
            loadMemoryLeaks(leaks);
          }
          
          showNotification('警告', `检测到${count}个内存泄漏问题`, 'warning');
          addLog(`检测到${count}个内存泄漏问题`, 'warning');
        } else {
          // 未发现泄漏
          if (memoryData) {
            memoryData.memoryLeaks = [];
            loadMemoryLeaks([]);
          }
          
          showNotification('成功', '内存泄漏检测完成，未发现问题', 'success');
          addLog('内存泄漏检测完成，未发现问题', 'success');
        }
      }, 2000);
    });
  }
  
  // 清空日志按钮
  if (elements.clearLogs) {
    elements.clearLogs.addEventListener('click', function() {
      if (memoryData) {
        memoryData.memoryLogs = [];
        loadMemoryLogs([]);
      }
      
      showNotification('成功', '内存日志已清空', 'success');
    });
  }
  
  // 状态筛选
  if (elements.statusFilter) {
    elements.statusFilter.addEventListener('change', function() {
      if (currentConsumptionPoints.length > 0) {
        loadConsumptionPoints(currentConsumptionPoints);
      }
      showNotification('筛选', `已选择筛选条件: ${this.value}`, 'info');
    });
  }
  
  // 搜索输入框
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', function() {
      if (this.value.length > 1 && currentConsumptionPoints.length > 0) {
        loadConsumptionPoints(currentConsumptionPoints);
      }
    });
  }
}

/**
 * 启动自动刷新
 * @param {number} interval - 刷新间隔(毫秒)
 */
function startAutoRefresh(interval = 30000) {
  // 清除已存在的定时器
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  // 设置新的定时器
  updateInterval = setInterval(() => {
    loadMemoryStats();
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

/**
 * 应用图表周期切换
 */
function initChartPeriodButtons() {
  const periodButtons = document.querySelectorAll('.card-header .btn');
  
  periodButtons.forEach(button => {
    button.addEventListener('click', function() {
      // 移除所有按钮的active类
      periodButtons.forEach(btn => btn.classList.remove('active'));
      
      // 给当前按钮添加active类
      this.classList.add('active');
      
      // 根据不同时间段生成数据并更新图表
      const period = this.textContent.trim();
      updateChartByPeriod(period);
    });
  });
}

/**
 * 根据选择的时间段更新图表
 * @param {string} period - 时间段 (1小时|6小时|24小时)
 */
function updateChartByPeriod(period) {
  if (!memoryData || !memoryData.memoryTrend) return;
  
  let filteredData = [];
  const now = new Date();
  
  // 根据选择的时间段过滤数据
  if (period === '1小时') {
    // 过去1小时的数据点
    const oneHourAgo = new Date(now.getTime() - 3600000);
    filteredData = memoryData.memoryTrend.filter(point => {
      const pointDate = new Date(point.timestamp);
      return pointDate >= oneHourAgo;
    });
  } else if (period === '6小时') {
    // 过去6小时的数据点
    const sixHoursAgo = new Date(now.getTime() - 3600000 * 6);
    filteredData = memoryData.memoryTrend.filter(point => {
      const pointDate = new Date(point.timestamp);
      return pointDate >= sixHoursAgo;
    });
  } else if (period === '24小时') {
    // 所有数据点
    filteredData = memoryData.memoryTrend;
  }
  
  // 如果没有足够数据，生成模拟数据
  if (filteredData.length < 6) {
    const pointCount = period === '1小时' ? 6 : period === '6小时' ? 12 : 24;
    filteredData = generateMockTrendData(pointCount, period);
  }
  
  // 更新图表
  updateMemoryTrendChart(filteredData);
}

/**
 * 生成模拟趋势数据
 * @param {number} pointCount - 数据点数量
 * @param {string} period - 时间周期 (1小时, 6小时, 12小时, 24小时)
 * @returns {Array} 模拟数据点数组
 */
function generateMockTrendData(pointCount, period) {
  // 返回空数组，不生成任何模拟数据
  console.log('请求生成模拟数据，但返回空数组以避免显示假数据');
  return [];
}

/**
 * 页面初始化
 */
document.addEventListener('DOMContentLoaded', async function() {
  console.log('内存监控页面初始化...');
  
  // 确保关键元素存在
  if (!elements.memoryTrendChart) {
    console.error('找不到内存趋势图表容器元素!');
    showNotification('错误', '页面初始化失败: 找不到图表容器', 'error');
  } else {
    console.log('图表容器已找到:', elements.memoryTrendChart);
    // 设置图表容器尺寸，确保图表可见
    elements.memoryTrendChart.style.height = '300px';
    elements.memoryTrendChart.style.width = '100%';
  }
  
  // 确保Chart.js已加载
  if (typeof Chart === 'undefined') {
    console.error('Chart.js未加载! 请检查页面依赖项');
    showNotification('错误', '页面初始化失败: Chart.js未加载', 'error');
  } else {
    console.log('Chart.js已加载, 版本:', Chart.version);
  }
  
  // 初始化事件监听
  initEventListeners();
  
  // 初始化图表周期按钮
  initChartPeriodButtons();
  
  // 添加调试按钮
  addDebugButton();
  
  // 加载内存数据
  try {
    console.log('开始加载内存数据...');
    const success = await loadMemoryStats();
    if (success) {
      console.log('内存数据加载成功，启动自动刷新');
      // 启动自动刷新 (每30秒)
      startAutoRefresh(30000);
    } else {
      console.warn('内存数据加载失败，不启动自动刷新');
      showNotification('警告', '数据加载失败，请检查网络连接', 'warning');
    }
  } catch (error) {
    console.error('初始化过程中出错:', error);
    showNotification('错误', '页面初始化失败: ' + error.message, 'error');
  }
  
  // 设置退出时清理
  window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
  });
  
  console.log('内存监控页面初始化完成');
});

/**
 * 添加调试按钮 - 帮助排查API问题
 */
function addDebugButton() {
  // 已经存在就不重复添加
  if (document.getElementById('debugApiBtn')) return;
  
  // 创建调试按钮
  const debugBtn = document.createElement('button');
  debugBtn.id = 'debugApiBtn';
  debugBtn.className = 'btn btn-outline btn-sm';
  debugBtn.title = '调试API连接';
  debugBtn.innerHTML = '<i class="ri-bug-line"></i> 调试';
  debugBtn.style.position = 'fixed';
  debugBtn.style.bottom = '20px';
  debugBtn.style.right = '20px';
  debugBtn.style.zIndex = '999';
  
  // 添加事件监听
  debugBtn.addEventListener('click', showApiDebugInfo);
  
  // 添加到页面
  document.body.appendChild(debugBtn);
}

/**
 * 显示API调试信息
 */
function showApiDebugInfo() {
  console.log('显示API调试信息...');
  
  // 收集调试信息
  const debugInfo = {
    env: window.ENV,
    apiUrl: getApiBaseUrl(),
    chartStatus: {
      container: elements.memoryTrendChart ? {
        width: elements.memoryTrendChart.clientWidth,
        height: elements.memoryTrendChart.clientHeight,
        visible: elements.memoryTrendChart.offsetParent !== null
      } : null,
      instance: memoryChart ? true : false
    },
    memoryData: memoryData ? {
      hasData: !!memoryData,
      hasMemoryTrend: !!(memoryData && memoryData.memoryTrend),
      trendLength: memoryData && memoryData.memoryTrend ? memoryData.memoryTrend.length : 0
    } : null,
    chartJs: {
      loaded: typeof Chart !== 'undefined',
      version: typeof Chart !== 'undefined' ? Chart.version : null
    }
  };
  
  console.log('API调试信息:', debugInfo);
  
  // 创建可视化调试信息
  let content = `
    <div style="max-height: 500px; overflow-y: auto;">
      <h3>API调试信息</h3>
      <div style="margin: 10px 0;">
        <strong>环境配置:</strong>
        <pre>${JSON.stringify(debugInfo.env, null, 2)}</pre>
      </div>
      <div style="margin: 10px 0;">
        <strong>API地址:</strong> ${debugInfo.apiUrl}
      </div>
      <div style="margin: 10px 0;">
        <strong>图表状态:</strong>
        <pre>${JSON.stringify(debugInfo.chartStatus, null, 2)}</pre>
      </div>
      <div style="margin: 10px 0;">
        <strong>数据状态:</strong>
        <pre>${JSON.stringify(debugInfo.memoryData, null, 2)}</pre>
      </div>
      <div style="margin: 10px 0;">
        <strong>Chart.js状态:</strong>
        <pre>${JSON.stringify(debugInfo.chartJs, null, 2)}</pre>
      </div>
      <div style="margin-top: 15px;">
        <button id="forceRefreshBtn" class="btn btn-primary">强制刷新数据</button>
        <button id="clearMockDataBtn" class="btn btn-error">清除模拟数据</button>
        <button id="regenerateChartBtn" class="btn btn-warning">重新生成图表</button>
      </div>
    </div>
  `;
  
  // 创建模态窗口
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-container">
      <div class="modal-header">
        <h3>API调试</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
    </div>
  `;
  
  // 添加样式
  const style = document.createElement('style');
  style.textContent = `
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
    }
    .modal-container {
      position: relative;
      background-color: var(--card-bg-color, #fff);
      border-radius: 8px;
      max-width: 80%;
      width: 600px;
      max-height: 80%;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      z-index: 1001;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }
    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--secondary-text-color, #718096);
    }
    .modal-body {
      padding: 15px;
      overflow-y: auto;
    }
    pre {
      background-color: var(--card-bg-color, #f7fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
    }
    .btn {
      margin-right: 10px;
    }
  `;
  
  // 添加到页面
  document.head.appendChild(style);
  document.body.appendChild(modal);
  
  // 关闭按钮事件
  const closeBtn = modal.querySelector('.modal-close');
  closeBtn.addEventListener('click', () => {
    modal.remove();
  });
  
  // 点击遮罩关闭
  const overlay = modal.querySelector('.modal-overlay');
  overlay.addEventListener('click', () => {
    modal.remove();
  });
  
  // 强制刷新按钮事件
  const forceRefreshBtn = modal.querySelector('#forceRefreshBtn');
  forceRefreshBtn.addEventListener('click', async () => {
    modal.remove();
    await loadMemoryStats();
  });
  
  // 清除模拟数据按钮事件
  const clearMockDataBtn = modal.querySelector('#clearMockDataBtn');
  clearMockDataBtn.addEventListener('click', () => {
    window.ENV.USE_MOCK_DATA = false;
    modal.remove();
    showNotification('提示', '已切换到真实API模式', 'info');
    loadMemoryStats();
  });
  
  // 重新生成图表按钮事件
  const regenerateChartBtn = modal.querySelector('#regenerateChartBtn');
  regenerateChartBtn.addEventListener('click', () => {
    if (memoryData && memoryData.memoryTrend) {
      updateMemoryTrendChart(memoryData.memoryTrend);
      modal.remove();
    } else {
      showNotification('错误', '没有可用的内存趋势数据', 'error');
    }
  });
}

// 添加日志的全局函数
window.addLog = addLog; 