/**
 * 日期时间更新脚本
 * 用于更新页面上的日期时间显示
 */

/**
 * 更新日期时间显示
 */
function updateDateTime() {
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        const now = new Date();
        const formattedDateTime = now.toLocaleString('zh-CN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false
        });
        dateTimeElement.textContent = formattedDateTime;
    }
}

// 页面加载完成后初始化日期时间显示
document.addEventListener('DOMContentLoaded', function() {
  // 立即更新一次
  updateDateTime();
  
  // 每秒更新一次
  setInterval(updateDateTime, 1000);
}); 