/**
 * 设置页面脚本
 * 用于管理系统配置和参数设置
 */

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面
    initPage();
    
    // 加载设置数据
    loadSettings();
    
    // 更新时间
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

/**
 * 初始化页面
 */
function initPage() {
    console.log('初始化设置页面...');
    
    // 绑定设置面板切换事件
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有活动标签
            document.querySelectorAll('.nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            
            // 添加活动标签
            this.classList.add('active');
            
            // 隐藏所有面板
            document.querySelectorAll('.settings-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            
            // 显示目标面板
            const targetPanel = document.getElementById(this.getAttribute('data-target'));
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
    
    // 绑定交易策略类型变化事件 - 显示/隐藏自定义策略选项
    const strategySelect = document.getElementById('tradingStrategy');
    if (strategySelect) {
        strategySelect.addEventListener('change', function() {
            const customOptions = document.getElementById('customStrategyOptions');
            if (customOptions) {
                customOptions.style.display = this.value === 'custom' ? 'block' : 'none';
            }
        });
        
        // 初始隐藏自定义策略选项
        const customOptions = document.getElementById('customStrategyOptions');
        if (customOptions) {
            customOptions.style.display = 'none';
        }
    }
    
    // 绑定保存设置按钮事件
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    
    // 绑定应用设置按钮事件
    document.getElementById('applySettingsBtn').addEventListener('click', applySettings);
    
    // 绑定重置设置按钮事件
    document.getElementById('resetSettingsBtn').addEventListener('click', resetSettings);
    
    // 绑定导出设置按钮事件
    document.getElementById('exportSettingsBtn').addEventListener('click', exportSettings);
    
    // 绑定导入设置按钮事件
    document.getElementById('importSettingsBtn').addEventListener('click', () => {
        document.getElementById('importSettingsModal').style.display = 'block';
    });
    
    // 绑定关闭模态框按钮事件
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('importSettingsModal').style.display = 'none';
        });
    });
    
    // 绑定取消导入按钮事件
    document.getElementById('cancelImportBtn').addEventListener('click', () => {
        document.getElementById('importSettingsModal').style.display = 'none';
    });
    
    // 绑定确认导入按钮事件
    document.getElementById('confirmImportBtn').addEventListener('click', importSettings);
    
    // 绑定系统状态控制
    setupSystemControls();
}

/**
 * 设置系统状态控制
 */
function setupSystemControls() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.getElementById('statusText');
    
    // 启动系统
    startBtn.addEventListener('click', async () => {
        try {
            console.log('正在启动系统...');
            
            // 在实际场景中，这里应该是一个API请求
            // 在这个模拟中，我们仅改变UI状态
            startBtn.disabled = true;
            stopBtn.disabled = false;
            statusIndicator.className = 'status-indicator status-running';
            statusText.textContent = '系统运行中';
            
            // 模拟请求成功
            showToast('系统已成功启动');
        } catch (error) {
            console.error('启动系统失败:', error);
            showError('启动系统失败，请重试');
        }
    });
    
    // 停止系统
    stopBtn.addEventListener('click', async () => {
        try {
            console.log('正在停止系统...');
            
            // 在实际场景中，这里应该是一个API请求
            // 在这个模拟中，我们仅改变UI状态
            startBtn.disabled = false;
            stopBtn.disabled = true;
            statusIndicator.className = 'status-indicator status-stopped';
            statusText.textContent = '系统已停止';
            
            // 模拟请求成功
            showToast('系统已成功停止');
        } catch (error) {
            console.error('停止系统失败:', error);
            showError('停止系统失败，请重试');
        }
    });
}

/**
 * 加载设置
 */
async function loadSettings() {
    console.log('加载设置...');
    
    try {
        // 获取环境配置
        const envConfigElement = document.getElementById('env-config');
        const envConfig = envConfigElement ? JSON.parse(envConfigElement.textContent) : { dataSource: { useMockData: true } };
        const useMockData = envConfig.dataSource.useMockData;
        
        // 如果使用模拟数据，则直接返回默认设置
        if (useMockData) {
            console.log('使用模拟数据');
            const mockSettings = {
                botName: 'Solana MEV机器人',
                logLevel: 'info',
                maxMemory: 2048,
                operationMode: 'auto',
                enableStats: true,
                
                primaryRpc: 'https://api.mainnet-beta.solana.com',
                backupRpc: 'https://solana-api.projectserum.com',
                wsEndpoint: 'wss://api.mainnet-beta.solana.com',
                connectionTimeout: 5000,
                useJitoRelay: false,
                jitoRelayUrl: 'https://relay.jito.wtf/relay'
            };
            
            populateForm(mockSettings);
            return;
        }
        
        // 尝试从API服务器加载设置
        const response = await fetch('/api/settings');
        
        // 检查响应类型
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("API服务器响应格式错误，请确认API服务器正常运行");
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '加载设置失败');
        }
        
        // 获取设置数据
        const settings = await response.json();
        
        // 填充表单
        populateForm(settings);
        
        console.log('设置数据加载完成');
    } catch (error) {
        console.error('加载设置数据失败:', error);
        
        // 根据错误类型提供更具体的错误信息
        if (error instanceof SyntaxError) {
            showError('API响应格式错误：可能API服务器未正确启动，请尝试重启API服务器');
        } else if (error.message.includes('Failed to fetch')) {
            showError('无法连接到API服务器：请确认API服务器正在运行');
        } else {
            showError(`加载设置失败: ${error.message}`);
        }
        
        // 出错时使用默认设置
        const defaultSettings = {
            botName: 'Solana MEV机器人',
            logLevel: 'info',
            maxMemory: 2048,
            operationMode: 'auto',
            enableStats: true,
            
            primaryRpc: 'https://api.mainnet-beta.solana.com',
            backupRpc: 'https://solana-api.projectserum.com',
            wsEndpoint: 'wss://api.mainnet-beta.solana.com',
            connectionTimeout: 5000,
            useJitoRelay: false,
            jitoRelayUrl: 'https://relay.jito.wtf/relay'
        };
        
        populateForm(defaultSettings);
    }
}

/**
 * 填充表单
 * @param {Object} settings 设置数据
 */
function populateForm(settings) {
    // 基本设置
    document.getElementById('botName').value = settings.botName || '';
    document.getElementById('logLevel').value = settings.logLevel || 'info';
    document.getElementById('maxMemory').value = settings.maxMemory || '';
    
    // 操作模式
    const operationModeRadios = document.querySelectorAll('input[name="operationMode"]');
    operationModeRadios.forEach(radio => {
        radio.checked = radio.value === settings.operationMode;
    });
    
    document.getElementById('enableStats').checked = settings.enableStats !== false;
    
    // 网络配置
    document.getElementById('primaryRpc').value = settings.primaryRpc || '';
    document.getElementById('backupRpc').value = settings.backupRpc || '';
    document.getElementById('wsEndpoint').value = settings.wsEndpoint || '';
    document.getElementById('connectionTimeout').value = settings.connectionTimeout || '';
    document.getElementById('useJitoRelay').checked = settings.useJitoRelay === true;
    document.getElementById('jitoRelayUrl').value = settings.jitoRelayUrl || '';
}

/**
 * 保存设置
 */
async function saveSettings() {
    try {
        console.log('保存设置...');
        
        // 收集设置
        const settings = collectSettings();
        
        // 将设置保存到API
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '保存设置失败');
        }
        
        showToast('设置已成功保存');
    } catch (error) {
        console.error('保存设置失败:', error);
        showError('保存设置失败: ' + error.message);
    }
}

/**
 * 应用设置
 */
async function applySettings() {
    try {
        console.log('应用设置...');
        
        // 收集设置
        const settings = collectSettings();
        
        // 将设置应用到系统
        const response = await fetch('/api/settings/apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '应用设置失败');
        }
        
        showToast('设置已成功应用');
    } catch (error) {
        console.error('应用设置失败:', error);
        showError('应用设置失败: ' + error.message);
    }
}

/**
 * 收集设置
 * @returns {Object} 收集的设置数据
 */
function collectSettings() {
    // 基本设置
    const botName = document.getElementById('botName').value;
    const logLevel = document.getElementById('logLevel').value;
    const maxMemory = document.getElementById('maxMemory').value;
    
    // 操作模式
    let operationMode = 'auto';
    const operationModeRadios = document.querySelectorAll('input[name="operationMode"]');
    operationModeRadios.forEach(radio => {
        if (radio.checked) {
            operationMode = radio.value;
        }
    });
    
    const enableStats = document.getElementById('enableStats').checked;
    
    // 网络配置
    const primaryRpc = document.getElementById('primaryRpc').value;
    const backupRpc = document.getElementById('backupRpc').value;
    const wsEndpoint = document.getElementById('wsEndpoint').value;
    const connectionTimeout = document.getElementById('connectionTimeout').value;
    const useJitoRelay = document.getElementById('useJitoRelay').checked;
    const jitoRelayUrl = document.getElementById('jitoRelayUrl').value;
    
    return {
        botName,
        logLevel,
        maxMemory,
        operationMode,
        enableStats,
        
        primaryRpc,
        backupRpc,
        wsEndpoint,
        connectionTimeout,
        useJitoRelay,
        jitoRelayUrl
    };
}

/**
 * 重置设置
 */
function resetSettings() {
    if (confirm('确定要将所有设置重置为默认值吗？此操作不可撤销。')) {
        console.log('重置设置...');
        
        // 在实际场景中，这里应该加载默认设置
        // 在这个例子中，我们重新加载设置
        loadSettings();
        
        showToast('设置已重置为默认值');
    }
}

/**
 * 导出设置
 */
function exportSettings() {
    console.log('导出设置...');
    
    // 收集设置
    const settings = collectSettings();
    
    // 创建JSON
    const settingsJson = JSON.stringify(settings, null, 2);
    
    // 创建下载链接
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solana_mev_settings_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
    
    showToast('设置已导出');
}

/**
 * 导入设置
 */
function importSettings() {
    console.log('导入设置...');
    
    try {
        // 获取文件或文本
        const fileInput = document.getElementById('importSettingsFile');
        const textInput = document.getElementById('importSettingsText');
        
        if (fileInput.files.length > 0) {
            // 从文件导入
            const file = fileInput.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const settings = JSON.parse(e.target.result);
                    populateForm(settings);
                    document.getElementById('importSettingsModal').style.display = 'none';
                    showToast('设置已从文件导入');
                } catch (error) {
                    showError('文件格式无效');
                }
            };
            
            reader.readAsText(file);
        } else if (textInput.value.trim()) {
            // 从文本导入
            try {
                const settings = JSON.parse(textInput.value);
                populateForm(settings);
                document.getElementById('importSettingsModal').style.display = 'none';
                showToast('设置已从文本导入');
            } catch (error) {
                showError('JSON格式无效');
            }
        } else {
            showError('请选择文件或输入JSON');
        }
    } catch (error) {
        console.error('导入设置失败:', error);
        showError('导入设置失败');
    }
}

/**
 * 显示错误消息
 * @param {string} message 错误消息
 */
function showError(message) {
    // 创建通知元素
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '1000';
        notification.style.color = 'white';
        document.body.appendChild(notification);
    }
    
    notification.style.backgroundColor = '#ef476f';
    notification.textContent = message;
    notification.style.display = 'block';
    
    // 3秒后隐藏
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

/**
 * 显示成功消息
 * @param {string} message 成功消息
 */
function showToast(message) {
    // 创建通知元素
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '1000';
        notification.style.color = 'white';
        document.body.appendChild(notification);
    }
    
    notification.style.backgroundColor = '#06d6a0';
    notification.textContent = message;
    notification.style.display = 'block';
    
    // 3秒后隐藏
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}
