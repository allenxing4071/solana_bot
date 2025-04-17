from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field

class Message(BaseModel):
    """聊天消息模型"""
    role: str = Field(..., description="消息角色，如'user'或'assistant'")
    content: str = Field(..., description="消息内容")
    
class ChatRequest(BaseModel):
    """聊天请求模型"""
    messages: List[Message] = Field(..., description="消息历史")
    model: str = Field(..., description="要使用的模型名称")
    temperature: Optional[float] = Field(0.7, description="温度参数，控制输出的随机性")
    max_tokens: Optional[int] = Field(None, description="最大生成token数")
    stream: Optional[bool] = Field(False, description="是否使用流式响应")
    
class ChatResponse(BaseModel):
    """聊天响应模型"""
    message: Message = Field(..., description="AI生成的消息")
    model: str = Field(..., description="使用的模型名称")
    usage: Dict[str, int] = Field(..., description="Token使用情况")
    
class StreamChunk(BaseModel):
    """流式响应的数据块"""
    chunk: str = Field(..., description="文本块内容")
    finish_reason: Optional[str] = Field(None, description="结束原因")
    
class ErrorResponse(BaseModel):
    """错误响应模型"""
    error: str = Field(..., description="错误信息")
    status_code: int = Field(..., description="HTTP状态码")
    details: Optional[Dict[str, Any]] = Field(None, description="错误详情")
    
class ModelInfo(BaseModel):
    """AI模型信息"""
    id: str = Field(..., description="模型ID")
    name: str = Field(..., description="模型名称")
    provider: str = Field(..., description="模型提供商")
    description: Optional[str] = Field(None, description="模型描述")
    max_tokens: int = Field(..., description="最大支持的token数")
    cost_per_token: float = Field(..., description="每token成本(美元)")
    
class ModelsResponse(BaseModel):
    """可用模型列表响应"""
    models: List[ModelInfo] = Field(..., description="可用模型列表")
    
class HealthCheckResponse(BaseModel):
    """健康检查响应"""
    status: str = Field(..., description="服务状态")
    version: str = Field(..., description="服务版本")
    uptime: float = Field(..., description="运行时间(秒)")
    models_available: List[str] = Field(..., description="可用模型列表")
    
class EmbeddingRequest(BaseModel):
    """文本嵌入请求"""
    text: Union[str, List[str]] = Field(..., description="要嵌入的文本")
    model: str = Field(..., description="嵌入模型")
    
class EmbeddingResponse(BaseModel):
    """文本嵌入响应"""
    embeddings: List[List[float]] = Field(..., description="嵌入向量")
    model: str = Field(..., description="使用的模型")
    usage: Dict[str, int] = Field(..., description="Token使用情况") 