/**
 * Solana MEV机器人 - 通用JavaScript工具函数
 */

// 通过环境变量读取API配置
// 注意：在浏览器中无法直接访问Node.js的process对象和env变量
// 因此我们需要从window对象中获取环境变量，这些变量应该在服务端渲染时注入

/**
 * 获取API基础URL
 * @returns {string} API基础URL
 */
const getApiBaseUrl = () => {
    try {
        // 首先尝试从全局环境变量中获取
        if (window?.ENV?.API_URL) {
            // 如果有端口，拼接端口
            let baseUrl = window.ENV.API_URL;
            
            // 如果是相对路径（不包含http或https），则添加当前域名
            if (!baseUrl.startsWith('http')) {
                baseUrl = `${window.location.origin}${baseUrl.startsWith('/') ? '' : '/'}${baseUrl}`;
            }
            
            if (window?.ENV?.API_PORT) {
                // 确保URL不以/结尾
                baseUrl = baseUrl.replace(/\/$/, '');
                // 检查URL是否已包含端口号
                if (!baseUrl.match(/:\d+$/)) {
                    baseUrl += `:${window.ENV.API_PORT}`;
                }
            }
            
            console.log(`[getApiBaseUrl] 从ENV获取API地址: ${baseUrl}`);
            return baseUrl;
        }
        
        // 第二选择，尝试从当前URL推断
        const currentUrl = window.location.origin;
        // 默认假设API在8080端口
        const apiUrl = currentUrl.replace(/(:\d+)?$/, ':8080');
        
        console.log(`[getApiBaseUrl] 根据当前地址推断API地址: ${apiUrl}`);
        return apiUrl;
    } catch (error) {
        console.error('[getApiBaseUrl] 获取API URL时出错:', error);
        // 默认回退到localhost:8080
        return 'http://localhost:8080';
    }
};

// 使用不同的名称暴露到全局作用域，避免命名冲突
window.utilsGetApiBaseUrl = getApiBaseUrl;

// 设置API基础URL
const API_BASE_URL = getApiBaseUrl();

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
 * 格式化数字为中文单位（万、亿）
 * @param {number} num - 需要格式化的数字
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的数字字符串
 */
function formatNumber(num, decimals = 2) {
  if (Number.isNaN(num) || num === undefined || num === null) return '0';
  
  // 使用中文的万、亿单位
  if (num >= 100000000) { // 亿
    return `${(num / 100000000).toFixed(2)}亿`;
  } 
  
  if (num >= 10000) { // 万
    return `${(num / 10000).toFixed(2)}万`;
  }
  
  // 如果数字很小，使用科学计数法
  if (num < 0.001 && num !== 0) {
    return num.toExponential(2);
  }
  
  // 其他情况使用标准千位分隔符
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
  if (Number.isNaN(num)) return `${currency}0`;
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
 * 获取API数据
 * @param {string} endpoint - API端点
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>} 响应数据
 */
async function fetchData(endpoint, options = {}) {
    try {
        // 确保环境变量对象存在
        if (!window.ENV) {
            console.warn('[fetchData] 环境变量未定义，初始化默认值');
            window.ENV = {
                API_URL: 'http://localhost:8080',
                ENVIRONMENT: 'development',
                USE_MOCK_DATA: false // 确保不使用模拟数据
            };
        }
        
        // 获取API基础URL
        const apiBaseUrl = getApiBaseUrl();
        
        // 确保endpoint以/开头，并且添加/api前缀（如果尚未添加）
        let formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        if (!formattedEndpoint.startsWith('/api/')) {
            formattedEndpoint = `/api${formattedEndpoint}`;
        }
        
        console.log(`[fetchData] 请求API: ${apiBaseUrl}${formattedEndpoint}`);
        
        // 完全简化请求，不设置任何额外选项，避免CORS问题
        const response = await fetch(`${apiBaseUrl}${formattedEndpoint}`);
        
        // 检查响应状态
        if (!response.ok) {
            throw new Error(`HTTP错误 ${response.status}: ${response.statusText}`);
        }
        
        // 解析JSON响应
        const data = await response.json();
        
        console.log(`[fetchData] 响应数据:`, data);
        
        // 确保响应始终是统一格式
        // 如果API返回的不是标准格式，进行适配
        if (!Object.prototype.hasOwnProperty.call(data, 'success')) {
            return {
                success: true,
                data
            };
        }
        
        return data;
    } catch (error) {
        console.error(`[fetchData] API请求失败 (${endpoint}):`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 检查API服务是否正常运行
 * @returns {Promise<{isAvailable: boolean, status: string, details: object}>} API状态信息
 */
const checkApiStatus = async () => {
    const timeoutMs = 5000; // 5秒超时
    const statusEndpoints = [
        '/api/status',
        '/status',
        '/api/system/status',
        '/health'
    ];
    
    console.log('[checkApiStatus] 开始检查API状态...');
    
    const apiUrl = getApiBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
        // 尝试多个可能的状态端点
        for (const endpoint of statusEndpoints) {
            try {
                const url = `${apiUrl}${endpoint}`;
                console.log(`[checkApiStatus] 尝试请求: ${url}`);
                
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                if (response.ok) {
                    clearTimeout(timeoutId);
                    const data = await response.json();
                    
                    console.log(`[checkApiStatus] 端点 ${endpoint} 响应成功:`, data);
                    
                    // 提取状态信息
                    const status = data.data?.status || 
                                  data.status ||
                                  (data.success ? 'running' : 'error');
                    
                    return {
                        isAvailable: true,
                        status: status,
                        details: data.data || data,
                        endpoint: endpoint
                    };
                }
                
                console.warn(`[checkApiStatus] 端点 ${endpoint} 响应异常: ${response.status}`);
            } catch (endpointError) {
                console.warn(`[checkApiStatus] 检查端点 ${endpoint} 时出错:`, endpointError);
                // 继续尝试下一个端点
            }
        }
        
        // 所有端点都失败
        console.error('[checkApiStatus] 所有API状态端点都不可用');
        return {
            isAvailable: false,
            status: 'unavailable',
            details: {
                error: 'API服务不可用或未响应',
                checkedEndpoints: statusEndpoints
            }
        };
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            console.error('[checkApiStatus] API请求超时');
            return {
                isAvailable: false,
                status: 'timeout',
                details: {
                    error: 'API请求超时',
                    timeout: timeoutMs
                }
            };
        }
        
        console.error('[checkApiStatus] API健康检查失败:', error);
        return {
            isAvailable: false,
            status: 'error',
            details: {
                error: error.message
            }
        };
    }
};

/**
 * 检查API状态并显示诊断结果
 * @returns {Promise<boolean>} API是否可用
 */
async function checkAndDiagnoseApi() {
    console.group('API连接诊断');
    
    try {
        const apiUrl = getApiBaseUrl();
        console.log('使用API基础URL:', apiUrl);
        
        // 测试健康检查端点
        console.log('尝试访问健康检查端点...');
        let healthResult = false;
        
        try {
            const healthResponse = await fetch(`${apiUrl}/health?t=${Date.now()}`);
            if (healthResponse.ok) {
                const healthData = await healthResponse.json();
                console.log('健康检查响应:', healthData);
                healthResult = true;
            } else {
                console.warn(`健康检查失败: ${healthResponse.status} ${healthResponse.statusText}`);
            }
        } catch (healthError) {
            console.error('健康检查请求失败:', healthError);
        }
        
        // 测试状态端点
        console.log('尝试访问状态端点...');
        let statusResult = false;
        
        try {
            const statusResponse = await fetch(`${apiUrl}/status?t=${Date.now()}`);
            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                console.log('状态检查响应:', statusData);
                statusResult = true;
            } else {
                console.warn(`状态检查失败: ${statusResponse.status} ${statusResponse.statusText}`);
            }
        } catch (statusError) {
            console.error('状态检查请求失败:', statusError);
        }
        
        // 诊断结果
        if (healthResult && statusResult) {
            console.log('✅ API连接正常: 健康检查和状态端点均可访问');
            console.groupEnd();
            return true;
        } else if (healthResult) {
            console.warn('⚠️ API部分可用: 健康检查正常，但状态端点不可访问');
            console.groupEnd();
            return true;
        } else {
            console.error('❌ API连接失败: 无法访问任何API端点');
            console.log('可能的原因:');
            console.log('1. API服务未启动（启动命令: npm run api:dev）');
            console.log('2. API地址或端口配置错误（当前URL: ' + apiUrl + '）');
            console.log('3. API服务有编译错误（查看控制台错误信息）');
            console.log('4. CORS策略阻止了请求（在API服务器配置CORS）');
            console.groupEnd();
            return false;
        }
    } catch (error) {
        console.error('API诊断过程中发生错误:', error);
        console.groupEnd();
        return false;
    }
}

// 暴露诊断函数
window.checkAndDiagnoseApi = checkAndDiagnoseApi;

/**
 * 格式化运行时间
 * @param {number} uptime 运行时间（秒）
 * @returns {string} 格式化后的运行时间
 */
function formatUptime(uptime) {
  if (uptime === undefined || uptime === null) return '--';
  
  // 如果传入的是字符串形式（如 "3d 5h 10m"），直接返回
  if (typeof uptime === 'string' && (uptime.includes('d') || uptime.includes('h') || uptime.includes('m'))) {
    return uptime;
  }
  
  // 转换为数字
  const seconds = Number(uptime);
  if (Number.isNaN(seconds)) return uptime;
  
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
 * 初始化系统状态
 * @returns {Promise<void>}
 */
async function initSystemStatus() {
  try {
    const data = await fetchData('/status');
    if (!data || !data.success) {
      console.error('[initSystemStatus] 无法获取系统状态数据');
      return;
    }
    
    // 适配API返回格式的差异
    const systemStatus = data.data || data;
    
    // 更新系统状态指示器
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    if (statusDot && statusText) {
      if (systemStatus.status === 'running' || systemStatus.status === 'running【M】') {
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
    if (uptimeEl && systemStatus.uptime !== undefined) {
      uptimeEl.textContent = systemStatus.uptime;
    }
    
    // 更新CPU进度条
    const cpuBar = document.querySelector('.cpu-bar');
    const cpuUsage = document.querySelector('.cpu-usage');
    if (cpuBar && cpuUsage && systemStatus.cpu && systemStatus.cpu.usage !== undefined) {
      cpuBar.style.width = `${systemStatus.cpu.usage}%`;
      cpuUsage.textContent = `${systemStatus.cpu.usage.toFixed(1)}%`;
    }
    
    // 更新内存进度条
    const memoryBar = document.querySelector('.memory-bar');
    const memoryUsage = document.querySelector('.memory-usage');
    if (memoryBar && memoryUsage && systemStatus.memory && systemStatus.memory.usagePercent !== undefined) {
      memoryBar.style.width = `${systemStatus.memory.usagePercent}%`;
      memoryUsage.textContent = `${systemStatus.memory.usagePercent.toFixed(1)}%`;
    }
    
    // 更新最后更新时间
    if (systemStatus.lastUpdated) {
      const lastUpdatedElements = document.querySelectorAll('.last-updated');
      for (const el of lastUpdatedElements) {
        el.textContent = `最后更新: ${formatDateTime(systemStatus.lastUpdated)}`;
      }
    }
  } catch (error) {
    console.error('[initSystemStatus] 初始化系统状态失败:', error);
    showNotification('系统状态', '无法加载系统状态数据', 'error');
  }
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
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      notification.classList.add('notification-hide');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
  }
  
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
    updateData: (data) => {
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
  
  for (const column of columns) {
    const th = document.createElement('th');
    th.textContent = column.title;
    if (column.width) th.style.width = column.width;
    headerRow.appendChild(th);
  }
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // 创建表体
  const tbody = document.createElement('tbody');
  
  for (const item of data) {
    const row = document.createElement('tr');
    
    for (const column of columns) {
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
    }
    
    tbody.appendChild(row);
  }
  
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
  try {
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
    
    console.log('[initApp] 应用初始化完成');
  } catch (error) {
    console.error('[initApp] 应用初始化失败:', error);
    showNotification('初始化失败', '应用加载过程中出现错误，请刷新页面重试', 'error');
  }
}

/**
 * 初始化移动端菜单
 */
function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (menuToggle && sidebar) {
    // 移除旧事件监听器，防止重复绑定
    const newMenuToggle = menuToggle.cloneNode(true);
    if (menuToggle.parentNode) {
      menuToggle.parentNode.replaceChild(newMenuToggle, menuToggle);
    }
    
    newMenuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
    
    // 点击主内容区域时关闭菜单
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      // 移除旧事件监听器
      const newMainContent = mainContent.cloneNode(true);
      if (mainContent.parentNode) {
        mainContent.parentNode.replaceChild(newMainContent, mainContent);
      }
      
      newMainContent.addEventListener('click', (e) => {
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
    // 移除旧事件监听器
    const newThemeToggleBtn = themeToggleBtn.cloneNode(true);
    if (themeToggleBtn.parentNode) {
      themeToggleBtn.parentNode.replaceChild(newThemeToggleBtn, themeToggleBtn);
    }
    
    newThemeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      
      const isDarkTheme = !document.body.classList.contains('light-theme');
      const icon = newThemeToggleBtn.querySelector('i');
      
      if (icon) {
        icon.className = isDarkTheme ? 'ri-moon-line' : 'ri-sun-line';
      }
      
      // 保存主题偏好到本地存储
      localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    });
    
    // 从本地存储中恢复主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.body.classList.toggle('light-theme', savedTheme === 'light');
      const icon = newThemeToggleBtn.querySelector('i');
      if (icon) {
        icon.className = savedTheme === 'dark' ? 'ri-moon-line' : 'ri-sun-line';
      }
    }
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
    
    // 移除旧事件监听器
    const newContainer = container.cloneNode(true);
    if (container.parentNode) {
      container.parentNode.replaceChild(newContainer, container);
    }
    
    // 添加滚动监听
    newContainer.addEventListener('scroll', function() {
      checkScrollShadow(this);
    });
  }
}

/**
 * 检查表格容器是否需要显示滚动阴影
 * @param {HTMLElement} container - 表格容器元素
 */
function checkScrollShadow(container) {
  if (!container) return;
  
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

// 添加窗口大小变化监听，刷新表格阴影
window.addEventListener('resize', () => {
  initTableScroll();
}); 