#!/bin/bash

# YouTube视频摘要工具依赖安装脚本

echo "正在安装 YouTube 视频摘要工具所需依赖..."

# 检查是否已安装 pip
if ! command -v pip &> /dev/null; then
    echo "未检测到 pip，正在尝试安装..."
    if command -v python3 &> /dev/null; then
        python3 -m ensurepip --upgrade
    else
        echo "错误: 未找到 python3，请先安装 Python 3"
        exit 1
    fi
fi

# 安装所需的 Python 包
echo "正在安装 Python 依赖包..."
pip install requests pytube

# 检查安装结果
if [ $? -eq 0 ]; then
    echo "依赖安装成功!"
    echo "现在可以使用 python youtube_summary_tool.py [YouTube URL] 来分析视频"
else
    echo "依赖安装过程中出现错误，请检查网络连接或手动安装以下包:"
    echo "- requests"
    echo "- pytube"
fi

echo "安装完成!"
