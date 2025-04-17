// 模型代理管理界面脚本
document.addEventListener('DOMContentLoaded', function() {
    // 保存权重设置
    document.getElementById('save-weights').addEventListener('click', function() {
        const weightInputs = document.querySelectorAll('.weight-input');
        const weights = {};
        
        weightInputs.forEach(input => {
            const modelName = input.dataset.model;
            const weight = parseInt(input.value);
            weights[modelName] = weight;
        });
        
        // 发送到API
        fetch('/api/weights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(weights)
        })
        .then(response => response.json())
        .then(data => {
            alert('权重设置已保存！');
            console.log('设置保存成功:', data);
        })
        .catch(error => {
            alert('保存失败: ' + error.message);
            console.error('保存失败:', error);
        });
    });
    
    // 测试模型
    document.getElementById('send-test').addEventListener('click', function() {
        const modelSelect = document.getElementById('test-model');
        const messageInput = document.getElementById('test-message');
        
        const model = modelSelect.value;
        const message = messageInput.value.trim();
        
        if (!message) {
            alert('请输入测试消息！');
            return;
        }
        
        // 显示加载状态
        document.getElementById('result-model').textContent = '加载中...';
        document.getElementById('result-time').textContent = '计算中...';
        document.getElementById('result-text').textContent = '正在等待响应...';
        
        const startTime = new Date();
        
        // 发送到API
        fetch('/api/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                message: message
            })
        })
        .then(response => response.json())
        .then(data => {
            const endTime = new Date();
            const timeElapsed = (endTime - startTime) / 1000;
            
            document.getElementById('result-model').textContent = data.model_used;
            document.getElementById('result-time').textContent = `${timeElapsed.toFixed(2)}秒`;
            document.getElementById('result-text').textContent = data.content;
        })
        .catch(error => {
            document.getElementById('result-model').textContent = '错误';
            document.getElementById('result-time').textContent = '-';
            document.getElementById('result-text').textContent = `发生错误: ${error.message}`;
        });
    });
    
    // 刷新日志
    document.getElementById('refresh-logs').addEventListener('click', function() {
        fetch('/api/logs')
        .then(response => response.text())
        .then(data => {
            document.getElementById('log-content').textContent = data;
        })
        .catch(error => {
            console.error('获取日志失败:', error);
        });
    });
    
    // 清除日志
    document.getElementById('clear-logs').addEventListener('click', function() {
        if (confirm('确定要清除日志吗？')) {
            fetch('/api/logs/clear', {
                method: 'POST'
            })
            .then(() => {
                document.getElementById('log-content').textContent = '日志已清除';
            })
            .catch(error => {
                console.error('清除日志失败:', error);
            });
        }
    });
    
    // 模型测试按钮
    document.querySelectorAll('.test-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modelName = this.dataset.model;
            document.getElementById('test-model').value = modelName;
            document.getElementById('test-message').value = `你好，请简单介绍一下你自己，你是什么模型？`;
            // 滚动到测试区域
            document.querySelector('.test-model').scrollIntoView({ behavior: 'smooth' });
        });
    });
});