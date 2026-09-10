import os
from typing import Optional
from langchain_core.language_models import BaseChatModel
from langchain_openai import ChatOpenAI
from backend.config.settings import settings
from backend.config.logging import logger

def get_llm(
    provider: Optional[str] = None,
    model_name: Optional[str] = None,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    temperature: float = 0.1
) -> BaseChatModel:
    provider = provider or settings.LLM_PROVIDER
    model_name = os.getenv("OPENAI_MODEL") or model_name or settings.LLM_MODEL
    api_key = os.getenv("OPENAI_API_KEY") or api_key or settings.LLM_API_KEY
    base_url = base_url or settings.LLM_BASE_URL

    logger.info(f"Instantiating LLM model: {provider} / {model_name}")

    if provider.lower() == "openai":
        if not api_key or api_key.startswith("sk-demo") or api_key in ("demo-key", "sk-fake-key-demo"):
            raise RuntimeError(
                "No real LLM_API_KEY configured. Set LLM_API_KEY/LLM_BASE_URL/LLM_MODEL in .env. "
                "Simulation fallback removed in v2."
            )
        return ChatOpenAI(
            model=model_name,
            api_key=api_key,
            base_url=base_url if base_url and base_url != "https://api.openai.com/v1" else None,
            temperature=temperature,
        )
    elif provider.lower() == "anthropic":
        try:
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(
                model=model_name,
                api_key=api_key,
                temperature=temperature
            )
        except ImportError:
            logger.warning("langchain_anthropic not installed; falling back to ChatOpenAI")
            return ChatOpenAI(model="gpt-4o", temperature=temperature)
    elif provider.lower() == "ollama":
        try:
            from langchain_community.chat_models import ChatOllama
            return ChatOllama(
                model=model_name,
                base_url=base_url or "http://localhost:11434",
                temperature=temperature
            )
        except ImportError:
            return ChatOpenAI(model="gpt-4o", temperature=temperature)
    else:
        # Fallback to OpenAI compatible interface
        return ChatOpenAI(
            model=model_name,
            api_key=api_key or "sk-demo",
            temperature=temperature
        )
