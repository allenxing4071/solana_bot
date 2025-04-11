/**
 * Solana MEV机器人 - 设置页面JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // 初始化选项卡切换
  initTabs();
  
  // 初始化表单控件事件
  initFormControls();
  
  // 初始化模态框事件
  initModalEvents();
  
  // 初始化按钮事件
  initButtonEvents();
  
  // 加载设置数据
  loadSettings();
});

/**
 * 初始化设置选项卡切换功能
 */
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // 切换活动选项卡按钮
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // 切换活动内容区域
      tabContents.forEach(content => {
        if (content.id === targetTab) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });
}

/**
 * 初始化表单控件相关事件
 */
function initFormControls() {
  // 处理复选框依赖关系
  const autoRefresh = document.getElementById('autoRefresh');
  const refreshInterval = document.getElementById('refreshInterval');
  
  if (autoRefresh && refreshInterval) {
    autoRefresh.addEventListener('change', () => {
      refreshInterval.disabled = !autoRefresh.checked;
    });
    
    // 初始状态
    refreshInterval.disabled = !autoRefresh.checked;
  }
  
  // 处理通知设置依赖关系
  const enableNotifications = document.getElementById('enableNotifications');
  const notificationChannels = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
  const notificationInputs = document.querySelectorAll('#emailAddress, #telegramBotToken, #telegramChatId, #webhookUrl');
  
  if (enableNotifications) {
    enableNotifications.addEventListener('change', () => {
      const isEnabled = enableNotifications.checked;
      
      // 控制通知渠道复选框
      notificationChannels.forEach(checkbox => {
        checkbox.disabled = !isEnabled;
      });
      
      // 控制通知相关输入框
      notificationInputs.forEach(input => {
        input.disabled = !isEnabled;
      });
    });
    
    // 初始状态
    const isEnabled = enableNotifications.checked;
    notificationChannels.forEach(checkbox => {
      checkbox.disabled = !isEnabled;
    });
    notificationInputs.forEach(input => {
      input.disabled = !isEnabled;
    });
  }
  
  // API密钥显示/隐藏切换
  const apiKeyInput = document.getElementById('apiKey');
  const showApiKeyBtn = document.getElementById('showApiKey');
  
  if (apiKeyInput && showApiKeyBtn) {
    let isShown = false;
    
    showApiKeyBtn.addEventListener('click', () => {
      if (isShown) {
        apiKeyInput.type = 'password';
        apiKeyInput.value = '●●●●●●●●●●●●●●●●';
        showApiKeyBtn.innerHTML = '<i class="ri-eye-line"></i>';
      } else {
        apiKeyInput.type = 'text';
        apiKeyInput.value = 'api_' + generateRandomString(24);
        showApiKeyBtn.innerHTML = '<i class="ri-eye-off-line"></i>';
      }
      isShown = !isShown;
    });
  }
  
  // 启用调试模式处理
  const enableDebugMode = document.getElementById('enableDebugMode');
  const logLevel = document.getElementById('logLevel');
  
  if (enableDebugMode && logLevel) {
    enableDebugMode.addEventListener('change', () => {
      if (enableDebugMode.checked) {
        logLevel.value = 'debug';
      } else if (logLevel.value === 'debug' || logLevel.value === 'trace') {
        logLevel.value = 'info';
      }
    });
  }
}

/**
 * 初始化模态框相关事件
 */
function initModalEvents() {
  // 修改密码模态框
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const closePasswordModalBtn = document.getElementById('closePasswordModalBtn');
  const cancelPasswordChangeBtn = document.getElementById('cancelPasswordChangeBtn');
  const confirmPasswordChangeBtn = document.getElementById('confirmPasswordChangeBtn');
  const passwordModal = document.getElementById('changePasswordModal');
  
  // 打开修改密码模态框
  if (changePasswordBtn && passwordModal) {
    changePasswordBtn.addEventListener('click', () => {
      toggleModal('changePasswordModal', true);
    });
  }
  
  // 关闭修改密码模态框
  if (closePasswordModalBtn && cancelPasswordChangeBtn && passwordModal) {
    closePasswordModalBtn.addEventListener('click', () => {
      toggleModal('changePasswordModal', false);
    });
    
    cancelPasswordChangeBtn.addEventListener('click', () => {
      toggleModal('changePasswordModal', false);
    });
  }
  
  // 确认修改密码
  if (confirmPasswordChangeBtn) {
    confirmPasswordChangeBtn.addEventListener('click', () => {
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      // 简单验证
      if (!currentPassword) {
        showNotification('错误', '请输入当前密码', 'error');
        return;
      }
      
      if (!newPassword) {
        showNotification('错误', '请输入新密码', 'error');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        showNotification('错误', '两次输入的密码不一致', 'error');
        return;
      }
      
      // 假设密码修改成功
      toggleModal('changePasswordModal', false);
      showNotification('成功', '密码修改成功', 'success');
      
      // 清空表单
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
    });
  }
}

/**
 * 初始化按钮事件
 */
function initButtonEvents() {
  // 测试连接按钮
  const testConnectionBtn = document.getElementById('testConnectionBtn');
  if (testConnectionBtn) {
    testConnectionBtn.addEventListener('click', () => {
      const rpcEndpoint = document.getElementById('rpcEndpoint').value;
      
      if (!rpcEndpoint) {
        showNotification('错误', '请先输入RPC端点', 'error');
        return;
      }
      
      // 模拟测试连接
      testConnectionBtn.disabled = true;
      testConnectionBtn.innerHTML = '<i class="ri-loader-line ri-spin"></i> 正在连接...';
      
      setTimeout(() => {
        testConnectionBtn.disabled = false;
        testConnectionBtn.innerHTML = '<i class="ri-radar-line"></i> 测试连接';
        
        // 假设连接成功
        showNotification('成功', '连接成功，延迟: 42ms', 'success');
      }, 1500);
    });
  }
  
  // 重新生成API密钥按钮
  const regenerateApiKeyBtn = document.getElementById('regenerateApiKey');
  if (regenerateApiKeyBtn) {
    regenerateApiKeyBtn.addEventListener('click', () => {
      if (confirm('确定要重新生成API密钥吗？这将使现有的API密钥失效。')) {
        showNotification('成功', 'API密钥已重新生成', 'success');
      }
    });
  }
  
  // 发送测试通知按钮
  const testNotificationBtn = document.getElementById('testNotificationBtn');
  if (testNotificationBtn) {
    testNotificationBtn.addEventListener('click', () => {
      const enableNotifications = document.getElementById('enableNotifications').checked;
      
      if (!enableNotifications) {
        showNotification('警告', '请先启用通知功能', 'warning');
        return;
      }
      
      testNotificationBtn.disabled = true;
      testNotificationBtn.innerHTML = '<i class="ri-loader-line ri-spin"></i> 发送中...';
      
      setTimeout(() => {
        testNotificationBtn.disabled = false;
        testNotificationBtn.innerHTML = '<i class="ri-notification-line"></i> 发送测试通知';
        
        showNotification('成功', '测试通知已发送', 'success');
      }, 1000);
    });
  }
  
  // 导出配置按钮
  const exportConfigBtn = document.getElementById('exportConfigBtn');
  if (exportConfigBtn) {
    exportConfigBtn.addEventListener('click', () => {
      const dummyConfig = {
        system: {
          name: document.getElementById('systemName').value,
          language: document.getElementById('language').value,
          timezone: document.getElementById('timezone').value,
          theme: document.getElementById('theme').value,
          autoRefresh: document.getElementById('autoRefresh').checked,
          refreshInterval: parseInt(document.getElementById('refreshInterval').value)
        },
        network: {
          rpcEndpoint: document.getElementById('rpcEndpoint').value,
          fallbackRpc: document.getElementById('fallbackRpc').value,
          connectionTimeout: parseInt(document.getElementById('connectionTimeout').value),
          useWebsocket: document.getElementById('useWebsocket').checked,
          networkEnvironment: document.getElementById('networkEnvironment').value
        },
        // ... 其他配置
        timestamp: new Date().toISOString()
      };
      
      // 创建下载链接
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dummyConfig, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "solana_mev_config.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    });
  }
  
  // 导入配置按钮
  const importConfigBtn = document.getElementById('importConfigBtn');
  if (importConfigBtn) {
    importConfigBtn.addEventListener('click', () => {
      showNotification('提示', '导入功能尚未实现', 'info');
    });
  }
  
  // 保存设置按钮
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      saveSettings();
    });
  }
  
  // 重置设置按钮
  const resetSettingsBtn = document.getElementById('resetSettingsBtn');
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', () => {
      if (confirm('确定要重置所有设置吗？这将恢复默认设置。')) {
        resetSettings();
      }
    });
  }
}

/**
 * 加载设置数据
 */
function loadSettings() {
  // 这里只是模拟加载设置
  // 在实际应用中，应该从服务器或本地存储加载设置
  
  // 假设加载成功
  showNotification('信息', '设置已加载', 'info');
}

/**
 * 保存设置数据
 */
function saveSettings() {
  // 收集所有输入的值
  // 这里只是模拟保存设置
  // 在实际应用中，应该保存到服务器或本地存储
  
  // 假设保存成功
  showNotification('成功', '设置已保存', 'success');
}

/**
 * 重置设置为默认值
 */
function resetSettings() {
  // 重置表单元素值为默认值
  // 通用设置
  document.getElementById('systemName').value = 'Solana MEV机器人';
  document.getElementById('language').value = 'zh-CN';
  document.getElementById('timezone').value = 'UTC+8';
  document.getElementById('theme').value = 'dark';
  document.getElementById('autoRefresh').checked = true;
  document.getElementById('refreshInterval').value = '30';
  
  // 网络设置
  document.getElementById('rpcEndpoint').value = 'https://api.mainnet-beta.solana.com';
  document.getElementById('fallbackRpc').value = 'https://solana-api.projectserum.com';
  document.getElementById('connectionTimeout').value = '10000';
  document.getElementById('useWebsocket').checked = true;
  document.getElementById('networkEnvironment').value = 'mainnet';
  
  // ... 其他设置重置
  
  // 使表单控件随着复选框状态更新
  const autoRefresh = document.getElementById('autoRefresh');
  const refreshInterval = document.getElementById('refreshInterval');
  if (autoRefresh && refreshInterval) {
    refreshInterval.disabled = !autoRefresh.checked;
  }
  
  showNotification('成功', '设置已重置为默认值', 'success');
}

/**
 * 生成指定长度的随机字符串
 * @param {number} length - 随机字符串长度
 * @returns {string} - 生成的随机字符串
 */
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
} 