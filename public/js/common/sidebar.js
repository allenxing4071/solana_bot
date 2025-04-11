/**
 * 侧边栏组件
 * 用于在所有页面中插入统一的侧边栏导航
 */

// 在DOM加载完成后初始化侧边栏
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
});

/**
 * 初始化侧边栏
 * 将统一的侧边栏HTML插入到所有页面中
 */
function initSidebar() {
    // 获取侧边栏容器
    const sidebarContainer = document.querySelector('.sidebar');
    
    if (!sidebarContainer) {
        console.warn('未找到侧边栏容器元素');
        return;
    }
    
    // 获取当前页面的URL路径，用于确定哪个导航项是活动状态
    const currentPath = window.location.pathname;
    const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    
    // 侧边栏HTML模板
    const sidebarHTML = `
        <div class="sidebar-header">
            <img src="img/logo.svg" alt="Logo" class="logo">
            <h2>Solana MEV机器人</h2>
        </div>
        <div class="sidebar-content">
            <!-- 导航菜单 -->
            <nav class="sidebar-nav">
                <ul>
                    <li${pageName === 'index.html' || pageName === '' ? ' class="active"' : ''}><a href="index.html"><i class="icon-dashboard"></i> 仪表盘</a></li>
                    <li${pageName === 'pools.html' ? ' class="active"' : ''}><a href="pools.html"><i class="icon-pools"></i> 流动性池</a></li>
                    <li${pageName === 'tokens.html' ? ' class="active"' : ''}><a href="tokens.html"><i class="icon-tokens"></i> 代币监控</a></li>
                    <li${pageName === 'trades.html' ? ' class="active"' : ''}><a href="trades.html"><i class="icon-trades"></i> 交易记录</a></li>
                    <li${pageName === 'memory.html' ? ' class="active"' : ''}><a href="memory.html"><i class="icon-memory"></i> 内存监控</a></li>
                    <li${pageName === 'settings.html' ? ' class="active"' : ''}><a href="settings.html"><i class="icon-settings"></i> 设置</a></li>
                </ul>
            </nav>
            
            <!-- 系统状态 - 位于底部 -->
            <div class="status-wrapper">
                <div class="bot-status">
                    <span class="status-indicator status-stopped"></span>
                    <span id="statusText">系统已停止</span>
                </div>
                <div class="bot-controls">
                    <button class="btn btn-primary btn-sm" id="startBtn">
                        <i class="icon-play"></i>
                        启动
                    </button>
                    <button class="btn btn-danger btn-sm" id="stopBtn" disabled>
                        <i class="icon-stop"></i>
                        停止
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 替换侧边栏内容
    sidebarContainer.innerHTML = sidebarHTML;
    
    // 绑定系统控制按钮事件（如果common.js已经包含这部分功能，可以省略）
    bindSystemControls();
}

/**
 * 绑定系统控制按钮事件
 */
function bindSystemControls() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.getElementById('statusText');
    
    if (!startBtn || !stopBtn) return;
    
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
            
            // 如果存在showToast函数（在common.js中定义），则显示成功消息
            if (typeof showToast === 'function') {
                showToast('系统已成功启动');
            }
        } catch (error) {
            console.error('启动系统失败:', error);
            if (typeof showError === 'function') {
                showError('启动系统失败，请重试');
            }
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
            
            // 如果存在showToast函数（在common.js中定义），则显示成功消息
            if (typeof showToast === 'function') {
                showToast('系统已成功停止');
            }
        } catch (error) {
            console.error('停止系统失败:', error);
            if (typeof showError === 'function') {
                showError('停止系统失败，请重试');
            }
        }
    });
} 