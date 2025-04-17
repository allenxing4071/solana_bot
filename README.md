# YouTube视频内容提取和总结工具

这是一个简单易用的命令行工具，可以从YouTube视频中提取信息，并使用本地AI服务自动生成视频内容的详细摘要。

## 功能特点

- 从YouTube URL或视频ID提取视频详细信息
- 支持各种YouTube链接格式（标准链接、分享链接、短链接等）
- 获取视频标题、作者、时长、观看次数、发布日期等基本信息
- 使用本地AI服务自动生成视频内容摘要
- 将结果保存为格式化的Markdown文件
- 完全中文界面和输出

## 安装要求

### 前提条件
- Python 3.6 或更高版本
- 本地AI代理服务（默认地址：http://localhost:3100/api/chat）

### 安装依赖
```bash
pip install -r requirements.txt
```

## 使用方法

### 基本用法
```bash
python youtube_summary_tool.py [YouTube视频URL或ID]
```

### 示例
```bash
# 使用完整YouTube URL
python youtube_summary_tool.py https://www.youtube.com/watch?v=dQw4w9WgXcQ

# 使用YouTube短链接
python youtube_summary_tool.py https://youtu.be/dQw4w9WgXcQ

# 直接使用视频ID
python youtube_summary_tool.py dQw4w9WgXcQ
```

## 输出说明

程序会在`summaries`目录下生成Markdown格式的摘要文件，文件名格式为`[视频标题]_[视频ID].md`。

文件内容包括：
- 视频基本信息（标题、作者、时长、观看次数等）
- 完整的视频描述
- AI生成的内容摘要，包括：
  - 视频主题概述
  - 关键点总结
  - 亮点和洞见
  - 适合观看的人群

## 常见问题

### 无法连接到AI服务
确保本地AI服务正在运行，且地址配置正确。默认服务地址为`http://localhost:3100/api/chat`。

### 视频链接无效
请检查您提供的YouTube链接或视频ID格式是否正确。工具支持多种链接格式，但必须是有效的YouTube视频。

### 处理时间过长
视频信息提取通常很快，但AI生成摘要可能需要一些时间，特别是对于长视频或复杂内容。请耐心等待。

## 自定义配置

您可以通过修改脚本开头的配置部分来调整以下参数：
- `AI_PROXY_URL`：本地AI服务的地址
- `AI_PROXY_TIMEOUT`：AI服务请求超时时间
- `OUTPUT_DIR`：摘要文件的输出目录 