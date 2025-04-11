// 生成内存优化建议
function generateMemoryOptimizationSuggestions() {
    const suggestions = [
        "关闭长时间未使用的区块链连接可减少内存占用",
        "定期清理缓存的交易数据可提高系统响应速度",
        "减少同时运行的策略数量可降低内存压力",
        "优化大数据量的历史记录存储方式",
        "使用分页加载而非一次性加载所有数据",
        "避免在循环中创建大量临时对象",
        "对不再使用的数据及时进行垃圾回收"
    ];
    
    // 随机选择3-5条建议
    const count = Math.floor(Math.random() * 3) + 3; // 3到5条
    const selectedSuggestions = [];
    const usedIndexes = new Set();
    
    while (selectedSuggestions.length < count && usedIndexes.size < suggestions.length) {
        const index = Math.floor(Math.random() * suggestions.length);
        if (!usedIndexes.has(index)) {
            usedIndexes.add(index);
            selectedSuggestions.push(suggestions[index]);
        }
    }
    
    // 渲染建议到UI
    const suggestionsContainer = document.getElementById('suggestionsContainer');
    if (suggestionsContainer) {
        suggestionsContainer.innerHTML = '';
        
        if (selectedSuggestions.length === 0) {
            suggestionsContainer.innerHTML = '<p class="no-data">目前没有优化建议</p>';
            return;
        }
        
        const ul = document.createElement('ul');
        ul.className = 'suggestions-list';
        
        for (const suggestion of selectedSuggestions) {
            const li = document.createElement('li');
            li.textContent = suggestion;
            ul.appendChild(li);
        }
        
        suggestionsContainer.appendChild(ul);
        addLogEntry('生成了新的内存优化建议', 'info');
    }
}

// 分析内存消耗点
function analyzeMemoryConsumptionPoints() {
    const memoryPoints = [
        { module: '区块链连接管理', usage: Math.floor(Math.random() * 80) + 20, status: 'MEDIUM' },
        { module: '交易数据缓存', usage: Math.floor(Math.random() * 90) + 10, status: 'LOW' },
        { module: '策略执行引擎', usage: Math.floor(Math.random() * 100) + 50, status: 'HIGH' },
        { module: '历史数据存储', usage: Math.floor(Math.random() * 70) + 30, status: 'MEDIUM' },
        { module: '实时价格监控', usage: Math.floor(Math.random() * 60) + 40, status: 'MEDIUM' },
        { module: '用户界面渲染', usage: Math.floor(Math.random() * 40) + 10, status: 'LOW' },
        { module: '日志记录系统', usage: Math.floor(Math.random() * 30) + 10, status: 'LOW' },
        { module: 'MEV策略分析', usage: Math.floor(Math.random() * 120) + 30, status: 'HIGH' }
    ];
    
    // 为每个点分配状态
    for (const point of memoryPoints) {
        if (point.usage < 50) {
            point.status = 'LOW';
        } else if (point.usage < 100) {
            point.status = 'MEDIUM';
        } else {
            point.status = 'HIGH';
        }
    }
    
    // 渲染到表格
    const tableBody = document.getElementById('consumptionPoints');
    if (tableBody) {
        tableBody.innerHTML = '';
        
        if (memoryPoints.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4" class="no-data">没有找到内存消耗点</td>';
            tableBody.appendChild(row);
            return;
        }
        
        for (const point of memoryPoints) {
            const row = document.createElement('tr');
            row.className = `memory-point-row ${point.status.toLowerCase()}`;
            
            const moduleCell = document.createElement('td');
            moduleCell.textContent = point.module;
            
            const usageCell = document.createElement('td');
            usageCell.textContent = `${point.usage} MB`;
            
            const statusCell = document.createElement('td');
            let statusText = '低';
            let statusClass = 'status-low';
            
            if (point.status === 'MEDIUM') {
                statusText = '中';
                statusClass = 'status-medium';
            } else if (point.status === 'HIGH') {
                statusText = '高';
                statusClass = 'status-high';
            }
            
            statusCell.innerHTML = `<span class="status-badge ${statusClass}">${statusText}</span>`;
            
            const updateCell = document.createElement('td');
            const now = new Date();
            updateCell.textContent = now.toLocaleTimeString('zh-CN');
            
            row.appendChild(moduleCell);
            row.appendChild(usageCell);
            row.appendChild(statusCell);
            row.appendChild(updateCell);
            tableBody.appendChild(row);
        }
        
        addLogEntry('更新了内存消耗点分析', 'info');
        
        // 添加搜索和筛选功能
        setupMemoryPointsFilters(memoryPoints);
    }
}

// 设置内存消耗点的搜索和筛选功能
function setupMemoryPointsFilters(memoryPoints) {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    
    if (!searchInput || !statusFilter) return;
    
    const filterPoints = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value;
        
        const tableBody = document.getElementById('consumptionPoints');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        const filteredPoints = memoryPoints.filter(point => {
            const matchesSearch = point.module.toLowerCase().includes(searchTerm);
            const matchesStatus = statusValue === 'ALL' || point.status === statusValue;
            return matchesSearch && matchesStatus;
        });
        
        if (filteredPoints.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4" class="no-data">没有找到匹配的内存消耗点</td>';
            tableBody.appendChild(row);
            return;
        }
        
        for (const point of filteredPoints) {
            const row = document.createElement('tr');
            row.className = `memory-point-row ${point.status.toLowerCase()}`;
            
            const moduleCell = document.createElement('td');
            moduleCell.textContent = point.module;
            
            const usageCell = document.createElement('td');
            usageCell.textContent = `${point.usage} MB`;
            
            const statusCell = document.createElement('td');
            let statusText = '低';
            let statusClass = 'status-low';
            
            if (point.status === 'MEDIUM') {
                statusText = '中';
                statusClass = 'status-medium';
            } else if (point.status === 'HIGH') {
                statusText = '高';
                statusClass = 'status-high';
            }
            
            statusCell.innerHTML = `<span class="status-badge ${statusClass}">${statusText}</span>`;
            
            const updateCell = document.createElement('td');
            const now = new Date();
            updateCell.textContent = now.toLocaleTimeString('zh-CN');
            
            row.appendChild(moduleCell);
            row.appendChild(usageCell);
            row.appendChild(statusCell);
            row.appendChild(updateCell);
            tableBody.appendChild(row);
        }
    };
    
    searchInput.addEventListener('input', filterPoints);
    statusFilter.addEventListener('change', filterPoints);
}

// 刷新内存优化建议
function refreshOptimizationSuggestions() {
    generateMemoryOptimizationSuggestions();
    addLogEntry('刷新了内存优化建议', 'info');
}

// 修改document.addEventListener('DOMContentLoaded', function() {})，添加新功能初始化
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // 初始化内存优化建议和内存消耗点分析
    generateMemoryOptimizationSuggestions();
    analyzeMemoryConsumptionPoints();
    
    // 添加刷新建议按钮事件
    const refreshSuggestionsBtn = document.getElementById('generateSuggestions');
    if (refreshSuggestionsBtn) {
        refreshSuggestionsBtn.addEventListener('click', refreshOptimizationSuggestions);
    }
    
    // ... existing code ...
}); 