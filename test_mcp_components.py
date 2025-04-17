#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
MCP组件测试脚本
用于验证已安装的MCP组件是否可用
"""

import os
import sys
from dotenv import load_dotenv
from langchain_openai import OpenAI
from langchain.agents import load_tools, initialize_agent
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 加载环境变量
load_dotenv()

def test_langchain():
    """测试LangChain基本功能"""
    try:
        print("测试LangChain基本功能...")
        # 创建简单的提示模板
        template = "请用一句话回答：{question}"
        prompt = PromptTemplate.from_template(template)
        print("✅ LangChain提示模板创建成功")
        return True
    except Exception as e:
        print(f"❌ LangChain测试失败: {str(e)}")
        return False

def test_langchain_core():
    """测试LangChain-Core功能"""
    try:
        print("\n测试LangChain-Core功能...")
        # 创建输出解析器
        parser = StrOutputParser()
        print("✅ LangChain-Core输出解析器创建成功")
        return True
    except Exception as e:
        print(f"❌ LangChain-Core测试失败: {str(e)}")
        return False

def test_text_splitter():
    """测试文本分割器功能"""
    try:
        print("\n测试文本分割器功能...")
        # 创建文本分割器
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=100,
            chunk_overlap=20
        )
        # 测试分割
        text = "这是一个测试文本，用于验证文本分割器的功能。"
        splits = text_splitter.split_text(text)
        print(f"✅ 文本分割成功，得到 {len(splits)} 个片段")
        return True
    except Exception as e:
        print(f"❌ 文本分割器测试失败: {str(e)}")
        return False

def test_openai_agents():
    """测试OpenAI代理功能"""
    try:
        print("\n测试OpenAI代理功能...")
        # 检查API密钥
        if not os.getenv("OPENAI_API_KEY"):
            print("❌ 未找到OPENAI_API_KEY环境变量")
            return False
            
        # 初始化OpenAI模型
        llm = OpenAI(temperature=0)
        
        # 尝试加载工具
        tools = load_tools(["llm-math"], llm=llm)
        print("✅ OpenAI代理工具加载成功")
        return True
    except Exception as e:
        print(f"❌ OpenAI代理测试失败: {str(e)}")
        return False

def main():
    """主函数"""
    print("开始测试MCP组件...\n")
    
    # 测试所有组件
    components = {
        "LangChain": test_langchain,
        "LangChain-Core": test_langchain_core,
        "Text-Splitter": test_text_splitter,
        "OpenAI-Agents": test_openai_agents
    }
    
    results = {}
    for name, test_func in components.items():
        results[name] = test_func()
    
    # 打印总结
    print("\n测试结果总结:")
    for name, success in results.items():
        status = "✅ 可用" if success else "❌ 不可用"
        print(f"{name}: {status}")
    
    # 检查是否有不可用的组件
    if not all(results.values()):
        print("\n警告：部分组件不可用，请检查依赖和环境配置")
        sys.exit(1)
    else:
        print("\n所有组件测试通过！")

if __name__ == "__main__":
    main() 