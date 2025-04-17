#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
MCP功能详细测试脚本
用于测试各个组件的具体功能
"""

import os
from dotenv import load_dotenv
from langchain_openai import OpenAI
from langchain.agents import load_tools, initialize_agent, AgentType
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 加载环境变量
load_dotenv()

def test_langchain_prompt():
    """测试LangChain提示模板功能"""
    print("\n=== 测试LangChain提示模板 ===")
    try:
        # 创建提示模板
        template = "请用一句话描述{subject}的主要特点。"
        prompt = PromptTemplate.from_template(template)
        
        # 使用提示模板
        formatted_prompt = prompt.format(subject="人工智能")
        print(f"模板: {template}")
        print(f"格式化后的提示: {formatted_prompt}")
        return True
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        return False

def test_langchain_core_parser():
    """测试LangChain-Core解析器功能"""
    print("\n=== 测试LangChain-Core解析器 ===")
    try:
        # 创建解析器
        parser = StrOutputParser()
        
        # 测试解析
        test_text = "这是一段测试文本\n包含多行内容\n"
        result = parser.parse(test_text)
        print(f"原始文本: {test_text}")
        print(f"解析结果: {result}")
        return True
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        return False

def test_text_splitter_detailed():
    """测试文本分割器的详细功能"""
    print("\n=== 测试文本分割器 ===")
    try:
        # 创建文本分割器
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=50,  # 设置较小的块大小以便于演示
            chunk_overlap=10,
            length_function=len,
            is_separator_regex=False
        )
        
        # 准备测试文本
        test_text = """这是第一段测试文本，用于测试文本分割器的功能。
这是第二段测试文本，包含了更多的内容。
这是第三段测试文本，用于验证分割效果。"""
        
        # 执行分割
        splits = text_splitter.split_text(test_text)
        
        print(f"原始文本长度: {len(test_text)}")
        print(f"分割后片段数: {len(splits)}")
        print("\n各个片段内容:")
        for i, split in enumerate(splits, 1):
            print(f"片段 {i}: {split}")
        return True
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        return False

def test_openai_agents_detailed():
    """测试OpenAI代理的详细功能"""
    print("\n=== 测试OpenAI代理 ===")
    try:
        # 初始化OpenAI模型
        llm = OpenAI(temperature=0)
        
        # 加载数学工具
        tools = load_tools(["llm-math"], llm=llm)
        
        # 创建代理
        agent = initialize_agent(
            tools,
            llm,
            agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True
        )
        
        # 测试数学计算
        question = "什么是357乘以28？"
        print(f"\n问题: {question}")
        result = agent.run(question)
        print(f"回答: {result}")
        return True
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        return False

def main():
    """主函数"""
    print("开始详细测试MCP功能...\n")
    
    # 测试所有功能
    tests = [
        ("LangChain提示模板", test_langchain_prompt),
        ("LangChain-Core解析器", test_langchain_core_parser),
        ("文本分割器", test_text_splitter_detailed),
        ("OpenAI代理", test_openai_agents_detailed)
    ]
    
    results = {}
    for name, test_func in tests:
        print(f"\n正在测试: {name}")
        results[name] = test_func()
    
    # 打印总结
    print("\n=== 测试结果总结 ===")
    for name, success in results.items():
        status = "✅ 通过" if success else "❌ 失败"
        print(f"{name}: {status}")

if __name__ == "__main__":
    main() 