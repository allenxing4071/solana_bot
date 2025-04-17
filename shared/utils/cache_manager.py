import os
import json
import hashlib
import redis
import logging
from typing import Dict, Any, Optional, Union

# 配置日志
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

class CacheManager:
    """
    缓存管理工具类，用于缓存AI模型的输出，减少重复API调用
    支持内存缓存和Redis缓存两种模式
    """
    
    def __init__(self, use_redis: bool = True):
        """
        初始化缓存管理器
        
        参数:
            use_redis: 是否使用Redis作为缓存存储，默认为True
        """
        self.use_redis = use_redis and os.getenv('REDIS_URL') is not None
        self.cache_enabled = os.getenv('ENABLE_CACHE', 'true').lower() == 'true'
        self.cache_ttl = int(os.getenv('CACHE_TTL', '3600'))  # 默认缓存1小时
        
        # 初始化缓存存储
        if self.use_redis:
            try:
                self.redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://redis:6379/0'))
                logger.info("已连接到Redis缓存")
            except Exception as e:
                logger.error(f"连接Redis失败: {str(e)}")
                self.use_redis = False
                self.memory_cache = {}
        else:
            logger.info("使用内存缓存")
            self.memory_cache = {}
    
    def generate_cache_key(self, model: str, messages: list, params: Dict[str, Any]) -> str:
        """
        生成缓存键
        
        参数:
            model: 模型名称
            messages: 对话消息
            params: 其他参数
            
        返回:
            缓存键字符串
        """
        # 创建包含所有信息的字典
        cache_dict = {
            "model": model,
            "messages": messages,
            "params": params
        }
        
        # 将字典转为JSON字符串并计算哈希值
        cache_str = json.dumps(cache_dict, sort_keys=True)
        return hashlib.md5(cache_str.encode()).hexdigest()
    
    def get_from_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        从缓存中获取数据
        
        参数:
            cache_key: 缓存键
            
        返回:
            缓存的数据，如果没有则返回None
        """
        if not self.cache_enabled:
            return None
            
        try:
            if self.use_redis:
                cached_data = self.redis_client.get(cache_key)
                if cached_data:
                    return json.loads(cached_data)
            else:
                if cache_key in self.memory_cache:
                    return self.memory_cache[cache_key]
        except Exception as e:
            logger.error(f"从缓存获取数据失败: {str(e)}")
        
        return None
    
    def save_to_cache(self, cache_key: str, data: Dict[str, Any]) -> bool:
        """
        保存数据到缓存
        
        参数:
            cache_key: 缓存键
            data: 要缓存的数据
            
        返回:
            是否成功保存
        """
        if not self.cache_enabled:
            return False
            
        try:
            if self.use_redis:
                self.redis_client.setex(
                    cache_key,
                    self.cache_ttl,
                    json.dumps(data)
                )
            else:
                self.memory_cache[cache_key] = data
            return True
        except Exception as e:
            logger.error(f"保存数据到缓存失败: {str(e)}")
            return False
    
    def invalidate_cache(self, cache_key: Optional[str] = None) -> bool:
        """
        使缓存失效
        
        参数:
            cache_key: 缓存键，如果为None则清空所有缓存
            
        返回:
            是否成功使缓存失效
        """
        if not self.cache_enabled:
            return False
            
        try:
            if cache_key is None:
                # 清空所有缓存
                if self.use_redis:
                    self.redis_client.flushdb()
                else:
                    self.memory_cache = {}
            else:
                # 删除特定缓存
                if self.use_redis:
                    self.redis_client.delete(cache_key)
                else:
                    if cache_key in self.memory_cache:
                        del self.memory_cache[cache_key]
            return True
        except Exception as e:
            logger.error(f"使缓存失效失败: {str(e)}")
            return False
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        获取缓存统计信息
        
        返回:
            缓存统计信息的字典
        """
        stats = {
            "cache_enabled": self.cache_enabled,
            "cache_type": "redis" if self.use_redis else "memory",
            "cache_ttl": self.cache_ttl
        }
        
        try:
            if self.use_redis:
                info = self.redis_client.info()
                stats.update({
                    "used_memory": info.get("used_memory_human", "未知"),
                    "total_keys": info.get("db0", {}).get("keys", 0),
                    "redis_version": info.get("redis_version", "未知")
                })
            else:
                stats.update({
                    "total_keys": len(self.memory_cache)
                })
        except Exception as e:
            logger.error(f"获取缓存统计信息失败: {str(e)}")
            
        return stats 