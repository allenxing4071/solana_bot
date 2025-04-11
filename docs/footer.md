# 使用示例

以下是使用API的一些示例：

## 添加代币到黑名单

```bash
curl -X POST http://localhost:3000/api/tokens/blacklist \
  -H "Content-Type: application/json" \
  -d '{
    "mint": "ExampleBadToken111111111111111111111111111", 
    "symbol": "SCAM", 
    "name": "Scam Token Example", 
    "reason": "已知诈骗项目"
  }'
```

## 从黑名单中移除代币

```bash
curl -X DELETE http://localhost:3000/api/tokens/blacklist/ExampleBadToken111111111111111111111111111
```

## 验证代币状态

```bash
curl -X GET http://localhost:3000/api/tokens/validate/ExampleBadToken111111111111111111111111111
```

# 注意事项与最佳实践

## 安全建议

1. 在生产环境中运行本API时，请确保添加适当的安全措施：
   - 添加认证机制（如API密钥、JWT或OAuth2）
   - 使用HTTPS加密通信
   - 实现请求速率限制
   - 定期审计API访问日志

2. 谨慎管理黑白名单数据：
   - 定期备份黑白名单文件
   - 对添加到白名单的代币进行彻底验证
   - 使用多人审核机制确认重要的黑白名单变更

## 性能优化

为确保API服务器在高负载情况下的性能，请考虑以下优化：

1. 使用内存缓存减少文件读取操作
2. 实现批量操作接口减少请求数量
3. 采用异步处理方式处理长时间运行的任务

## 常见错误处理

详细了解API可能返回的错误代码和解决方案，请参考[API错误手册](./errors.md)。

---

*本文档最后更新时间：2024年4月1日* 