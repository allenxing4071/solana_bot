import os
import json
import logging
import requests
from typing import Dict, List, Any, Optional, Union

# 配置日志
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

class APIManager:
    """
    API管理工具类，用于处理不同AI模型API的请求
    """
    
    def __init__(self):
        """
        初始化API管理器，加载API密钥
        """
        # 加载API密钥
        self.api_keys = {
            'openai': os.getenv('OPENAI_API_KEY'),
            'anthropic': os.getenv('ANTHROPIC_API_KEY'),
            'gemini': os.getenv('GEMINI_API_KEY'),
            'deepseek': os.getenv('DEEPSEEK_API_KEY'),
            'ollama': os.getenv('OLLAMA_API_KEY'),
        }
        
        # 设置API基础URL
        self.base_urls = {
            'openai': os.getenv('OPENAI_API_BASE', 'https://api.openai.com/v1'),
            'anthropic': os.getenv('ANTHROPIC_API_BASE', 'https://api.anthropic.com/v1'),
            'gemini': os.getenv('GEMINI_API_BASE', 'https://generativelanguage.googleapis.com/v1beta'),
            'deepseek': os.getenv('DEEPSEEK_API_BASE', 'https://api.deepseek.com/v1'),
            'ollama': os.getenv('OLLAMA_API_BASE', 'http://localhost:11434/api'),
        }
        
        # 设置代理
        self.proxy = os.getenv('HTTP_PROXY')
        
    def call_openai_api(self, 
                       model: str, 
                       messages: List[Dict[str, str]], 
                       temperature: float = 0.7,
                       max_tokens: Optional[int] = None) -> Dict[str, Any]:
        """
        调用OpenAI API
        
        参数:
            model: 模型名称，如'gpt-4o'
            messages: 消息列表，格式为[{"role": "user", "content": "Hello"}]
            temperature: 温度参数，控制输出的随机性
            max_tokens: 最大生成token数
            
        返回:
            API响应的JSON数据
        """
        if not self.api_keys['openai']:
            raise ValueError("缺少OpenAI API密钥")
            
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_keys['openai']}"
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        
        if max_tokens:
            payload["max_tokens"] = max_tokens
            
        try:
            response = requests.post(
                f"{self.base_urls['openai']}/chat/completions",
                headers=headers,
                json=payload,
                proxies={"http": self.proxy, "https": self.proxy} if self.proxy else None,
                timeout=60
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"OpenAI API调用失败: {str(e)}")
            raise
            
    def call_anthropic_api(self, 
                         model: str, 
                         messages: List[Dict[str, str]], 
                         temperature: float = 0.7,
                         max_tokens: int = 1024) -> Dict[str, Any]:
        """
        调用Anthropic API
        
        参数:
            model: 模型名称，如'claude-3-opus'
            messages: 消息列表，格式为[{"role": "user", "content": "Hello"}]
            temperature: 温度参数，控制输出的随机性
            max_tokens: 最大生成token数
            
        返回:
            API响应的JSON数据
        """
        if not self.api_keys['anthropic']:
            raise ValueError("缺少Anthropic API密钥")
            
        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_keys['anthropic'],
            "anthropic-version": "2023-06-01"
        }
        
        # 将messages格式转换为Anthropic格式
        anthropic_messages = []
        for msg in messages:
            role = "assistant" if msg["role"] == "assistant" else "user"
            anthropic_messages.append({"role": role, "content": msg["content"]})
        
        payload = {
            "model": model,
            "messages": anthropic_messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
            
        try:
            response = requests.post(
                f"{self.base_urls['anthropic']}/messages",
                headers=headers,
                json=payload,
                proxies={"http": self.proxy, "https": self.proxy} if self.proxy else None,
                timeout=60
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Anthropic API调用失败: {str(e)}")
            raise
            
    def call_gemini_api(self, 
                        model: str, 
                        messages: List[Dict[str, str]], 
                        temperature: float = 0.7,
                        max_tokens: Optional[int] = None) -> Dict[str, Any]:
        """
        调用Google Gemini API
        
        参数:
            model: 模型名称，如'gemini-pro'
            messages: 消息列表，格式为[{"role": "user", "content": "Hello"}]
            temperature: 温度参数，控制输出的随机性
            max_tokens: 最大生成token数
            
        返回:
            API响应的JSON数据
        """
        if not self.api_keys['gemini']:
            raise ValueError("缺少Gemini API密钥")
        
        # 将messages转换为Gemini格式
        gemini_messages = []
        for msg in messages:
            role = "model" if msg["role"] == "assistant" else "user"
            gemini_messages.append({"role": role, "parts": [{"text": msg["content"]}]})
        
        payload = {
            "contents": gemini_messages,
            "generationConfig": {
                "temperature": temperature,
            }
        }
        
        if max_tokens:
            payload["generationConfig"]["maxOutputTokens"] = max_tokens
            
        try:
            response = requests.post(
                f"{self.base_urls['gemini']}/models/{model}:generateContent?key={self.api_keys['gemini']}",
                json=payload,
                proxies={"http": self.proxy, "https": self.proxy} if self.proxy else None,
                timeout=60
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Gemini API调用失败: {str(e)}")
            raise
            
    def call_ollama_api(self, 
                      model: str, 
                      messages: List[Dict[str, str]], 
                      temperature: float = 0.7,
                      max_tokens: Optional[int] = None) -> Dict[str, Any]:
        """
        调用Ollama API (本地部署的模型)
        
        参数:
            model: 模型名称，如'llama3'
            messages: 消息列表，格式为[{"role": "user", "content": "Hello"}]
            temperature: 温度参数，控制输出的随机性
            max_tokens: 最大生成token数
            
        返回:
            API响应的JSON数据
        """
        # Ollama使用简化的消息格式
        ollama_messages = []
        for msg in messages:
            ollama_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
            
        payload = {
            "model": model,
            "messages": ollama_messages,
            "options": {
                "temperature": temperature
            }
        }
        
        if max_tokens:
            payload["options"]["num_predict"] = max_tokens
            
        try:
            response = requests.post(
                f"{self.base_urls['ollama']}/chat",
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Ollama API调用失败: {str(e)}")
            raise
            
    def select_available_model(self, preferred_models: List[str]) -> str:
        """
        根据可用API密钥选择模型
        
        参数:
            preferred_models: 偏好的模型列表，按优先级排序
            
        返回:
            可用的模型名称
        """
        for model in preferred_models:
            if model.startswith("gpt-") and self.api_keys['openai']:
                return model
            elif model.startswith("claude-") and self.api_keys['anthropic']:
                return model  
            elif model.startswith("gemini-") and self.api_keys['gemini']:
                return model
            elif model.startswith("deepseek-") and self.api_keys['deepseek']:
                return model
            elif self.api_keys['ollama']:  # Ollama本地模型总是可用的
                return model
                
        # 如果没有找到可用模型，返回第一个模型并警告
        logger.warning(f"未找到可用的API密钥，将使用{preferred_models[0]}，但可能无法正常工作")
        return preferred_models[0] 