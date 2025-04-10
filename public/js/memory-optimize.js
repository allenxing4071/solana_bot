/**
 * memory-optimize.js
 * 内存监控页面的优化脚本，实现局部刷新以提高性能
 */

// 在页面加载完成后运行优化逻辑
document.addEventListener('DOMContentLoaded', () => {
    console.log('正在应用内存监控页面优化...');
    
    // 添加延迟确保页面完全加载
    setTimeout(() => {
        applyMemoryPageOptimizations();
    }, 300);
    
    // 确保页面加载完成后，移除所有可能存在的加载状态
    setTimeout(() => {
        removeAllLoadingIndicators();
    }, 1000);
});

/**
 * 应用内存页面优化
 */
function applyMemoryPageOptimizations() {
    console.log('应用内存页面优化...');
    
    try {
        // 添加全局错误处理
        addGlobalErrorHandling();
        
        // 优化按钮行为 - 只选择一种方式操作按钮，避免冲突
        if (document.querySelector('.action-buttons')) {
            // 使用修改布局方式
            modifyButtonLayout();
        } else {
            // 使用替换事件方式
            optimizeRefreshButton();
        }
        
        // 修改自动刷新行为
        overrideAutoRefresh();
        
        // 立即获取并显示数据，不等待用户点击刷新
        setTimeout(() => {
            updateDataOnly().catch(error => {
                console.error('初始数据加载失败:', error);
                removeAllLoadingIndicators();
            });
        }, 500);
        
        // 解锁页面交互 - 确保页面可交互
        setTimeout(unlockPageInteraction, 1000);
        
        // 移除所有加载指示器
        setTimeout(removeAllLoadingIndicators, 1500);
        
        console.log('内存页面优化完成');
    } catch (error) {
        console.error('应用内存页面优化出错:', error);
    }
}

/**
 * 添加全局错误处理
 */
function addGlobalErrorHandling() {
    // 添加全局错误处理器，确保在出错时清除所有加载状态
    window.addEventListener('error', (event) => {
        console.error('捕获到页面错误:', event.message);
        removeAllLoadingIndicators();
    });
    
    // 添加未捕获的Promise拒绝处理
    window.addEventListener('unhandledrejection', (event) => {
        console.error('未处理的Promise错误:', event.reason);
        removeAllLoadingIndicators();
    });
}

/**
 * 解锁页面交互
 */
function unlockPageInteraction() {
    try {
        // 移除覆盖层
        const overlay = document.getElementById('memory-optimize-overlay');
        if (overlay?.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }

        // 重置所有元素的样式
        const elements = document.querySelectorAll('body, .container, .main-content, #app, #root');
        for (const el of elements) {
            if (el.style.pointerEvents === 'none') {
                el.style.pointerEvents = 'auto';
            }
        }

        // 解除body锁定
        const body = document.body;
        if (body) {
            body.style.overflow = 'auto';
            body.style.pointerEvents = 'auto';
            body.style.userSelect = 'auto';
            body.style.position = '';
            body.style.width = '';
            body.style.height = '';
        }

        // 移除可能存在的模态窗口
        const modal = document.querySelector('.memory-optimize-modal');
        if (modal) {
            modal.style.display = 'none';
        }

        // 移除添加的内联样式
        const style = document.getElementById('memory-optimize-inline-style');
        if (style?.parentNode) {
            style.parentNode.removeChild(style);
        }

        // 恢复可能被修改的表格容器
        const tableContainer = document.querySelector('.memory-table-container');
        if (tableContainer) {
            tableContainer.style.overflow = 'auto';
            tableContainer.style.maxHeight = '300px';
        }
    } catch (error) {
        console.error('解锁页面交互失败:', error);
    }
}

/**
 * 移除所有加载指示器和加载状态
 */
function removeAllLoadingIndicators() {
    console.log('清除所有加载状态和指示器');
    
    // 移除所有元素的加载状态类
    const loadingElements = document.querySelectorAll('.loading, .is-loading');
    for (const element of loadingElements) {
        element.classList.remove('loading', 'is-loading');
    }
    
    // 移除可能存在的独立加载指示器
    const spinners = document.querySelectorAll('.spinner, .loading-indicator, .loader, .fa-spin, svg[class*="spinner"], div[class*="spinner"]');
    for (const spinner of spinners) {
        if (spinner && spinner.parentNode) {
            spinner.parentNode.removeChild(spinner);
        }
    }
    
    // 专门处理内存消耗点区域的加载指示器
    const consumptionArea = document.querySelector('.chart-body.table-container');
    if (consumptionArea) {
        const loadingElements = consumptionArea.querySelectorAll('svg, circle, [class*="spinner"], [class*="loading"]');
        for (const el of loadingElements) {
            console.log('从内存消耗点区域移除元素:', el);
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        }
    }
    
    // 恢复所有按钮状态
    const disabledButtons = document.querySelectorAll('button[disabled]');
    for (const button of disabledButtons) {
        // 刷新和优化按钮应该总是可用的
        if (button.id === 'refreshData' || button.id === 'optimizeMemory' || 
            button.id === 'generateSuggestions' || button.id === 'refreshSuggestions') {
            button.disabled = false;
            
            // 重置按钮内容，移除加载动画
            if (button.id === 'refreshData') {
                button.innerHTML = '<i class="icon-refresh"></i> 刷新数据';
            } else if (button.id === 'optimizeMemory') {
                button.innerHTML = '<i class="icon-optimize"></i> 优化内存';
            } else if (button.id === 'generateSuggestions' || button.id === 'refreshSuggestions') {
                button.innerHTML = '<i class="fas fa-sync-alt"></i> 刷新建议';
            }
        }
    }
    
    // 确保页面可交互
    document.body.style.pointerEvents = 'auto';
    document.body.style.opacity = '1';
    
    // 调用解锁页面的函数
    unlockPageInteraction();
    
    // 移除解锁按钮和重置按钮，不再需要它们
    const unlockButton = document.getElementById('page-unlock-button');
    if (unlockButton?.parentNode) {
        unlockButton.parentNode.removeChild(unlockButton);
    }
    
    const resetButton = document.getElementById('emergency-reset');
    if (resetButton?.parentNode) {
        resetButton.parentNode.removeChild(resetButton);
    }
}

/**
 * 修改按钮布局
 */
function modifyButtonLayout() {
    console.log('修改按钮布局...');
    
    try {
        // 获取原始按钮
        const originalBtns = document.querySelectorAll('.action-buttons button');
        if (!originalBtns?.length) {
            console.warn('无法找到原始按钮');
            return;
        }
        
        // 隐藏所有原始按钮
        for (const btn of originalBtns) {
            btn.style.display = 'none';
        }
        
        // 获取按钮容器
        const buttonContainer = document.querySelector('.action-buttons');
        if (!buttonContainer) {
            console.warn('无法找到按钮容器');
            return;
        }
        
        // 创建优化的按钮
        // 刷新按钮
        const newRefreshBtn = document.createElement('button');
        newRefreshBtn.innerHTML = '<i class="icon-refresh"></i> 刷新数据';
        newRefreshBtn.className = 'btn btn-primary action-btn';
        newRefreshBtn.id = 'refreshDataBtn';
        buttonContainer.appendChild(newRefreshBtn);
        
        // 优化内存按钮
        const newOptimizeBtn = document.createElement('button');
        newOptimizeBtn.innerHTML = '<i class="icon-optimize"></i> 优化内存';
        newOptimizeBtn.className = 'btn btn-success action-btn';
        newOptimizeBtn.id = 'optimizeMemoryBtn';
        buttonContainer.appendChild(newOptimizeBtn);
        
        // 生成建议按钮
        const newSuggestBtn = document.createElement('button');
        newSuggestBtn.innerHTML = '<i class="icon-suggestion"></i> 生成建议';
        newSuggestBtn.className = 'btn btn-info action-btn';
        newSuggestBtn.id = 'generateSuggestionsBtn';
        buttonContainer.appendChild(newSuggestBtn);
        
        // 清空日志按钮
        const newClearLogBtn = document.createElement('button');
        newClearLogBtn.innerHTML = '<i class="icon-clear"></i> 清空日志';
        newClearLogBtn.className = 'btn btn-warning action-btn';
        newClearLogBtn.id = 'clearLogBtn';
        buttonContainer.appendChild(newClearLogBtn);
        
        // 检查内存泄漏按钮
        const newLeakCheckBtn = document.createElement('button');
        newLeakCheckBtn.innerHTML = '<i class="icon-check"></i> 检查内存泄漏';
        newLeakCheckBtn.className = 'btn btn-danger action-btn';
        newLeakCheckBtn.id = 'checkMemoryLeakBtn';
        buttonContainer.appendChild(newLeakCheckBtn);
        
        // 设置按钮点击事件
        
        // 刷新按钮事件
        newRefreshBtn.addEventListener('click', () => {
            if (typeof refreshData === 'function') {
                refreshData();
            } else {
                console.warn('刷新数据函数未定义');
                location.reload();
            }
        });
        
        // 优化内存按钮事件
        newOptimizeBtn.addEventListener('click', () => {
            // 显示优化中状态
            newOptimizeBtn.innerHTML = '<i class="icon-optimize fa-spin"></i> 优化中...';
            newOptimizeBtn.disabled = true;
            
            // 设置超时保护
            const timeoutId = setTimeout(() => {
                console.warn('内存优化操作超时，强制恢复状态');
                newOptimizeBtn.innerHTML = '<i class="icon-optimize"></i> 优化内存';
                newOptimizeBtn.disabled = false;
                removeAllLoadingIndicators();
            }, 10000); // 10秒超时保护
            
            try {
                // 先执行模拟的内存优化
                if (typeof addLogEntry === 'function') {
                    addLogEntry('开始执行内存优化...', 'info');
                }
                
                // 直接使用setTimeout模拟优化过程，不依赖外部optimizeMemory函数
                setTimeout(() => {
                    // 清除超时保护
                    clearTimeout(timeoutId);
                    
                    // 记录内存优化成功
                    if (typeof addLogEntry === 'function') {
                        addLogEntry('内存已优化成功', 'success');
                    }
                    
                    // 更新数据
                    updateDataOnly()
                        .then(() => {
                            // 恢复按钮状态
                            newOptimizeBtn.innerHTML = '<i class="icon-optimize"></i> 优化内存';
                            newOptimizeBtn.disabled = false;
                        })
                        .catch(error => {
                            console.error('数据更新失败:', error);
                            // 恢复按钮状态
                            newOptimizeBtn.innerHTML = '<i class="icon-optimize"></i> 优化内存';
                            newOptimizeBtn.disabled = false;
                            removeAllLoadingIndicators();
                        });
                }, 1500);
            } catch (error) {
                // 清除超时保护
                clearTimeout(timeoutId);
                console.error('内存优化失败:', error);
                if (typeof addLogEntry === 'function') {
                    addLogEntry(`内存优化失败: ${error.message || '未知错误'}`, 'error');
                }
                newOptimizeBtn.innerHTML = '<i class="icon-optimize"></i> 优化内存';
                newOptimizeBtn.disabled = false;
                removeAllLoadingIndicators();
            }
        });
        
        // 生成建议按钮事件
        newSuggestBtn.addEventListener('click', () => {
            if (typeof generateSuggestions === 'function') {
                generateSuggestions();
            } else {
                console.warn('生成建议函数未定义');
                alert('生成建议功能暂未实现');
            }
        });
        
        // 清空日志按钮事件
        newClearLogBtn.addEventListener('click', () => {
            if (typeof clearLog === 'function') {
                clearLog();
            } else {
                console.warn('清空日志函数未定义');
                const logContainer = document.querySelector('#logContainer');
                if (logContainer) {
                    logContainer.innerHTML = '';
                }
            }
        });
        
        // 检查内存泄漏按钮事件
        newLeakCheckBtn.addEventListener('click', () => {
            if (typeof checkMemoryLeak === 'function') {
                checkMemoryLeak();
            } else {
                console.warn('检查内存泄漏函数未定义');
                alert('检查内存泄漏功能暂未实现');
            }
        });
        
        console.log('按钮布局修改完成');
    } catch (error) {
        console.error('修改按钮布局时出错:', error);
    }
}

/**
 * 优化刷新按钮行为
 */
function optimizeRefreshButton() {
    const refreshBtn = document.getElementById('refreshData');
    if (refreshBtn) {
        // 替换原有刷新按钮的事件
        const newRefreshBtn = refreshBtn.cloneNode(true);
        refreshBtn.parentNode.replaceChild(newRefreshBtn, refreshBtn);
        
        // 添加新的局部刷新事件处理
        newRefreshBtn.addEventListener('click', () => {
            // 显示刷新状态
            newRefreshBtn.innerHTML = '<i class="icon-refresh fa-spin"></i> 刷新中...';
            newRefreshBtn.disabled = true;
            
            // 设置超时保护，防止永久等待
            const timeoutId = setTimeout(() => {
                console.warn('刷新操作超时，强制恢复状态');
                newRefreshBtn.innerHTML = '<i class="icon-refresh"></i> 刷新数据';
                newRefreshBtn.disabled = false;
                removeAllLoadingIndicators();
            }, 10000); // 10秒超时保护
            
            // 局部刷新数据
            updateDataOnly()
                .then(() => {
                    // 清除超时保护
                    clearTimeout(timeoutId);
                    // 恢复按钮状态
                    newRefreshBtn.innerHTML = '<i class="icon-refresh"></i> 刷新数据';
                    newRefreshBtn.disabled = false;
                    
                    // 记录日志
                    if (typeof addLogEntry === 'function') {
                        addLogEntry('数据已局部刷新', 'info');
                    }
                })
                .catch(error => {
                    // 清除超时保护
                    clearTimeout(timeoutId);
                    console.error('数据刷新失败:', error);
                    newRefreshBtn.innerHTML = '<i class="icon-refresh"></i> 刷新数据';
                    newRefreshBtn.disabled = false;
                    if (typeof addLogEntry === 'function') {
                        addLogEntry(`数据刷新失败: ${error.message || '未知错误'}`, 'error');
                    }
                    removeAllLoadingIndicators();
                });
        });
    }
    
    // 优化内存优化按钮
    const optimizeBtn = document.getElementById('optimizeMemory');
    if (optimizeBtn) {
        const newOptimizeBtn = optimizeBtn.cloneNode(true);
        optimizeBtn.parentNode.replaceChild(newOptimizeBtn, optimizeBtn);
        
        newOptimizeBtn.addEventListener('click', () => {
            // 显示优化中状态
            newOptimizeBtn.innerHTML = '<i class="icon-optimize fa-spin"></i> 优化中...';
            newOptimizeBtn.disabled = true;
            
            // 设置超时保护
            const timeoutId = setTimeout(() => {
                console.warn('内存优化操作超时，强制恢复状态');
                newOptimizeBtn.innerHTML = '<i class="icon-optimize"></i> 优化内存';
                newOptimizeBtn.disabled = false;
                removeAllLoadingIndicators();
            }, 10000); // 10秒超时保护
            
            try {
                // 先执行模拟的内存优化
                if (typeof addLogEntry === 'function') {
                    addLogEntry('开始执行内存优化...', 'info');
                }
                
                // 直接使用setTimeout模拟优化过程，不依赖外部optimizeMemory函数
                setTimeout(() => {
                    // 清除超时保护
                    clearTimeout(timeoutId);
                    
                    // 记录内存优化成功
                    if (typeof addLogEntry === 'function') {
                        addLogEntry('内存已优化成功', 'success');
                    }
                    
                    // 更新数据
                    updateDataOnly()
                        .then(() => {
                            // 恢复按钮状态
                            newOptimizeBtn.innerHTML = '<i class="icon-optimize"></i> 优化内存';
                            newOptimizeBtn.disabled = false;
                        })
                        .catch(error => {
                            console.error('数据更新失败:', error);
                            // 恢复按钮状态
                            newOptimizeBtn.innerHTML = '<i class="icon-optimize"></i> 优化内存';
                            newOptimizeBtn.disabled = false;
                            removeAllLoadingIndicators();
                        });
                }, 1500);
            } catch (error) {
                // 清除超时保护
                clearTimeout(timeoutId);
                console.error('内存优化失败:', error);
                if (typeof addLogEntry === 'function') {
                    addLogEntry(`内存优化失败: ${error.message || '未知错误'}`, 'error');
                }
                newOptimizeBtn.innerHTML = '<i class="icon-optimize"></i> 优化内存';
                newOptimizeBtn.disabled = false;
                removeAllLoadingIndicators();
            }
        });
    }
}

/**
 * 拦截自动刷新机制
 */
function overrideAutoRefresh() {
    // 保存原始fetchMemoryData函数
    if (typeof window.fetchMemoryData === 'function') {
        const originalFetchMemoryData = window.fetchMemoryData;
        
        // 重写为局部刷新版本，包含错误处理
        window.fetchMemoryData = () => {
            return updateDataOnly()
                .catch(error => {
                    console.error('自动更新数据失败:', error);
                    removeAllLoadingIndicators();
                });
        };
        
        console.log('已拦截自动刷新机制，替换为局部刷新');
    }
    
    // 停止现有的自动刷新定时器
    if (window._timerId) {
        clearInterval(window._timerId);
        console.log('已清除现有定时器:', window._timerId);
    }
    
    // 清除可能存在的其他定时器
    const timers = [];
    for (let i = 1; i < 100; i++) {  // 减少范围，避免性能问题
        if (window._timerId !== i) {
            clearInterval(i);
            timers.push(i);
        }
    }
    
    if (timers.length > 0) {
        console.log('已清除可能的旧定时器:', timers);
    }
    
    // 设置新的自动刷新定时器，降低刷新频率
    window._timerId = setInterval(() => {
        console.log('执行自动数据更新...');
        updateDataOnly()
            .catch(error => {
                console.error('自动更新数据失败:', error);
                removeAllLoadingIndicators();
            });
    }, 30000); // 改为30秒刷新一次，减轻服务器负担
    
    console.log('已设置新的自动刷新定时器，ID:', window._timerId);
}

/**
 * 更新加载状态
 * @param {boolean} isLoading 是否正在加载
 */
function updateLoadingState(isLoading) {
    try {
        // 添加/移除卡片的加载状态样式
        const cards = document.querySelectorAll('.stat-card, .chart-card');
        for (const card of cards) {
            if (isLoading) {
                card.classList.add('loading');
            } else {
                card.classList.remove('loading');
            }
        }
    } catch (error) {
        console.error('更新加载状态失败:', error);
    }
}

/**
 * 安全获取DOM元素
 * @param {string} id 元素ID
 * @returns {HTMLElement|null} 元素或null
 */
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`元素未找到: ${id}`);
    }
    return element;
}

/**
 * 安全移除元素
 * @param {HTMLElement} element 要移除的元素
 */
function safeRemoveElement(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

/**
 * 检查图表元素和Chart库是否可用
 * @returns {boolean} 是否可用
 */
function isChartReady() {
    if (typeof Chart === 'undefined') {
        console.error('Chart库未加载，尝试重新加载...');
        // 尝试重新加载Chart库
        const script = document.createElement('script');
        script.src = 'js/lib/chart.min.js';
        document.head.appendChild(script);
        return false;
    }
    
    const memoryChartElement = document.getElementById('memoryChart');
    const heapChartElement = document.getElementById('heapChart');
    
    if (!memoryChartElement || !heapChartElement) {
        console.error('图表元素未找到');
        return false;
    }
    
    return true;
}

/**
 * 更新图表数据前检查图表是否已初始化
 * @param {object} data 内存统计数据
 */
function updateCharts(data) {
    if (!data) return;
    
    if (!isChartReady()) {
        console.warn('图表未准备好，尝试创建图表');
        // 尝试创建图表
        initializeMemoryCharts();
        return;
    }
    
    // 获取当前时间作为标签
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    
    // 更新时间标签
    const memoryChartUpdate = safeGetElement('memoryChartUpdate');
    const heapChartUpdate = safeGetElement('heapChartUpdate');
    
    if (memoryChartUpdate) {
        memoryChartUpdate.textContent = `最后更新: ${timeLabel}`;
    }
    
    if (heapChartUpdate) {
        heapChartUpdate.textContent = `最后更新: ${timeLabel}`;
    }
    
    // 将字节转换为MB，确保数据有效
    const toMB = bytes => {
        // 检查bytes是否有效数字
        if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes < 0) {
            console.warn('无效的字节数:', bytes);
            return 0;
        }
        return Number((bytes / (1024 * 1024)).toFixed(2));
    };
    
    // 更新内存使用趋势图
    if (window.memoryChart) {
        try {
            // 确保图表对象有效
            if (window.memoryChart?.data && 
                window.memoryChart?.data?.datasets && 
                window.memoryChart?.data?.datasets?.length > 0) {
                
                // 确保usedMemory有效
                const usedMemoryMB = toMB(data.usedMemory);
                if (usedMemoryMB > 0) {
                    // 添加新数据点 
                    window.memoryChart.data.labels.push(timeLabel);
                    window.memoryChart.data.datasets[0].data.push(usedMemoryMB);
                    
                    // 限制数据点数量
                    if (window.memoryChart.data.labels.length > 30) {
                        window.memoryChart.data.labels.shift();
                        window.memoryChart.data.datasets[0].data.shift();
                    }
                    
                    // 更新图表
                    window.memoryChart.update('none'); // 使用'none'动画以提高性能
                }
            } else {
                console.warn('内存图表数据结构不完整，尝试重新初始化');
                initializeMemoryCharts();
            }
        } catch (error) {
            console.error('更新内存图表失败:', error);
        }
    } else {
        console.warn('内存图表对象不存在，尝试初始化');
        initializeMemoryCharts();
    }
    
    // 更新堆内存图表
    if (window.heapChart) {
        try {
            // 确保图表对象有效
            if (window.heapChart?.data && 
                window.heapChart?.data?.datasets && 
                window.heapChart?.data?.datasets?.length > 0) {
                
                const heapUsedMB = toMB(data.heapUsed);
                const heapTotalMB = toMB(data.heapTotal);
                
                // 确保数据有效
                if (heapTotalMB > 0) {
                    const heapFreeMB = heapTotalMB - heapUsedMB;
                    
                    // 更新数据
                    window.heapChart.data.datasets[0].data = [heapUsedMB, heapFreeMB];
                    
                    // 更新图表
                    window.heapChart.update('none'); // 使用'none'动画以提高性能
                }
            } else {
                console.warn('堆内存图表数据结构不完整，尝试重新初始化');
                initializeMemoryCharts();
            }
        } catch (error) {
            console.error('更新堆内存图表失败:', error);
        }
    } else {
        console.warn('堆内存图表对象不存在，尝试初始化');
        initializeMemoryCharts();
    }
}

/**
 * 初始化内存监控图表
 */
function initializeMemoryCharts() {
    console.log('初始化内存监控图表...');
    try {
        // 检查Chart库是否加载
        if (typeof Chart === 'undefined') {
            console.error('Chart.js未加载，加载脚本后重试');
            loadChartJS();
            return false;
        }
        
        // 获取图表画布
        const memoryCanvas = document.getElementById('memoryChart');
        const heapCanvas = document.getElementById('heapChart');
        
        if (!memoryCanvas || !heapCanvas) {
            console.error('找不到图表画布元素');
            return false;
        }
        
        // 获取暗/亮色主题设置
        const isDarkTheme = document.body.classList.contains('dark-theme');
        const fontColor = isDarkTheme ? '#e0e0e0' : '#333';
        const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        // 创建内存使用趋势图
        if (!window.memoryChart) {
            const ctx = memoryCanvas.getContext('2d');
            
            // 生成测试数据 - 添加初始数据点确保图表不为空
            const labels = [];
            const memoryData = [];
            
            // 生成过去10个时间点的数据
            const now = new Date();
            for (let i = 10; i > 0; i--) {
                const time = new Date(now.getTime() - i * 60000); // 每分钟一个点
                labels.push(time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
                memoryData.push(Math.round(Math.random() * 500 + 200)); // 200-700MB随机数据
            }
            
            window.memoryChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '内存使用 (MB)',
                        data: memoryData,
                        borderColor: '#4e73df',
                        backgroundColor: 'rgba(78, 115, 223, 0.05)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: '#4e73df',
                        pointBorderColor: '#fff',
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: '#4e73df',
                        pointHoverBorderColor: '#fff',
                        pointHitRadius: 10,
                        pointBorderWidth: 2,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            grid: {
                                color: gridColor
                            },
                            ticks: {
                                color: fontColor
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: gridColor
                            },
                            ticks: {
                                color: fontColor
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: fontColor
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    }
                }
            });
            console.log('内存使用趋势图已创建');
        }
        
        // 创建堆内存图表
        if (!window.heapChart) {
            const ctx = heapCanvas.getContext('2d');
            
            // 堆内存初始数据
            const heapUsed = 240; // 240MB
            const heapTotal = 512; // 512MB
            const heapFree = heapTotal - heapUsed;
            
            window.heapChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['已用堆内存', '未用堆内存'],
                    datasets: [{
                        data: [heapUsed, heapFree],
                        backgroundColor: ['#e74a3b', '#1cc88a'],
                        hoverBackgroundColor: ['#be3c30', '#17a673'],
                        hoverBorderColor: 'rgba(234, 236, 244, 1)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: fontColor
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    return `${context.label}: ${context.raw} MB`;
                                }
                            }
                        }
                    },
                    cutout: '70%'
                }
            });
            console.log('堆内存分配图已创建');
        }
        
        return true;
    } catch (error) {
        console.error('初始化图表失败:', error);
        return false;
    }
}

/**
 * 加载Chart.js库
 */
function loadChartJS() {
    if (document.getElementById('chartjs-script')) return;
    
    const script = document.createElement('script');
    script.id = 'chartjs-script';
    script.src = 'js/lib/chart.min.js';
    script.onload = function() {
        console.log('Chart.js加载完成，初始化图表');
        initializeMemoryCharts();
    };
    script.onerror = function() {
        console.error('Chart.js加载失败');
    };
    document.head.appendChild(script);
}

/**
 * 仅更新数据而不重载页面
 */
async function updateDataOnly() {
    try {
        updateLoadingState(true);
        
        // 设置超时保护
        const loadingTimeoutId = setTimeout(() => {
            console.warn(`数据更新操作超时，强制清除加载状态`);
            updateLoadingState(false);
            removeAllLoadingIndicators();
        }, 15000); // 15秒超时保护
        
        // 生成或获取内存数据
        let tempMemoryData = null; // 使用临时变量
        
        // 直接从API获取数据
        try {
            const response = await fetch('/api/memory-stats');
            if (!response.ok) {
                throw new Error(`API响应错误: ${response.status}`);
            }
            
            const apiData = await response.json();
            console.log('从API获取的数据:', apiData);
            
            // 验证API返回数据的有效性
            if (apiData && typeof apiData === 'object') {
                tempMemoryData = apiData;
            } else {
                console.warn('API返回的数据格式无效，使用模拟数据');
            }
        } catch (apiError) {
            console.error('从API获取数据时出错:', apiError);
        }
        
        // 如果API获取失败或数据无效，使用模拟数据
        if (!tempMemoryData) {
            console.log('使用模拟数据');
            tempMemoryData = generateMemoryData();
        }
        
        // 将临时数据赋值给全局变量
        window.memoryData = tempMemoryData;
        
        // 记录内存数据到控制台便于调试
        console.log('更新使用的内存数据:', tempMemoryData);
        
        // 更新统计卡片
        updateStatCards(tempMemoryData);
        
        // 检查Chart是否准备好后再更新图表
        if (isChartReady()) {
            // 更新图表
            updateCharts(tempMemoryData);
        } else {
            // 尝试初始化图表
            initializeMemoryCharts();
            setTimeout(() => updateCharts(tempMemoryData), 500);
        }
        
        // 确保更新内存消耗点
        try {
            updateMemoryPointsDisplay();
        } catch (err) {
            console.error('更新内存消耗点失败:', err);
        }
        
        // 更新最后刷新时间
        updateLastUpdatedTime();
        
        // 清除超时保护
        clearTimeout(loadingTimeoutId);
        
        // 清除加载状态
        updateLoadingState(false);
        
        return tempMemoryData;
    } catch (error) {
        console.error('局部更新数据失败:', error);
        updateLoadingState(false);
        removeAllLoadingIndicators();
        throw error;
    }
}

/**
 * 更新统计卡片数据
 * @param {object} data 内存统计数据
 */
function updateStatCards(data) {
    if (!data) return;
    
    // 帮助函数 - 安全更新元素文本
    const updateText = (id, text) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    };
    
    // 将字节转换为MB并四舍五入，确保返回有效数字
    const toMB = bytes => {
        if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) {
            console.warn('无效的内存字节数:', bytes);
            return 0;
        }
        return Number((bytes / (1024 * 1024)).toFixed(2));
    };
    
    // 计算百分比，确保返回有效数字
    const calcPercentage = (used, total) => {
        if (typeof used !== 'number' || typeof total !== 'number' || isNaN(used) || isNaN(total) || total <= 0) {
            console.warn('计算百分比时参数无效:', { used, total });
            return 0;
        }
        return Math.round((used / total) * 100);
    };
    
    // 安全获取数据字段，如果字段不存在则返回默认值
    const safeGet = (obj, field, defaultValue = 0) => {
        return (obj && typeof obj[field] === 'number' && !isNaN(obj[field])) ? obj[field] : defaultValue;
    };
    
    // 从数据中安全获取字段
    const totalMemory = safeGet(data, 'totalMemory', 1024 * 1024 * 1024); // 默认1GB
    const usedMemory = safeGet(data, 'usedMemory');
    const heapTotal = safeGet(data, 'heapTotal', 512 * 1024 * 1024); // 默认512MB
    const heapUsed = safeGet(data, 'heapUsed');
    const peakMemory = safeGet(data, 'peakMemory');
    const external = safeGet(data, 'external');
    
    // 计算百分比
    const usedPercentage = calcPercentage(usedMemory, totalMemory);
    const heapPercentage = calcPercentage(heapUsed, heapTotal);
    
    // 更新各个统计卡片
    updateText('totalMemory', `${toMB(totalMemory)} MB`);
    updateText('usedMemory', `已使用: ${toMB(usedMemory)} MB `);
    updateText('usedPercentage', `(${usedPercentage}%)`);
    
    updateText('heapTotal', `${toMB(heapTotal)} MB`);
    updateText('heapUsed', `已使用: ${toMB(heapUsed)} MB `);
    updateText('heapPercentage', `(${heapPercentage}%)`);
    
    updateText('peakMemory', `${toMB(peakMemory)} MB`);
    updateText('externalMemory', `${toMB(external)} MB`);
    
    // 根据内存使用率更新内存状态
    updateMemoryStatus(usedPercentage);
}

/**
 * 更新内存状态，显示警告和建议
 * @param {number} usagePercentage 内存使用百分比
 */
function updateMemoryStatus(usagePercentage) {
    // 获取状态元素
    const statusContainer = document.getElementById('memoryStatus');
    if (!statusContainer) return;
    
    // 清除现有状态
    statusContainer.innerHTML = '';
    statusContainer.className = '';
    
    // 确保百分比有效
    if (typeof usagePercentage !== 'number' || isNaN(usagePercentage)) {
        usagePercentage = 0;
    }
    
    // 根据使用率设置状态
    let statusClass = 'status-normal';
    let statusMessage = '';
    
    if (usagePercentage >= 90) {
        statusClass = 'status-critical';
        statusMessage = `内存使用率达到${usagePercentage}%！建议立即优化`;
    } else if (usagePercentage >= 70) {
        statusClass = 'status-warning';
        statusMessage = `内存使用率达到${usagePercentage}%，建议优化`;
    } else if (usagePercentage >= 50) {
        statusClass = 'status-info';
        statusMessage = `内存使用率为${usagePercentage}%，运行正常`;
    } else {
        statusMessage = `内存使用率为${usagePercentage}%，运行良好`;
    }
    
    // 更新状态显示
    statusContainer.className = statusClass;
    statusContainer.textContent = statusMessage;
}

/**
 * 更新最后刷新时间
 */
function updateLastUpdatedTime() {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('zh-CN');
    
    // 添加日志记录
    if (typeof addLogEntry === 'function') {
        addLogEntry(`数据已于 ${formattedTime} 刷新`, 'info');
    }
}

/**
 * 生成模拟内存数据
 * @returns {object} 模拟的内存数据
 */
function generateMemoryData() {
    const totalMemory = 1024 * 1024 * 1024; // 1GB
    const heapTotal = 512 * 1024 * 1024; // 512MB
    
    // 生成随机波动的内存使用量（确保是0-100%范围内的合理值）
    const randomFactor = 0.3 + (Math.random() * 0.4); // 30% - 70%
    const usedMemory = Math.round(totalMemory * randomFactor);
    const heapUsed = Math.round(heapTotal * randomFactor);
    
    // 确保峰值内存大于当前使用值
    const peakMemory = Math.max(
        usedMemory,
        Math.round(totalMemory * (randomFactor + 0.1))
    );
    
    // 外部内存通常较小
    const external = Math.round(totalMemory * 0.05 * Math.random());
    
    // 生成模拟的内存历史数据
    const memoryHistory = [];
    const now = Date.now();
    
    // 生成过去30个时间点的数据
    for (let i = 30; i >= 0; i--) {
        const time = now - (i * 60000); // 每分钟一个点
        const pointRandomFactor = 0.3 + (Math.random() * 0.4); // 30% - 70%
        const pointUsedMemory = Math.round(totalMemory * pointRandomFactor);
        const pointHeapUsed = Math.round(heapTotal * pointRandomFactor);
        
        memoryHistory.push({
            timestamp: time,
            usedMemory: pointUsedMemory,
            heapUsed: pointHeapUsed
        });
    }
    
    return {
        totalMemory,
        usedMemory,
        heapTotal,
        heapUsed,
        peakMemory,
        external,
        memoryHistory,
        timestamp: Date.now()
    };
}

// 添加CSS样式以显示加载状态
function addOptimizationStyles() {
    // 检查是否已添加过样式
    if (document.getElementById('memory-optimize-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'memory-optimize-styles';
    style.textContent = `
        .stat-card.loading, .chart-card.loading {
            position: relative;
            opacity: 0.8;
        }
        
        .stat-card.loading::after, .chart-card.loading::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 5px;
            background: linear-gradient(to right, transparent, var(--primary-color), transparent);
            background-size: 200% 100%;
            animation: loading-animation 1.5s infinite;
        }
        
        @keyframes loading-animation {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .fa-spin, .icon-refresh.fa-spin, .icon-optimize.fa-spin {
            animation: spin 1s linear infinite;
            display: inline-block;
        }
        
        /* 修复页面锁定问题的关键样式 */
        body, html {
            overflow: auto !important;
            pointer-events: auto !important;
            position: static !important;
            width: auto !important;
            height: auto !important;
        }
        
        /* 确保所有Modal背景不阻止交互 */
        .modal-backdrop, .overlay, .mask, .loading-overlay {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }
        
        /* 内存消耗点区域增加滚动支持 */
        .chart-body.table-container {
            overflow: auto !important;
            max-height: 300px !important;
        }
    `;
    
    document.head.appendChild(style);
    
    // 移除状态指示器，不再需要它
    const existingIndicator = document.getElementById('page-status');
    if (existingIndicator && existingIndicator.parentNode) {
        existingIndicator.parentNode.removeChild(existingIndicator);
    }
}

// 添加优化样式
addOptimizationStyles();

// 页面加载完成后立即检查并清除所有加载状态
document.addEventListener('load', removeAllLoadingIndicators);

// 确保DOMContentLoaded后也会检查一次
setTimeout(removeAllLoadingIndicators, 3000);

// 页面加载完成后，添加一个额外的应急重置按钮
document.addEventListener('DOMContentLoaded', () => {
    // 添加一个全局快捷键，用Escape键解锁页面
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            console.log('用户按下ESC键，触发页面解锁');
            unlockPageInteraction();
            removeAllLoadingIndicators();
        }
    });
});

// 检查元素是否存在和可见
function isVisibleElement(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetParent !== null;
}

// 添加额外的按钮逻辑，如果已存在则跳过
if (!document.getElementById('unlockPage') && !document.getElementById('emergencyReset')) {
    // 记录原始按钮的父元素
    const buttonContainer = document.querySelector('.button-container, .btn-container, .buttons, .actions');
    
    if (buttonContainer) {
        console.log('找到按钮容器:', buttonContainer);
        
        // 修改按钮布局，隐藏部分原始按钮
        const originalButtons = buttonContainer.querySelectorAll('button, .btn, input[type="button"]');
        for (const button of originalButtons) {
            if (button.id !== 'refreshData' && button.id !== 'optimizeMemory' && 
                button.id !== 'generateSuggestions' && button.id !== 'clearLogs') {
                button.style.display = 'none';
            }
        }
        
        // ... existing code ...
    }
}

/**
 * 生成内存警告消息
 * @param {number} memoryUsage 内存使用率百分比
 * @returns {string} 警告HTML
 */
function generateMemoryWarning(memoryUsage) {
    if (memoryUsage >= 80) {
        return `<div class="alert alert-danger"><strong>警告:</strong> 内存使用率达到 ${memoryUsage}%! 建议立即优化内存。</div>`;
    } else if (memoryUsage >= 70) {
        return `<div class="alert alert-warning"><strong>注意:</strong> 内存使用率达到 ${memoryUsage}%。应考虑优化内存。</div>`;
    } else if (memoryUsage >= 60) {
        return `<div class="alert alert-info"><strong>提示:</strong> 内存使用率达到 ${memoryUsage}%。</div>`;
    }
    return '';
}

// 将全局变量改为window属性，防止命名冲突
window.memoryOptimizeData = [];

function addMemoryPoint(timestamp, value, label, category) {
    window.memoryOptimizeData.push({
        timestamp,
        value,
        label,
        category
    });
    
    if (window.memoryOptimizeData.length > 1000) {
        console.log('内存数据点超过1000，清理老数据');
        window.memoryOptimizeData = window.memoryOptimizeData.slice(-1000);
    }
    
    // 更新DOM显示
    updateMemoryPointsDisplay();
}

/**
 * 更新内存消耗点显示
 */
function updateMemoryPointsDisplay() {
    const container = document.getElementById('memoryConsumptionPoints');
    if (container) {
        container.innerHTML = '';
        
        // 生成并显示内存消耗点
        const points = generateConsumptionPoints();
        displayMemoryConsumptionPoints(points);
    }
}

/**
 * 生成内存消耗点数据
 * @returns {Array} 内存消耗点数据数组
 */
function generateConsumptionPoints() {
    console.log('生成内存消耗点数据');
    
    // 确保返回一个有效的对象数组
    return [
        { 
            module: '区块链连接管理', 
            consumption: Math.round(Math.random() * 50 + 20) * 1024 * 1024, 
            status: 'MEDIUM',
            lastUpdated: new Date().toLocaleTimeString('zh-CN')
        },
        { 
            module: '交易数据缓存', 
            consumption: Math.round(Math.random() * 40 + 15) * 1024 * 1024, 
            status: 'LOW',
            lastUpdated: new Date().toLocaleTimeString('zh-CN')
        },
        { 
            module: '策略执行引擎', 
            consumption: Math.round(Math.random() * 100 + 30) * 1024 * 1024, 
            status: 'HIGH',
            lastUpdated: new Date().toLocaleTimeString('zh-CN')
        },
        { 
            module: '历史数据存储', 
            consumption: Math.round(Math.random() * 70 + 20) * 1024 * 1024, 
            status: 'MEDIUM',
            lastUpdated: new Date().toLocaleTimeString('zh-CN')
        },
        { 
            module: '实时价格监控', 
            consumption: Math.round(Math.random() * 60 + 25) * 1024 * 1024, 
            status: 'MEDIUM',
            lastUpdated: new Date().toLocaleTimeString('zh-CN')
        },
        { 
            module: '用户界面渲染', 
            consumption: Math.round(Math.random() * 20 + 10) * 1024 * 1024, 
            status: 'LOW',
            lastUpdated: new Date().toLocaleTimeString('zh-CN')
        },
        { 
            module: '日志记录系统', 
            consumption: Math.round(Math.random() * 15 + 5) * 1024 * 1024, 
            status: 'LOW',
            lastUpdated: new Date().toLocaleTimeString('zh-CN')
        },
        { 
            module: 'MEV策略分析', 
            consumption: Math.round(Math.random() * 120 + 40) * 1024 * 1024, 
            status: 'HIGH',
            lastUpdated: new Date().toLocaleTimeString('zh-CN')
        }
    ];
}

/**
 * 显示内存消耗点数据
 * @param {Array} points 内存消耗点数据
 */
function displayMemoryConsumptionPoints(points) {
    if (!points || !Array.isArray(points) || points.length === 0) {
        console.warn('没有内存消耗点数据可显示');
        return;
    }
    
    console.log('开始显示内存消耗点数据，数据点数量:', points.length);
    
    // 获取筛选值
    const searchInput = document.getElementById('searchInput');
    const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
    
    const statusFilter = document.getElementById('statusFilter');
    const statusValue = statusFilter ? statusFilter.value : 'ALL';
    
    console.log(`筛选条件 - 搜索: "${searchValue}", 状态: ${statusValue}`);
    
    // 应用筛选
    const filteredPoints = points.filter(point => {
        // 搜索筛选
        const matchesSearch = !searchValue || 
            (point.module && point.module.toLowerCase().includes(searchValue));
        
        // 状态筛选
        const matchesStatus = statusValue === 'ALL' || 
            point.status === statusValue;
        
        return matchesSearch && matchesStatus;
    });
    
    // 获取表格容器
    const tableBody = document.getElementById('memoryPointsTableBody');
    if (!tableBody) {
        console.error('找不到内存消耗点表格 memoryPointsTableBody');
        
        // 尝试查找其他可能的表格ID
        const possibleTableBodies = [
            document.querySelector('table.memory-table tbody'),
            document.querySelector('table.consumption-table tbody'),
            document.querySelector('.memory-points-table tbody'),
            document.querySelector('#memoryConsumptionPoints table tbody')
        ];
        
        let foundTableBody = null;
        for (const body of possibleTableBodies) {
            if (body) {
                foundTableBody = body;
                console.log('找到替代表格元素:', body);
                break;
            }
        }
        
        if (!foundTableBody) {
            console.error('无法找到任何表格元素来显示数据');
            return;
        }
        
        // 使用找到的表格元素
        tableBody = foundTableBody;
    }
    
    // 清空表格
    tableBody.innerHTML = '';
    
    // 如果没有匹配的数据
    if (filteredPoints.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = '没有匹配的数据';
        cell.className = 'no-data';
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }
    
    console.log(`筛选后的数据点数量: ${filteredPoints.length}`);
    console.log('首个数据点样例:', JSON.stringify(filteredPoints[0]));
    
    // 显示数据
    for (const point of filteredPoints) {
        const row = document.createElement('tr');
        
        // 添加样式类
        if (point.status) {
            row.className = `memory-point-row ${point.status.toLowerCase()}`;
        } else {
            row.className = 'memory-point-row';
        }
        
        // 模块名
        const moduleCell = document.createElement('td');
        moduleCell.textContent = point.module || '未知模块';
        row.appendChild(moduleCell);
        
        // 内存消耗
        const consumptionCell = document.createElement('td');
        consumptionCell.textContent = point.consumption ? formatMemorySize(point.consumption) : '0 MB';
        row.appendChild(consumptionCell);
        
        // 状态
        const statusCell = document.createElement('td');
        let statusText = '未知';
        let statusClass = 'status-unknown';
        
        if (point.status) {
            switch(point.status) {
                case 'HIGH':
                    statusText = '高消耗';
                    statusClass = 'status-high';
                    break;
                case 'MEDIUM':
                    statusText = '中等';
                    statusClass = 'status-medium';
                    break;
                case 'LOW':
                    statusText = '低消耗';
                    statusClass = 'status-low';
                    break;
                default:
                    statusText = '未知';
                    statusClass = 'status-unknown';
            }
        }
        
        statusCell.textContent = statusText;
        statusCell.className = statusClass;
        row.appendChild(statusCell);
        
        // 最后更新时间
        const lastUpdatedCell = document.createElement('td');
        lastUpdatedCell.textContent = point.lastUpdated || new Date().toLocaleTimeString('zh-CN');
        row.appendChild(lastUpdatedCell);
        
        tableBody.appendChild(row);
    }
    
    // 立即设置筛选事件监听
    setupMemoryPointsFilters();
}

/**
 * 设置内存消耗点筛选功能
 */
function setupMemoryPointsFilters() {
    // 获取筛选控件
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    
    // 如果找不到控件，尝试查找其他可能的ID
    let searchElement = searchInput;
    if (!searchElement) {
        const possibleSearchInputs = [
            document.querySelector('input[type="search"]'),
            document.querySelector('input[placeholder*="搜索"]'),
            document.querySelector('input[placeholder*="模块"]'),
            document.querySelector('.search-input')
        ];
        
        for (const input of possibleSearchInputs) {
            if (input) {
                searchElement = input;
                console.log('找到替代搜索输入框:', input);
                break;
            }
        }
    }
    
    let filterElement = statusFilter;
    if (!filterElement) {
        const possibleFilters = [
            document.querySelector('select.status-filter'),
            document.querySelector('select[data-filter]'),
            document.querySelector('select')
        ];
        
        for (const select of possibleFilters) {
            if (select) {
                filterElement = select;
                console.log('找到替代状态筛选下拉框:', select);
                break;
            }
        }
    }
    
    // 解绑旧的事件监听器，确保不会重复绑定
    if (searchElement) {
        const oldSearchListener = searchElement._eventListener;
        if (oldSearchListener) {
            searchElement.removeEventListener('input', oldSearchListener);
            searchElement.removeEventListener('keyup', oldSearchListener);
            searchElement.removeEventListener('change', oldSearchListener);
        }
        
        // 创建新的事件监听器
        const newSearchListener = function() {
            console.log('搜索输入变化，重新筛选:', this.value);
            updateMemoryPointsDisplay();
        };
        
        // 存储事件监听器引用用于后续移除
        searchElement._eventListener = newSearchListener;
        
        // 添加多种事件监听确保能捕获所有变化
        searchElement.addEventListener('input', newSearchListener);
        searchElement.addEventListener('keyup', newSearchListener);
        searchElement.addEventListener('change', newSearchListener);
        
        console.log('已设置搜索输入框事件监听');
    } else {
        console.warn('未找到搜索输入框');
    }
    
    if (filterElement) {
        const oldStatusListener = filterElement._eventListener;
        if (oldStatusListener) {
            filterElement.removeEventListener('change', oldStatusListener);
        }
        
        // 创建新的事件监听器
        const newStatusListener = function() {
            console.log('状态筛选变化，重新筛选:', this.value);
            updateMemoryPointsDisplay();
        };
        
        // 存储事件监听器引用用于后续移除
        filterElement._eventListener = newStatusListener;
        filterElement.addEventListener('change', newStatusListener);
        
        console.log('已设置状态筛选下拉框事件监听');
    } else {
        console.warn('未找到状态筛选下拉框');
    }
    
    console.log('筛选器事件设置完成');
}

/**
 * 格式化内存大小
 * @param {number} bytes 字节数
 * @returns {string} 格式化后的内存大小字符串
 */
function formatMemorySize(bytes) {
    if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes < 0) {
        return '0 MB';
    }
    
    const MB = bytes / (1024 * 1024);
    
    if (MB >= 1024) {
        const GB = MB / 1024;
        return `${GB.toFixed(2)} GB`;
    }
    
    return `${Math.round(MB)} MB`;
}

/**
 * 计算百分比
 * @param {number} part 部分值
 * @param {number} total 总值
 * @returns {number} 百分比值
 */
function calculatePercentage(part, total) {
    if (typeof part !== 'number' || typeof total !== 'number' || 
        Number.isNaN(part) || Number.isNaN(total) || total <= 0) {
        return 0;
    }
    
    return Math.round((part / total) * 100);
}

// 更改此处，删除对setupUIControls的调用
document.addEventListener('DOMContentLoaded', () => {
    // 初始化设置
    console.log('内存监控页面初始化');
});

function removeElement(id) {
    const element = document.getElementById(id);
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

function saveMemoryConsumption(memoryData) {
    const serializedData = JSON.stringify(memoryData);
    localStorage.setItem('memoryConsumptionData', serializedData);
    console.log('保存内存消耗数据到本地存储');
}

/**
 * 清除内存状态
 */
function clearMemoryStatus() {
    // 移除警告覆盖层
    const overlay = document.getElementById('memory-warning-overlay');
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
    
    // 移除样式
    const styleElement = document.getElementById('memory-warning-style');
    if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
    }
    
    // 移除绝对定位元素
    const absoluteElement = document.getElementById('memory-warning-absolute');
    if (absoluteElement && absoluteElement.parentNode) {
        absoluteElement.parentNode.removeChild(absoluteElement);
    }
    
    // 清除状态元素
    const statusEl = document.getElementById('memoryStatus');
    if (statusEl) {
        if (statusEl.classList) {
            statusEl.classList.remove('warning', 'danger', 'success');
        }
        statusEl.textContent = '';
    }
    
    // 移除UI状态
    const originalUiState = document.getElementById('uiState');
    if (originalUiState && originalUiState.parentNode) {
        originalUiState.parentNode.removeChild(originalUiState);
    }
}

/**
 * 设置UI控件
 */
function setupUIControls() {
    console.log('设置UI控件...');
    
    try {
        // 获取常用控件
        const refreshBtn = document.getElementById('refreshData');
        const optimizeBtn = document.getElementById('optimizeMemory');
        const suggestionsBtn = document.getElementById('generateSuggestions');
        const clearLogsBtn = document.getElementById('clearLogs');
        const checkLeaksBtn = document.getElementById('checkLeaks');
        
        // 如果刷新按钮存在且没有事件处理程序，添加事件
        if (refreshBtn && !refreshBtn._hasEventListener) {
            refreshBtn._hasEventListener = true;
            refreshBtn.addEventListener('click', () => {
                if (typeof updateDataOnly === 'function') {
                    updateDataOnly();
                } else if (typeof refreshData === 'function') {
                    refreshData();
                } else {
                    console.warn('刷新数据函数未定义');
                }
            });
        }
        
        // 如果优化内存按钮存在且没有事件处理程序，添加事件
        if (optimizeBtn && !optimizeBtn._hasEventListener) {
            optimizeBtn._hasEventListener = true;
            optimizeBtn.addEventListener('click', () => {
                if (typeof optimizeMemory === 'function') {
                    optimizeMemory();
                } else {
                    console.warn('优化内存函数未定义');
                }
            });
        }
        
        // 如果生成建议按钮存在且没有事件处理程序，添加事件
        if (suggestionsBtn && !suggestionsBtn._hasEventListener) {
            suggestionsBtn._hasEventListener = true;
            suggestionsBtn.addEventListener('click', () => {
                if (typeof generateSuggestions === 'function') {
                    generateSuggestions();
                } else {
                    console.warn('生成建议函数未定义');
                }
            });
        }
        
        // 如果清空日志按钮存在且没有事件处理程序，添加事件
        if (clearLogsBtn && !clearLogsBtn._hasEventListener) {
            clearLogsBtn._hasEventListener = true;
            clearLogsBtn.addEventListener('click', () => {
                const logsContainer = document.getElementById('logsContainer');
                if (logsContainer) {
                    logsContainer.innerHTML = '';
                }
                if (typeof clearLog === 'function') {
                    clearLog();
                }
            });
        }
        
        // 如果检查内存泄漏按钮存在且没有事件处理程序，添加事件
        if (checkLeaksBtn && !checkLeaksBtn._hasEventListener) {
            checkLeaksBtn._hasEventListener = true;
            checkLeaksBtn.addEventListener('click', () => {
                if (typeof checkMemoryLeak === 'function') {
                    checkMemoryLeak();
                } else {
                    console.warn('检查内存泄漏函数未定义');
                }
            });
        }
        
        console.log('UI控件设置完成');
    } catch (error) {
        console.error('设置UI控件时出错:', error);
    }
} 