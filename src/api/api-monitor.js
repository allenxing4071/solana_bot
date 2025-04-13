/**
 * API监控页面路由
 * 为API服务器添加API监控界面路由
 */

// 引入依赖
const fs = require('node:fs');
const path = require('node:path');

// API监控页面HTML内容
const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solana MEV机器人 API监控</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #1a1a1a;
            color: #f0f0f0;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1, h2 {
            color: #4caf50;
        }
        .api-section {
            margin-bottom: 30px;
            border: 1px solid #333;
            padding: 15px;
            border-radius: 5px;
            background-color: #222;
        }
        .api-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #444;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .api-url {
            color: #2196f3;
            font-family: monospace;
            font-size: 14px;
        }
        .refresh-btn {
            background-color: #333;
            color: #fff;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
        }
        .refresh-btn:hover {
            background-color: #444;
        }
        pre {
            background-color: #272727;
            padding: 10px;
            border-radius: 3px;
            overflow: auto;
            max-height: 500px;
        }
        .status {
            font-size: 12px;
            color: #888;
        }
        .error {
            color: #ff5252;
        }
        .success {
            color: #4caf50;
        }
        .json-key {
            color: #f8c555;
        }
        .json-value {
            color: #7ec699;
        }
        .json-string {
            color: #ce9178;
        }
        .json-number {
            color: #b5cea8;
        }
        .json-boolean {
            color: #569cd6;
        }
        .json-null {
            color: #569cd6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Solana MEV机器人 API监控</h1>
        
        <div class="api-section">
            <div class="api-title">
                <h2>系统状态</h2>
                <span class="api-url">/api/system/status</span>
                <button class="refresh-btn" onclick="fetchData('system-status', '/api/system/status')">刷新</button>
            </div>
            <div class="status" id="system-status-status"></div>
            <pre id="system-status"></pre>
        </div>
        
        <div class="api-section">
            <div class="api-title">
                <h2>监控中的代币</h2>
                <span class="api-url">/api/tokens</span>
                <button class="refresh-btn" onclick="fetchData('tokens', '/api/tokens')">刷新</button>
            </div>
            <div class="status" id="tokens-status"></div>
            <pre id="tokens"></pre>
        </div>
        
        <div class="api-section">
            <div class="api-title">
                <h2>最近交易数据</h2>
                <span class="api-url">/api/transactions</span>
                <button class="refresh-btn" onclick="fetchData('transactions', '/api/transactions')">刷新</button>
            </div>
            <div class="status" id="transactions-status"></div>
            <pre id="transactions"></pre>
        </div>
        
        <div class="api-section">
            <div class="api-title">
                <h2>监控中的流动性池</h2>
                <span class="api-url">/api/pools</span>
                <button class="refresh-btn" onclick="fetchData('pools', '/api/pools')">刷新</button>
            </div>
            <div class="status" id="pools-status"></div>
            <pre id="pools"></pre>
        </div>
        
        <div class="api-section">
            <div class="api-title">
                <h2>内存监控数据</h2>
                <span class="api-url">/api/memory_stats.json</span>
                <button class="refresh-btn" onclick="fetchData('memory', '/api/memory_stats.json')">刷新</button>
            </div>
            <div class="status" id="memory-status"></div>
            <pre id="memory"></pre>
        </div>
        
        <div class="api-section">
            <div class="api-title">
                <h2>API状态</h2>
                <span class="api-url">/api/status</span>
                <button class="refresh-btn" onclick="fetchData('api-status', '/api/status')">刷新</button>
            </div>
            <div class="status" id="api-status-status"></div>
            <pre id="api-status"></pre>
        </div>
    </div>

    <script>
        // 自动使用当前主机地址作为基础URL
        const baseUrl = '';
        
        // 格式化JSON并高亮显示
        function formatJSON(json) {
            if (typeof json !== 'string') {
                json = JSON.stringify(json, null, 2);
            }
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            });
        }
        
        // 获取API数据
        async function fetchData(elementId, endpoint) {
            const statusElement = document.getElementById(\`\${elementId}-status\`);
            const dataElement = document.getElementById(elementId);
            
            statusElement.textContent = "加载中...";
            statusElement.className = "status";
            
            try {
                const response = await fetch(\`\${baseUrl}\${endpoint}\`);
                const statusText = \`状态: \${response.status} \${response.statusText}\`;
                
                if (!response.ok) {
                    statusElement.textContent = \`\${statusText} - 请求失败\`;
                    statusElement.className = "status error";
                    dataElement.textContent = "无法获取数据";
                    return;
                }
                
                try {
                    const data = await response.json();
                    statusElement.textContent = \`\${statusText} - 成功\`;
                    statusElement.className = "status success";
                    dataElement.innerHTML = formatJSON(data);
                } catch (jsonError) {
                    const text = await response.text();
                    statusElement.textContent = \`\${statusText} - 解析JSON失败\`;
                    statusElement.className = "status error";
                    dataElement.textContent = text || "返回数据为空";
                }
            } catch (error) {
                statusElement.textContent = \`请求失败: \${error.message}\`;
                statusElement.className = "status error";
                dataElement.textContent = "无法连接到API服务器";
            }
        }
        
        // 页面加载时获取所有数据
        window.onload = function() {
            fetchData('system-status', '/api/system/status');
            fetchData('tokens', '/api/tokens');
            fetchData('transactions', '/api/transactions');
            fetchData('pools', '/api/pools');
            fetchData('memory', '/api/memory_stats.json');
            fetchData('api-status', '/api/status');
        };
    </script>
</body>
</html>`;

/**
 * 设置API监控路由
 * @param {Object} app - Express应用实例
 */
function setupAPIMonitorRoute(app) {
  // 将API监控页面写入到文件系统 (可选)
  const monitorPagePath = path.join(__dirname, '..', '..', 'public', 'api-monitor.html');
  try {
    // 确保public目录存在
    const publicDir = path.join(__dirname, '..', '..', 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
      console.log(`[API监控] 创建了目录: ${publicDir}`);
    }
    
    // 写入监控页面
    fs.writeFileSync(monitorPagePath, htmlContent);
    console.log(`[API监控] 页面已写入: ${monitorPagePath}`);
  } catch (error) {
    console.error(`[API监控] 无法写入监控页面: ${error.message}`);
  }
  
  // 添加API监控页面路由
  app.get('/api-monitor', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  });
  
  console.log('[API监控] 路由已添加: /api-monitor');
}

module.exports = setupAPIMonitorRoute; 