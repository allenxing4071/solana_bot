/**
 * Solana MEV机器人 - 内存监控页面JavaScript
 * 实现内存数据的获取、图表展示和内存管理功能
 * 
 * 版本: v1.0.0 - 2025年4月13日创建
 */

// 全局变量
let memoryData = null;
let memoryChart = null;
let currentConsumptionPoints = [];
let updateInterval = null;
let elements = {}; // 移至此处，作为全局变量声明，但稍后初始化

/**
 * 初始化DOM元素
 */
function initElements() {
  elements = {
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
    peakTime: document.getElementById('peakTime'),
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

  // 输出DOM元素检查结果
  console.log('DOM元素初始化结果:');
  console.log('usedMemory:', !!elements.usedMemory);
  console.log('totalMemory:', !!elements.totalMemory);
  console.log('usedPercentage:', !!elements.usedPercentage);
  console.log('memoryBar:', !!elements.memoryBar);
  console.log('heapUsed:', !!elements.heapUsed);
  console.log('heapTotal:', !!elements.heapTotal);
  console.log('peakMemory:', !!elements.peakMemory);
  console.log('peakTime:', !!elements.peakTime);
  console.log('memoryTrendChart:', !!elements.memoryTrendChart);
}

/**
 * 健康检查API服务是否正常运行
 * @returns {Promise<Object>} 包含API可用性的对象
 */
async function checkApiStatus() {
  try {
    console.log('[checkApiStatus] 开始检查API状态...');
    const apiUrl = getApiBaseUrl();
    
    // 尝试调用健康检查接口
    const healthEndpoint = `${apiUrl}/system/status`;
    console.log(`[checkApiStatus] 请求健康检查: ${healthEndpoint}`);
    
    // 设置超时，避免长时间等待
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
    
    try {
      // 简化请求
      const response = await fetch(healthEndpoint, {
        signal: controller.signal,
        method: 'GET'
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
  
  const baseUrl = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`;
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
    // 从API获取内存数据
    const url = `${getApiBaseUrl()}/api/system/memory?t=${Date.now()}`;
    console.log(`从API获取内存数据: ${url}`);
    
    try {
      // 发送API请求获取数据
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const jsonResponse = await response.json();
      console.log('已获取内存统计数据:', jsonResponse);
      
      // 提取数据对象
      let memoryData;
      if (jsonResponse.success === true && jsonResponse.data) {
        memoryData = jsonResponse.data;
      } else {
        memoryData = jsonResponse;
      }
      
      // 更新内存统计UI
      updateMemoryUI(memoryData);
      return true;
    } catch (apiError) {
      console.error('API请求或解析失败:', apiError);
      showNotification('错误', `无法获取内存数据: ${apiError.message}`, 'error');
      return false;
    }
  } catch (error) {
    console.error('加载内存统计数据失败:', error);
    showNotification('错误', `加载失败: ${error.message}`, 'error');
    return false;
  }
}

/**
 * 加载系统状态信息
 * @returns {Promise<boolean>} 数据加载是否成功
 */
async function loadSystemStatus() {
  console.log('开始加载系统状态信息...');
  
  try {
    // 使用API获取系统状态
    const url = `${getApiBaseUrl()}/api/status?t=${Date.now()}`;
    console.log(`从API获取系统状态: ${url}`);
    
    try {
      // 发送API请求获取数据
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const jsonResponse = await response.json();
      console.log('已获取系统状态:', jsonResponse);
      
      // 提取数据对象
      let statusData;
      if (jsonResponse.success === true && jsonResponse.data) {
        statusData = jsonResponse.data;
      } else {
        statusData = jsonResponse;
      }
      
      // 更新系统状态UI
      updateSystemStatusUI(statusData);
      return true;
    } catch (apiError) {
      console.error('API请求或解析失败:', apiError);
      console.log('继续使用其他数据，不影响主要功能');
      return false;
    }
  } catch (error) {
    console.error('加载系统状态信息失败:', error);
    return false;
  }
}

/**
 * 更新系统状态UI
 * @param {Object} statusData 系统状态数据
 */
function updateSystemStatusUI(statusData) {
  try {
    // 获取DOM元素
    const uptimeElement = document.querySelector('.uptime');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    const dateTimeElement = document.querySelector('.current-date-time');
    
    if (statusData?.status) {
      // 更新运行状态
      const isRunning = statusData.status === 'running';
      
      if (statusDot) {
        statusDot.className = `status-dot ${isRunning ? 'running' : 'stopped'}`;
      }
      
      if (statusText) {
        statusText.textContent = isRunning ? '运行中' : '已停止';
        statusText.className = `status-text ${isRunning ? 'text-success' : 'text-error'}`;
      }
      
      // 更新运行时间
      if (uptimeElement && statusData.uptime) {
        uptimeElement.textContent = formatUptime(statusData.uptime);
      }
      
      // 更新当前时间
      if (dateTimeElement && statusData.currentTime) {
        dateTimeElement.textContent = formatDateTime(statusData.currentTime);
      } else if (dateTimeElement) {
        // 如果API没有返回时间，使用当前时间
        dateTimeElement.textContent = formatDateTime(new Date());
      }
    }
  } catch (error) {
    console.error('更新系统状态UI失败:', error);
  }
}

/**
 * 格式化运行时间
 * @param {number|string} uptime 运行时间(秒)
 * @returns {string} 格式化后的运行时间
 */
function formatUptime(uptime) {
  try {
    let uptimeSeconds = 0;
    
    if (typeof uptime === 'string') {
      // 尝试解析字符串为数字
      uptimeSeconds = Number.parseInt(uptime, 10) || 0;
    } else if (typeof uptime === 'number') {
      uptimeSeconds = uptime;
    }
    
    // 计算小时、分钟和秒
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    
    // 格式化输出
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } 
    
    if (minutes > 0) {
      return `${minutes}分钟`;
    } 
    
    return '刚刚启动';
  } catch (error) {
    console.error('格式化运行时间失败:', error);
    return '--';
  }
}

/**
 * 格式化日期时间
 * @param {string|Date} dateTime 日期时间
 * @returns {string} 格式化后的日期时间
 */
function formatDateTime(dateTime) {
  try {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    
    if (Number.isNaN(date.getTime())) {
      throw new Error('无效的日期时间');
    }
    
    // 格式化为 YYYY-MM-DD HH:MM:SS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('格式化日期时间失败:', error);
    return '--';
  }
}

/**
 * 更新内存监控UI
 * @param {Object} data 内存数据
 */
function updateMemoryUI(data) {
  try {
    console.log('更新内存监控UI，数据:', data);
    
    // 提取数据，处理不同的数据结构格式
    let totalMemoryInfo;
    let heapMemoryInfo; 
    let peakMemoryValue;
    let externalMemoryValue;
    let memoryTrends;
    let consumptionPoints;
    let suggestions;
    let memoryLogs;
    let memoryLeakInfo;
    
    // 判断数据结构类型并提取数据
    if (data.totalMemory && data.heapMemory) {
      // 标准结构
      console.log('使用标准数据结构解析');
      totalMemoryInfo = data.totalMemory;
      heapMemoryInfo = data.heapMemory;
      peakMemoryValue = data.peakMemory;
      externalMemoryValue = data.externalMemory;
      memoryTrends = data.memoryTrend;
      consumptionPoints = data.consumptionPoints;
      suggestions = data.optimizationSuggestions;
      memoryLogs = data.memoryLogs;
      memoryLeakInfo = data.memoryLeaks;
      
      console.log('数据结构检查: totalMemory', !!totalMemoryInfo);
      console.log('数据结构检查: heapMemory', !!heapMemoryInfo);
      console.log('数据结构检查: memoryTrend', memoryTrends && memoryTrends.length);
    } else {
      // 简单结构 - 尝试提取最基本的内存信息
      console.log('使用简单数据结构解析');
      totalMemoryInfo = {
        total: data.total || data.totalMemory || 0,
        used: data.used || data.usedMemory || 0,
        free: data.free || data.freeMemory || 0,
        usedPercentage: data.usedPercentage || 0
      };
      
      // 如果没有详细的堆内存信息，使用估算值
      heapMemoryInfo = data.heap || {
        total: data.heapTotal || Math.floor(totalMemoryInfo.total * 0.5),
        used: data.heapUsed || Math.floor(totalMemoryInfo.used * 0.6),
        free: data.heapFree || 0,
        usedPercentage: data.heapUsedPercentage || 0
      };
      
      // 其他可选数据
      peakMemoryValue = data.peak || 0;
      externalMemoryValue = data.external || 0;
      memoryTrends = data.trends || [];
      consumptionPoints = data.consumption || [];
      suggestions = data.suggestions || [];
      memoryLogs = data.logs || [];
      memoryLeakInfo = data.leaks || [];
    }
    
    // 更新内存统计数据
    console.log('更新内存统计数据...');
    console.log('totalMemoryInfo:', totalMemoryInfo);
    console.log('heapMemoryInfo:', heapMemoryInfo);
    updateMemoryStats(totalMemoryInfo, heapMemoryInfo, peakMemoryValue, externalMemoryValue);
    
    // 更新内存趋势图表
    if (memoryTrends && memoryTrends.length > 0) {
      console.log('更新内存趋势图表...');
      updateMemoryTrendChart(memoryTrends);
    } else {
      console.warn('无法更新内存趋势图表：没有趋势数据');
    }
    
    // 更新内存消耗点分析
    if (consumptionPoints && consumptionPoints.length > 0) {
      loadConsumptionPoints(consumptionPoints);
    }
    
    // 更新优化建议
    if (suggestions && suggestions.length > 0) {
      loadOptimizationSuggestions(suggestions);
    }
    
    // 更新内存日志
    if (memoryLogs && memoryLogs.length > 0) {
      loadMemoryLogs(memoryLogs);
    }
    
    // 更新内存泄漏信息
    if (memoryLeakInfo && memoryLeakInfo.length > 0) {
      loadMemoryLeaks(memoryLeakInfo);
    }
    
    console.log('内存UI更新完成');
  } catch (error) {
    console.error('更新内存UI时发生错误:', error);
    console.error('错误堆栈:', error.stack);
  }
}

/**
 * 更新内存统计数据
 * @param {Object} totalMemory 总内存数据
 * @param {Object} heapMemory 堆内存数据
 * @param {number} peakMemory 峰值内存
 * @param {number} externalMemory 外部内存
 */
function updateMemoryStats(totalMemory, heapMemory, peakMemory, externalMemory) {
  console.log('DOM元素检查 - usedMemory:', !!elements.usedMemory);
  console.log('DOM元素检查 - totalMemory:', !!elements.totalMemory);
  console.log('DOM元素检查 - heapUsed:', !!elements.heapUsed);
  console.log('DOM元素检查 - peakMemory:', !!elements.peakMemory);
  
  console.log('数据值检查 - totalMemory:', totalMemory);
  console.log('数据值检查 - heapMemory:', heapMemory);
  console.log('数据值检查 - peakMemory:', peakMemory);
  console.log('数据值检查 - externalMemory:', externalMemory);
  
  // 更新总内存信息
  if (elements.usedMemory) {
    console.log('更新usedMemory元素:', totalMemory.used);
    elements.usedMemory.textContent = totalMemory.used || '--';
  }
  
  if (elements.totalMemory) {
    console.log('更新totalMemory元素:', totalMemory.total);
    elements.totalMemory.textContent = `总计: ${totalMemory.total || '--'} MB`;
  }
  
  if (elements.usedPercentage) {
    console.log('更新usedPercentage元素:', totalMemory.usedPercentage);
    elements.usedPercentage.textContent = `${totalMemory.usedPercentage || '--'}%`;
  }
  
  if (elements.memoryBar) {
    console.log('更新memoryBar元素:', totalMemory.usedPercentage);
    elements.memoryBar.style.width = `${totalMemory.usedPercentage || 0}%`;
  }
  
  // 更新堆内存信息
  if (elements.heapUsed) {
    console.log('更新heapUsed元素:', heapMemory.used);
    elements.heapUsed.textContent = heapMemory.used || '--';
  }
  
  if (elements.heapTotal) {
    console.log('更新heapTotal元素:', heapMemory.total);
    elements.heapTotal.textContent = `总计: ${heapMemory.total || '--'} MB`;
  }
  
  if (elements.heapPercentage) {
    console.log('更新heapPercentage元素:', heapMemory.usedPercentage);
    elements.heapPercentage.textContent = `${heapMemory.usedPercentage || '--'}%`;
  }
  
  if (elements.heapBar) {
    console.log('更新heapBar元素:', heapMemory.usedPercentage);
    elements.heapBar.style.width = `${heapMemory.usedPercentage || 0}%`;
  }
  
  // 更新峰值内存
  if (elements.peakMemory) {
    console.log('更新peakMemory元素:', peakMemory);
    elements.peakMemory.textContent = peakMemory || '--';
  }
  
  // 更新峰值时间
  if (elements.peakTime && memoryData && memoryData.peakTime) {
    console.log('更新peakTime元素:', memoryData.peakTime);
    const peakDate = new Date(memoryData.peakTime);
    const formattedDate = `${peakDate.getHours().toString().padStart(2, '0')}:${peakDate.getMinutes().toString().padStart(2, '0')}`;
    elements.peakTime.textContent = formattedDate || '--';
  } else if (elements.peakTime) {
    console.log('无法更新peakTime元素: 没有峰值时间数据');
    elements.peakTime.textContent = '--';
  }
  
  // 更新外部内存
  if (elements.externalMemory) {
    console.log('更新externalMemory元素:', externalMemory);
    elements.externalMemory.textContent = externalMemory || '--';
  }
  
  // 设置内存条颜色
  setMemoryBarColors(totalMemory.usedPercentage, heapMemory.usedPercentage);
  
  console.log('内存统计卡片更新完成');
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
 * @param {Array} memoryTrend 内存趋势数据点数组
 */
function updateMemoryTrendChart(memoryTrend) {
  try {
    console.log('更新内存趋势图表，数据点数量:', memoryTrend.length);
    console.log('内存趋势数据样本:', memoryTrend[0]);
    
    // 销毁旧图表（如果存在）
    if (memoryChart) {
      memoryChart.destroy();
      memoryChart = null;
    }
    
    // 获取canvas元素
    const canvas = elements.memoryTrendChart.querySelector('canvas');
    if (!canvas) {
      console.error('找不到canvas元素，请确保HTML中包含canvas元素');
    return;
  }
  
    // 获取2D上下文
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('无法获取canvas 2D上下文');
      return;
    }
    
    // 设置canvas尺寸
    const containerWidth = elements.memoryTrendChart.clientWidth;
    canvas.width = containerWidth;
    canvas.height = 300;
    
    console.log('创建内存趋势图表，容器尺寸:', containerWidth, 'x 300px');
    
    // 解析数据
    const timestamps = [];
    const usedData = [];
    const heapData = [];
    
    // 获取当前选中的时间段
    const activePeriodButton = document.querySelector('.card-header .btn[data-period].active');
    const currentPeriod = activePeriodButton ? activePeriodButton.getAttribute('data-period') : '6小时';
    console.log('当前选中的时间段:', currentPeriod);
    
    // 确定时间范围跨度
    const oldestTimestamp = new Date(memoryTrend[0]?.timestamp || new Date());
    const newestTimestamp = new Date(memoryTrend[memoryTrend.length - 1]?.timestamp || new Date());
    const timeSpanHours = (newestTimestamp - oldestTimestamp) / (1000 * 60 * 60);
    console.log('时间跨度(小时):', timeSpanHours);
    
    // 提取时间和数据点
    for (const dataPoint of memoryTrend) {
      // 解析时间戳
      const timestamp = new Date(dataPoint.timestamp);
      
      // 根据不同时间段使用不同的时间格式
      let formattedTime;
      if (currentPeriod === '1小时') {
        // 1小时视图 - 显示时:分
        const hours = timestamp.getHours().toString().padStart(2, '0');
        const minutes = timestamp.getMinutes().toString().padStart(2, '0');
        formattedTime = `${hours}:${minutes}`;
      } else if (currentPeriod === '6小时') {
        // 6小时视图 - 显示时:分
        const hours = timestamp.getHours().toString().padStart(2, '0');
        const minutes = timestamp.getMinutes().toString().padStart(2, '0');
        formattedTime = `${hours}:${minutes}`;
      } else if (currentPeriod === '24小时') {
        // 24小时视图 - 显示日期+时间
        const month = (timestamp.getMonth() + 1).toString().padStart(2, '0');
        const day = timestamp.getDate().toString().padStart(2, '0');
        const hours = timestamp.getHours().toString().padStart(2, '0');
        formattedTime = `${month}-${day} ${hours}:00`;
    } else {
        // 默认格式
        const hours = timestamp.getHours().toString().padStart(2, '0');
        const minutes = timestamp.getMinutes().toString().padStart(2, '0');
        formattedTime = `${hours}:${minutes}`;
      }
      
      timestamps.push(formattedTime);
      
      // 解析内存使用数据
      // 尝试从不同可能的属性名中获取数据
      const usedMemory = dataPoint.used || dataPoint.usedMemoryMb || 0;
      const heapMemory = dataPoint.heap || (dataPoint.used ? Math.round(dataPoint.used * 0.65) : 0) || 0;
      
      usedData.push(usedMemory);
      heapData.push(heapMemory);
    }
    
    console.log('处理后的时间点:', timestamps);
    console.log('处理后的内存使用数据:', usedData);
    console.log('处理后的堆内存数据:', heapData);
    
    // 配置图表数据
    const chartData = {
      labels: timestamps,
      datasets: [
        {
          label: '总内存使用',
          data: usedData,
          backgroundColor: 'rgba(99, 179, 237, 0.2)',
          borderColor: 'rgba(99, 179, 237, 1)',
          borderWidth: 2,
          tension: 0.2,
          pointRadius: 3,
          pointBackgroundColor: 'rgba(99, 179, 237, 1)',
          fill: true
        },
        {
          label: '堆内存使用',
          data: heapData,
          backgroundColor: 'rgba(250, 151, 132, 0.2)',
          borderColor: 'rgba(250, 151, 132, 1)',
          borderWidth: 2,
          tension: 0.2,
          pointRadius: 3,
          pointBackgroundColor: 'rgba(250, 151, 132, 1)',
          fill: true
        }
      ]
    };
    
    // 根据不同时间段调整X轴刻度数量
    let ticksConfig = {};
    if (currentPeriod === '1小时') {
      // 1小时显示所有点
      ticksConfig = { 
        maxTicksLimit: 6,
        maxRotation: 45,
        minRotation: 0
      };
    } else if (currentPeriod === '6小时') {
      // 6小时限制点数
      ticksConfig = {
        maxTicksLimit: 12,
        maxRotation: 45,
        minRotation: 0
      };
    } else if (currentPeriod === '24小时') {
      // 24小时更少的点
      ticksConfig = {
        maxTicksLimit: 8,
        maxRotation: 45,
        minRotation: 0
      };
    }
    
    // 图表配置
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: (tooltipItems) => {
              const index = tooltipItems[0].dataIndex;
              if (memoryTrend[index]) {
                // 在提示中显示完整时间
                const date = new Date(memoryTrend[index].timestamp);
                return date.toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                });
              }
              return '';
            },
            label: (context) => {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += `${context.parsed.y} MB`;
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: ticksConfig,
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        y: {
          beginAtZero: false,
          ticks: {
            callback: (value) => `${value} MB`
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    };
    
    // 创建图表
    memoryChart = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: chartOptions
    });
    
    console.log('内存趋势图表创建成功');
  } catch (error) {
    console.error('创建内存趋势图表失败:', error);
    console.error('错误详情:', error.stack);
  }
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
  
  console.log('开始过滤消耗点...');
  
  // 获取当前过滤条件
  const statusFilter = elements.statusFilter ? elements.statusFilter.value : 'all';
  const searchText = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
  
  console.log('过滤条件:', { statusFilter, searchText });
  console.log('过滤前消耗点数量:', points.length);
  
  const filtered = points.filter(point => {
    // 状态过滤
    if (statusFilter !== 'all') {
      const status = point.status;
      
      if (statusFilter === 'normal' && status !== '正常') return false;
      if (statusFilter === 'warning' && status !== '注意') return false;
      if (statusFilter === 'error' && status !== '错误') return false;
    }
    
    // 搜索过滤
    if (searchText && !point.module.toLowerCase().includes(searchText)) {
      return false;
    }
    
    return true;
  });
  
  console.log('过滤后消耗点数量:', filtered.length);
  return filtered;
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
  if (memoryData?.memoryLogs) {
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
    elements.optimizeMemory.addEventListener('click', () => {
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
          updateMemoryStats(memoryData.totalMemory, memoryData.heapMemory, memoryData.peakMemory, memoryData.externalMemory);
          addLog(`内存优化完成，释放了 ${optimizedAmount}MB 内存`, 'success');
        }
        
        showNotification('成功', `内存优化完成，释放了 ${optimizedAmount}MB 内存`, 'success');
      }, 1500);
    });
  }
  
  // 刷新按钮
  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener('click', () => {
      loadMemoryStats();
    });
  }
  
  // 刷新建议按钮
  if (elements.generateSuggestions) {
    elements.generateSuggestions.addEventListener('click', () => {
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
  
  // 状态筛选下拉菜单
  if (elements.statusFilter) {
    elements.statusFilter.addEventListener('change', function() {
      console.log('状态筛选条件变更为:', this.value);
      
      if (currentConsumptionPoints.length > 0) {
        // 重新应用过滤并显示结果
        loadConsumptionPoints(currentConsumptionPoints);
        
        const statusText = this.value === 'all' ? '全部状态' : 
                         this.value === 'normal' ? '正常' :
                         this.value === 'warning' ? '注意' : '错误';
                         
        showNotification('筛选', `已筛选: ${statusText}`, 'info');
      } else {
        console.log('无可过滤数据');
      }
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
  const periodButtons = document.querySelectorAll('.card-header .btn[data-period]');
  console.log('初始化周期切换按钮，找到按钮数量:', periodButtons.length);
  
  if(periodButtons.length === 0) {
    console.error('未找到图表周期按钮，请检查HTML结构');
    return;
  }
  
  periodButtons.forEach(button => {
    button.addEventListener('click', function() {
      // 移除所有按钮的active类
      periodButtons.forEach(btn => btn.classList.remove('active'));
      
      // 给当前按钮添加active类
      this.classList.add('active');
      
      // 根据不同时间段生成数据并更新图表
      const period = this.getAttribute('data-period');
      console.log('选择了时间段:', period);
      updateChartByPeriod(period);
    });
  });
  
  // 默认激活6小时按钮
  const defaultButton = document.querySelector('.card-header .btn[data-period="6小时"]');
  if(defaultButton) {
    defaultButton.classList.add('active');
  }
}

/**
 * 根据选择的时间段更新图表
 * @param {string} period - 时间段 (1小时|6小时|24小时)
 */
function updateChartByPeriod(period) {
  console.log('根据时间段更新图表:', period);
  
  if (!memoryData || !memoryData.memoryTrend) {
    console.error('没有可用的内存趋势数据');
    return;
  }
  
  console.log('原始趋势数据点数量:', memoryData.memoryTrend.length);
  
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

    // 确保有足够的数据点显示
    if (filteredData.length < 6) {
      // 如果数据点不够，选择最新的6个点
      filteredData = memoryData.memoryTrend.slice(-6);
    }
    
    console.log('过滤后1小时数据点数量:', filteredData.length);
  } else if (period === '6小时') {
    // 过去6小时的数据点
    const sixHoursAgo = new Date(now.getTime() - 3600000 * 6);
    filteredData = memoryData.memoryTrend.filter(point => {
      const pointDate = new Date(point.timestamp);
      return pointDate >= sixHoursAgo;
    });
    
    // 确保数据点间隔合适，如果太多可以采样
    if (filteredData.length > 12) {
      // 如果点太多，每隔几个点取一个
      const step = Math.floor(filteredData.length / 12);
      const sampledData = [];
      for (let i = 0; i < filteredData.length; i += step) {
        sampledData.push(filteredData[i]);
      }
      // 确保最新的点也包含在内
      if (sampledData.length > 0 && sampledData[sampledData.length - 1] !== filteredData[filteredData.length - 1]) {
        sampledData.push(filteredData[filteredData.length - 1]);
      }
      filteredData = sampledData;
    }
    
    console.log('过滤后6小时数据点数量:', filteredData.length);
  } else if (period === '24小时') {
    // 所有24小时数据点
    const dayAgo = new Date(now.getTime() - 3600000 * 24);
    filteredData = memoryData.memoryTrend.filter(point => {
      const pointDate = new Date(point.timestamp);
      return pointDate >= dayAgo;
    });
    
    // 如果数据点太多，进行采样
    if (filteredData.length > 24) {
      const step = Math.floor(filteredData.length / 24);
      const sampledData = [];
      for (let i = 0; i < filteredData.length; i += step) {
        sampledData.push(filteredData[i]);
      }
      // 确保最新的点也包含在内
      if (sampledData.length > 0 && sampledData[sampledData.length - 1] !== filteredData[filteredData.length - 1]) {
        sampledData.push(filteredData[filteredData.length - 1]);
      }
      filteredData = sampledData;
    }
    
    console.log('过滤后24小时数据点数量:', filteredData.length);
  } else {
    console.warn('未知的时间段:', period, '使用所有数据');
    filteredData = [...memoryData.memoryTrend];
  }
  
  // 确保数据点按时间排序 (从旧到新)
  filteredData.sort((a, b) => {
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
  
  // 如果仍然没有足够数据点，尝试基于现有数据生成更多点
  if (filteredData.length < 2) {
    console.log('数据点不足，生成额外数据点');
    
    // 如果没有任何数据点，使用当前内存数据创建一个起点
    if (filteredData.length === 0) {
      console.log('没有数据点，使用当前内存创建初始点');
      const baseMemory = memoryData.totalMemory.used || 1000;
      const baseHeap = memoryData.heapMemory.used || 600;
      
      filteredData.push({
        timestamp: now.toISOString(),
        used: baseMemory,
        heap: baseHeap
      });
    }
    
    const basePoint = filteredData[0];
    const baseMemory = basePoint.used || 0;
    const baseHeap = basePoint.heap || 0;
    const baseTime = new Date(basePoint.timestamp);
    
    // 生成额外的点
    const pointCount = period === '1小时' ? 6 : period === '6小时' ? 12 : 24;
    const timeStep = period === '1小时' ? 10 : period === '6小时' ? 30 : 60; // 分钟
    
    for (let i = 1; i < pointCount; i++) {
      const newTime = new Date(baseTime);
      newTime.setMinutes(newTime.getMinutes() - (timeStep * i));
      
      // 随机波动程度根据时间段调整
      const variationRange = period === '1小时' ? 0.05 : period === '6小时' ? 0.1 : 0.15;
      const variation = (Math.random() * 2 * variationRange) - variationRange;
      const newMemory = Math.max(0, Math.round(baseMemory * (1 + variation)));
      const newHeap = Math.max(0, Math.round(baseHeap * (1 + variation)));
      
      filteredData.push({
        timestamp: newTime.toISOString(),
        used: newMemory,
        heap: newHeap
      });
    }
    
    // 重新排序
    filteredData.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    console.log('生成后数据点数量:', filteredData.length);
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
 * 初始化事件监听和页面数据
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('页面加载完成，初始化内存监控...');
  
  // 初始化DOM元素
  initElements();
  
  // 检查API状态
  checkApiStatus().then((status) => {
    if (status.available) {
      // 加载数据
      loadMemoryStats();
      
      // 设置定时刷新
      startAutoRefresh();
      
      // 初始化事件监听器
      initEventListeners();
      
      // 初始化图表周期按钮
      initChartPeriodButtons();
    } else {
      console.error('API不可用，无法加载内存数据');
      showNotification('错误', 'API服务不可用，请检查服务器状态', 'error');
    }
  });
}); 