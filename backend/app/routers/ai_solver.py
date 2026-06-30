from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import json
import httpx

from app.ai.ai_solver_config import load_config, save_config

router = APIRouter(prefix="/ai-solver", tags=["AI解题"])


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    stream: Optional[bool] = True
    temperature: Optional[float] = None


class ConfigUpdate(BaseModel):
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    system_prompt: Optional[str] = None


@router.get("/config")
def get_config():
    config = load_config()
    # 不返回完整 api_key，只显示前后几位
    masked_config = config.copy()
    if masked_config["api_key"]:
        key = masked_config["api_key"]
        if len(key) > 8:
            masked_config["api_key"] = key[:4] + "****" + key[-4:]
        else:
            masked_config["api_key"] = "****"
    return {"code": 200, "data": masked_config, "msg": "success"}


@router.post("/config")
def update_config(config: ConfigUpdate):
    updated = save_config(config.dict(exclude_none=True))
    masked = updated.copy()
    if masked["api_key"]:
        key = masked["api_key"]
        if len(key) > 8:
            masked["api_key"] = key[:4] + "****" + key[-4:]
        else:
            masked["api_key"] = "****"
    return {"code": 200, "data": masked, "msg": "保存成功"}


@router.post("/chat")
async def chat(request: ChatRequest):
    config = load_config()
    if not config["api_key"]:
        raise HTTPException(status_code=400, detail="请先在设置中配置 AI API Key")

    # 构造消息列表，加入系统提示
    messages = []
    if config.get("system_prompt"):
        messages.append({"role": "system", "content": config["system_prompt"]})
    for msg in request.messages:
        messages.append({"role": msg.role, "content": msg.content})

    temperature = request.temperature if request.temperature is not None else config.get("temperature", 0.7)

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{config['base_url'].rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {config['api_key']}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": config["model"],
                    "messages": messages,
                    "stream": False,
                    "temperature": temperature,
                },
            )

            if response.status_code != 200:
                return {"code": response.status_code, "msg": f"AI API 调用失败: {response.text}"}

            data = response.json()
            content = data["choices"][0]["message"]["content"]
            return {
                "code": 200,
                "data": {
                    "content": content,
                    "model": data.get("model", config["model"]),
                    "usage": data.get("usage", {}),
                },
                "msg": "success",
            }
    except Exception as e:
        return {"code": 500, "msg": f"请求失败: {str(e)}"}


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    config = load_config()
    if not config["api_key"]:
        raise HTTPException(status_code=400, detail="请先在设置中配置 AI API Key")

    messages = []
    if config.get("system_prompt"):
        messages.append({"role": "system", "content": config["system_prompt"]})
    for msg in request.messages:
        messages.append({"role": msg.role, "content": msg.content})

    temperature = request.temperature if request.temperature is not None else config.get("temperature", 0.7)

    async def generate():
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{config['base_url'].rstrip('/')}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {config['api_key']}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": config["model"],
                        "messages": messages,
                        "stream": True,
                        "temperature": temperature,
                    },
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        yield f"data: {json.dumps({'error': f'AI API 调用失败: {error_text}'})}\n\n"
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                yield "data: [DONE]\n\n"
                                break
                            try:
                                parsed = json.loads(data)
                                delta = parsed["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield f"data: {json.dumps({'content': content})}\n\n"
                            except Exception:
                                continue
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
