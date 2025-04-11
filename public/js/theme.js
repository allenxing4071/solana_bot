/**
 * 主题设置脚本
 * 已禁用主题切换功能，系统默认只使用深色模式
 */
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    // 如果存在主题切换按钮，隐藏它
    if (themeToggleBtn) {
        themeToggleBtn.style.display = 'none';
    }
    
    // 确保文档始终使用深色主题
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
}); 