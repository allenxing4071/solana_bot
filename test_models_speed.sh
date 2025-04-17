#!/bin/bash

# 测试问题
TEST_QUESTION="什么是区块链技术？请简要介绍"

# 模型列表
MODELS=("deepseek-v3.1" "deepseek-r1" "claude-3-opus" "claude-3-sonnet" "claude-3-haiku" "gpt-4o" "cursor")

echo "开始测试各个模型的响应速度..."
echo ""

for model in "${MODELS[@]}"; do
  echo "测试模型: $model"
  
  # 计时开始
  start_time=$(date +%s.%N)
  
  # 发送请求
  response=$(curl -s -X POST http://localhost:3100/api/chat \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"$model\", \"messages\": [{\"role\": \"user\", \"content\": \"$TEST_QUESTION\"}]}")
  
  # 计时结束
  end_time=$(date +%s.%N)
  
  # 计算用时
  elapsed=$(echo "$end_time - $start_time" | bc)
  
  # 获取实际使用的模型
  actual_model=$(echo $response | grep -o '"_actual_model_used":"[^"]*"' | cut -d'"' -f4)
  
  # 如果找不到实际使用的模型信息
  if [ -z "$actual_model" ]; then
    actual_model="未知或失败"
  fi
  
  echo "  请求的模型: $model"
  echo "  实际使用的模型: $actual_model"
  echo "  响应时间: ${elapsed}秒"
  
  # 显示响应的前100个字符
  content=$(echo $response | grep -o '"text":"[^"]*"' | cut -d'"' -f4 | head -c 100)
  if [ -n "$content" ]; then
    echo "  响应内容预览: ${content}..."
  else
    echo "  响应内容: 无法解析或请求失败"
  fi
  
  echo ""
  
  # 避免请求过于频繁
  sleep 1
done

echo "测试完成！" 