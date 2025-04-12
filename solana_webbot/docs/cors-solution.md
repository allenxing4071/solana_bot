# 解决本地开发的CORS跨域问题

## 问题描述

在本地开发环境(如localhost:8080)中，直接请求远程API(如https://sol.deeptv.tv/api/...)会遇到以下错误:

```
Access to fetch at 'https://sol.deeptv.tv/api/...' from origin 'http://localhost:8080' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

这是由浏览器的同源策略(Same-Origin Policy)造成的安全限制，阻止不同域之间的直接请求。

## 解决方案

本文档提供了三种解决方案:

1. 使用本地代理服务器
2. 使用相对路径和开发服务器代理
3. 使用模拟数据(仅开发环境)

## 方案1: 使用本地代理服务器(推荐)

### 步骤1: 安装依赖

```bash
npm install express http-proxy-middleware cors --save-dev
```

### 步骤2: 启动代理服务器

```bash
./start-dev-proxy.sh
```

或手动启动:

```bash
node local-dev-proxy.js
```

代理服务器将在 http://localhost:8081 上运行，并将请求转发到远程API。

### 步骤3: 在前端代码中使用代理

将API请求从:
```
fetch('/api/system/status')
```

修改为:
```
fetch('http://localhost:8081/dev-api/system/status')
```

或使用提供的配置文件:
```html
<!-- 在HTML中引入配置文件 -->
<script src="dev-api-config.js"></script>

<!-- 在JS代码中使用配置 -->
<script>
    const apiBaseUrl = window.API_CONFIG?.API_BASE || '/api';
    fetch(`${apiBaseUrl}/system/status`);
</script>
```

## 方案2: 使用相对路径和开发服务器代理

如果你使用webpack、vite等开发服务器:

### webpack配置示例:

```javascript
// webpack.config.js
module.exports = {
  // ...其他配置
  devServer: {
    proxy: {
      '/api': {
        target: 'https://sol.deeptv.tv',
        changeOrigin: true
      }
    }
  }
};
```

### vite配置示例:

```javascript
// vite.config.js
export default {
  // ...其他配置
  server: {
    proxy: {
      '/api': {
        target: 'https://sol.deeptv.tv',
        changeOrigin: true
      }
    }
  }
};
```

配置后，前端代码可以直接使用相对路径请求API:

```javascript
fetch('/api/system/status');
```

## 方案3: 生产环境修改

要在生产环境解决CORS问题，可在服务器端添加CORS头:

```nginx
# Nginx配置示例
location /api/ {
    # 其他配置...
    
    # 添加CORS头
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept' always;
    
    # 处理OPTIONS预检请求
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept' always;
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain charset=UTF-8';
        add_header 'Content-Length' 0;
        return 204;
    }
}
```

## 文件说明

本解决方案包含以下文件:

- `local-dev-proxy.js`: 本地代理服务器，转发API请求
- `dev-api-config.js`: API配置文件，根据环境自动选择正确的API基础URL
- `local-dashboard-fix.js`: 修改后的dashboard.js，使用API配置文件
- `start-dev-proxy.sh`: 启动本地代理服务器的脚本
- `local-index.html`: 本地开发环境的HTML，引入必要的脚本

## 使用方法

1. 启动本地代理服务器: `./start-dev-proxy.sh`
2. 在HTML中引入配置文件: `<script src="dev-api-config.js"></script>`
3. 使用修改后的JS: `local-dashboard-fix.js`，或修改API请求路径

这样就可以在本地开发环境中正常访问远程API，而不会遇到CORS错误。 