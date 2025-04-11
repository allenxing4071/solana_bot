/**
 * 获取内存数据 - 真实API版本
 */
async function fetchMemoryData() {
    try {
        showLoading();
        
        try {
            // 调用真实的API获取数据
            const response = await fetch('/api/system/status');
            
            if (!response.ok) {
                throw new Error(`API错误: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data) {
                throw new Error('API返回空数据');
            }
            
            // 提取并转换API返回的内存数据
            const memUsage = data.memoryDetails || {};
            const v8Stats = data.v8Stats || {};
            const memHistory = data.memoryHistory || [];
            
            // 转换为MB
            const totalMemory = Math.round(v8Stats.heapSizeLimit / (1024 * 1024));
            const heapTotal = Math.round(memUsage.heapTotal / (1024 * 1024));
            const heapUsed = Math.round(memUsage.heapUsed / (1024 * 1024));
            const externalMemory = Math.round(memUsage.external / (1024 * 1024));
            const rssMemory = Math.round(memUsage.rss / (1024 * 1024));
            
            // 计算百分比
            const heapPercentage = Math.round((heapUsed / heapTotal) * 100);
            const usedPercentage = Math.round(data.memory); // API直接返回内存使用百分比
            
            // 更新UI
            document.getElementById('totalMemory').textContent = `${totalMemory} MB`;
            document.getElementById('usedMemory').textContent = `已使用: ${rssMemory} MB`;
            document.getElementById('usedPercentage').textContent = `(${usedPercentage}%)`;
            
            document.getElementById('heapTotal').textContent = `${heapTotal} MB`;
            document.getElementById('heapUsed').textContent = `已使用: ${heapUsed} MB`;
            document.getElementById('heapPercentage').textContent = `(${heapPercentage}%)`;
            
            // 峰值内存 - 从历史记录中获取最大值
            const peakMemory = memHistory.reduce((max, current) => 
                Math.max(max, Math.round(current.value * totalMemory / 100)), rssMemory);
            document.getElementById('peakMemory').textContent = `${peakMemory} MB`;
            
            document.getElementById('externalMemory').textContent = `${externalMemory} MB`;
            
            // 更新图表
            updateMemoryCharts(rssMemory, heapUsed, heapTotal);
            
            // 更新内存消耗点列表 - 使用API返回的真实消费者数据
            const consumers = data.consumers || [];
            updateRealConsumptionPoints(consumers);
            
            // 根据API返回的数据生成优化建议
            generateRealSuggestions(data);
            
            // 添加日志
            addLogEntry('内存数据已从API更新', 'info');
            
            // 更新最后更新时间
            document.getElementById('memoryChartUpdate').textContent = 
                `最后更新: ${new Date().toLocaleTimeString()}`;
            document.getElementById('heapChartUpdate').textContent = 
                `最后更新: ${new Date().toLocaleTimeString()}`;
                
        } catch (apiError) {
            console.error('API请求失败:', apiError);
            addLogEntry(`API请求失败: ${apiError.message}`, 'error');
            
            // 回退到模拟数据以防止UI空白
            const totalMemory = 8000;
            const usedMemory = 3000;
            const usedPercentage = Math.round((usedMemory / totalMemory) * 100);
            
            const heapTotal = 4000;
            const heapUsed = 2000;
            const heapPercentage = Math.round((heapUsed / heapTotal) * 100);
            
            const peakMemory = 5500;
            const externalMemory = 800;
            
            // 更新UI
            document.getElementById('totalMemory').textContent = `${totalMemory} MB`;
            document.getElementById('usedMemory').textContent = `已使用: ${usedMemory} MB`;
            document.getElementById('usedPercentage').textContent = `(${usedPercentage}%)`;
            
            document.getElementById('heapTotal').textContent = `${heapTotal} MB`;
            document.getElementById('heapUsed').textContent = `已使用: ${heapUsed} MB`;
            document.getElementById('heapPercentage').textContent = `(${heapPercentage}%)`;
            
            document.getElementById('peakMemory').textContent = `${peakMemory} MB`;
            document.getElementById('externalMemory').textContent = `${externalMemory} MB`;
            
            // 更新图表
            updateMemoryCharts(usedMemory, heapUsed, heapTotal);
            
            // 更新内存消耗点列表
            updateConsumptionPoints();
            
            // 生成优化建议
            generateSuggestions();
        }
        
        hideLoading();
    } catch (error) {
        console.error('获取内存数据失败:', error);
        showError('获取内存数据失败: ' + error.message);
        hideLoading();
    }
}

/**
 * 更新内存消耗点 - 真实数据版本
 */
function updateRealConsumptionPoints(consumers) {
    const consumptionPointsElement = document.getElementById('consumptionPoints');
    if (!consumptionPointsElement) return;
    
    // 获取搜索和筛选值
    const searchQuery = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('statusFilter')?.value || 'ALL';
    
    // 转换API数据格式为显示格式
    const modules = consumers.map(consumer => {
        // 确定状态
        let status = 'LOW';
        if (consumer.memoryUsage >= 70) status = 'HIGH';
        else if (consumer.memoryUsage >= 40) status = 'MEDIUM';
        
        return {
            name: consumer.name,
            usage: `${Math.round(consumer.memoryUsage)}%`,
            status: status,
            lastUpdate: new Date(consumer.lastCleanup || Date.now()).toLocaleTimeString()
        };
    });
    
    // 筛选模块
    const filteredModules = modules.filter(module => {
        // 搜索筛选
        const matchesSearch = searchQuery === '' || 
                            module.name.toLowerCase().includes(searchQuery);
        
        // 状态筛选
        const matchesStatus = statusFilter === 'ALL' || 
                            module.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    // 生成HTML
    let html = '';
    for (const module of filteredModules) {
        html += `
            <tr>
                <td>${module.name}</td>
                <td>${module.usage}</td>
                <td><span class="status-badge status-${module.status}">${getStatusText(module.status)}</span></td>
                <td>${module.lastUpdate}</td>
            </tr>
        `;
    }
    
    // 如果没有结果，显示提示信息
    if (filteredModules.length === 0) {
        html = `
            <tr>
                <td colspan="4" class="text-center">没有找到匹配的内存消耗点</td>
            </tr>
        `;
    }
    
    consumptionPointsElement.innerHTML = html;
}

/**
 * 生成真实的优化建议 - 基于API数据
 */
function generateRealSuggestions(data) {
    const suggestionsContainer = document.getElementById('suggestionsContainer');
    if (!suggestionsContainer) return;
    
    // 清空现有建议
    suggestionsContainer.innerHTML = '';
    
    // 基于内存使用率生成建议
    const memoryUsage = data.memory || 0;
    const heapUsage = data.memoryDetails?.heapUsed / data.memoryDetails?.heapTotal * 100 || 0;
    
    // 添加基本内存使用建议
    if (memoryUsage > 80) {
        addOptimizationSuggestion('系统内存使用率过高，建议进行优化', 'warning');
    } else if (memoryUsage > 60) {
        addOptimizationSuggestion('系统内存使用处于中等水平，可考虑适当优化', 'info');
    } else {
        addOptimizationSuggestion('系统内存使用处于健康水平', 'success');
    }
    
    // 添加堆内存使用建议
    if (heapUsage > 85) {
        addOptimizationSuggestion('JavaScript堆内存使用率过高，可能存在内存泄漏', 'danger');
    } else if (heapUsage > 70) {
        addOptimizationSuggestion('JavaScript堆内存使用率较高，建议检查内存使用', 'warning');
    }
    
    // 添加垃圾回收建议
    const gcCount = data.optimization?.gcCount || 0;
    if (gcCount > 10) {
        addOptimizationSuggestion('垃圾回收频率较高，可能影响性能', 'warning');
    }
    
    // 添加泄漏警告
    const leakWarnings = data.optimization?.leakWarnings || 0;
    if (leakWarnings > 0) {
        addOptimizationSuggestion(`检测到${leakWarnings}个可能的内存泄漏点，建议检查`, 'danger');
    }
    
    // 消费者相关建议
    const highConsumers = (data.consumers || []).filter(c => c.memoryUsage > 70);
    if (highConsumers.length > 0) {
        const names = highConsumers.map(c => c.name).join('、');
        addOptimizationSuggestion(`以下模块内存消耗较高：${names}`, 'warning');
    }
    
    // 如果没有添加任何建议，添加一个默认建议
    if (suggestionsContainer.children.length === 0) {
        addOptimizationSuggestion('系统内存状态良好，暂无优化建议', 'success');
    }
}

/**
 * 优化内存 - 真实API版本
 */
async function optimizeMemory() {
    try {
        // 显示加载指示器
        showLoading();
        
        addLogEntry('正在执行内存优化...', 'info');
        
        try {
            // 调用真实的API进行内存优化
            const response = await fetch('/api/system/optimize-memory', {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error(`API错误: ${response.status}`);
            }
            
            const result = await response.json();
            
            // 显示优化结果
            addLogEntry(`内存优化完成: ${result.message}`, 'success');
            
            // 重新获取内存数据
            setTimeout(() => fetchMemoryData(), 1000);
            
        } catch (apiError) {
            console.error('API请求失败:', apiError);
            addLogEntry(`内存优化失败: ${apiError.message}`, 'error');
        }
        
        hideLoading();
    } catch (error) {
        console.error('内存优化失败:', error);
        addLogEntry(`内存优化失败: ${error.message}`, 'error');
        hideLoading();
    }
}

/**
 * 内存泄漏检测 - 真实API版本
 */
async function checkMemoryLeaks() {
    const leaksContainer = document.getElementById('leaksContainer');
    if (!leaksContainer) return;
    
    leaksContainer.innerHTML = '<div class="log-loading">检测中...</div>';
    
    try {
        // 获取最新的系统状态数据，包含泄漏信息
        const response = await fetch('/api/system/status');
        
        if (!response.ok) {
            throw new Error(`API错误: ${response.status}`);
        }
        
        const data = await response.json();
        const leakWarnings = data.optimization?.leakWarnings || 0;
        const consumers = data.consumers || [];
        
        // 清空容器
        leaksContainer.innerHTML = '';
        
        // 显示检测结果
        if (leakWarnings > 0) {
            // 查找可能存在泄漏的消费者
            const suspectConsumers = consumers.filter(c => 
                c.status.includes('泄漏') || c.memoryUsage > 80);
            
            // 添加泄漏检测结果
            for (const consumer of suspectConsumers) {
                const entryDiv = document.createElement('div');
                entryDiv.className = 'log-entry warning';
                entryDiv.innerHTML = `
                    <span class="timestamp">${new Date().toLocaleTimeString()}</span>
                    <span class="module">${consumer.name}:</span>
                    <span class="message">可能存在内存泄漏，内存使用率: ${Math.round(consumer.memoryUsage)}%</span>
                `;
                leaksContainer.appendChild(entryDiv);
            }
            
            // 添加总结
            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'log-entry danger';
            summaryDiv.innerHTML = `
                <span class="timestamp">${new Date().toLocaleTimeString()}</span>
                <span class="message">检测完成，发现${leakWarnings}个可能的内存问题</span>
            `;
            leaksContainer.appendChild(summaryDiv);
        } else {
            // 没有发现泄漏
            const entryDiv = document.createElement('div');
            entryDiv.className = 'log-entry success';
            entryDiv.innerHTML = `
                <span class="timestamp">${new Date().toLocaleTimeString()}</span>
                <span class="message">检测完成，未发现内存泄漏问题</span>
            `;
            leaksContainer.appendChild(entryDiv);
        }
        
        addLogEntry('内存泄漏检测完成', 'info');
        
    } catch (error) {
        console.error('内存泄漏检测失败:', error);
        
        // 显示错误
        leaksContainer.innerHTML = '';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'log-entry error';
        errorDiv.innerHTML = `
            <span class="timestamp">${new Date().toLocaleTimeString()}</span>
            <span class="message">检测失败: ${error.message}</span>
        `;
        leaksContainer.appendChild(errorDiv);
        
        addLogEntry(`内存泄漏检测失败: ${error.message}`, 'error');
    }
} 