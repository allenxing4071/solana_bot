#!/bin/bash

# 智能路由系统安装脚本
# 安装所需依赖并初始化系统

echo "=========================================="
echo "  智能路由系统安装脚本 - 基于Llama3"
echo "=========================================="
echo

# 检查是否安装了Node.js
if ! command -v node &> /dev/null; then
  echo "错误: 未找到Node.js，请先安装Node.js 14+"
  exit 1
fi

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
if [ $NODE_MAJOR -lt 14 ]; then
  echo "错误: Node.js版本过低，需要v14或更高版本"
  echo "当前版本: v$NODE_VERSION"
  exit 1
fi

# 安装依赖
echo "正在安装依赖..."
npm install
if [ $? -ne 0 ]; then
  echo "错误: 依赖安装失败"
  exit 1
fi
echo "依赖安装成功"
echo

# 检查Ollama
echo "检查Ollama环境..."
if ! command -v ollama &> /dev/null; then
  echo "警告: 未找到Ollama，智能路由系统需要Ollama运行Llama3模型"
  echo "您可以使用以下命令安装Ollama:"
  echo "MacOS/Linux: curl -fsSL https://ollama.com/install.sh | sh"
  echo
  echo "您希望现在安装Ollama吗? (y/n)"
  read -r install_ollama
  if [[ $install_ollama == "y" || $install_ollama == "Y" ]]; then
    echo "正在安装Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    if [ $? -ne 0 ]; then
      echo "错误: Ollama安装失败"
      echo "请手动安装Ollama后再继续"
      exit 1
    fi
    echo "Ollama安装成功"
  else
    echo "您选择不安装Ollama，请注意系统可能无法使用Llama3进行路由决策"
  fi
else
  echo "已找到Ollama"
fi
echo

# 检查Llama3模型
if command -v ollama &> /dev/null; then
  echo "检查Llama3模型..."
  if ! ollama list | grep -q "llama3"; then
    echo "未找到Llama3模型，是否下载? (y/n)"
    read -r download_llama
    if [[ $download_llama == "y" || $download_llama == "Y" ]]; then
      echo "正在下载Llama3模型，这可能需要几分钟时间..."
      ollama pull llama3
      if [ $? -ne 0 ]; then
        echo "错误: Llama3模型下载失败"
        echo "请手动下载Llama3模型后再继续"
        exit 1
      fi
      echo "Llama3模型下载成功"
    else
      echo "您选择不下载Llama3模型，系统将使用备用路由方式"
    fi
  else
    echo "已找到Llama3模型"
  fi
  echo
fi

# 初始化数据库
echo "正在初始化数据库..."
node scripts/init_db.js
if [ $? -ne 0 ]; then
  echo "错误: 数据库初始化失败"
  exit 1
fi
echo "数据库初始化成功"
echo

# 安装完成
echo "=========================================="
echo "  智能路由系统安装完成!"
echo "=========================================="
echo
echo "如何使用:"
echo "1. 启动CLI测试工具: npm start"
echo "2. 初始化数据库: npm run init-db"
echo "3. 集成到现有系统: 参考 examples/integrate_with_proxy.js"
echo
echo "感谢使用!"
exit 0 