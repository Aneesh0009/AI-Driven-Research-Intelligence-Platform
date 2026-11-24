import os
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Driven Research Intelligence Platform"
    API_V1_STR: str = "/api"
    
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgrespassword@localhost:5432/research_intel",
        description="Async PostgreSQL Connection String with pgvector"
    )
    
    # LLM Providers Configuration (NVIDIA NIM [FREE], Gemini [FREE], Groq [FREE], OpenAI, Ollama [FREE Local])
    NVIDIA_API_KEY: str = Field(default="", description="NVIDIA NIM API Key (1,000 Free Credits at https://build.nvidia.com/)")
    OPENAI_API_KEY: str = Field(default="", description="OpenAI API Key")
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API Key (100% Free at https://aistudio.google.com/)")
    GROQ_API_KEY: str = Field(default="", description="Groq Cloud API Key (100% Free at https://console.groq.com/)")
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434/v1", description="Ollama Local LLM Base URL")
    
    # Active LLM Selection
    LLM_PROVIDER: str = Field(
        default="auto", 
        description="LLM provider: 'auto' (detects NVIDIA/Gemini/Groq/OpenAI/Ollama), 'nvidia', 'gemini', 'groq', 'openai', or 'ollama'"
    )
    LLM_MODEL_NAME: str = Field(
        default="", 
        description="Override specific LLM model name (e.g. gemini-2.0-flash, llama-3.3-70b-versatile, gpt-4o-mini)"
    )
    
    OPENALEX_API_URL: str = Field(
        default="https://api.openalex.org/works",
        description="OpenAlex Academic Works API URL"
    )
    
    EMBEDDING_MODEL_NAME: str = Field(
        default="all-MiniLM-L6-v2",
        description="SentenceTransformers Embedding Model Name"
    )
    
    VECTOR_DIMENSION: int = Field(
        default=384,
        description="Embedding Vector Dimension (384 for MiniLM-L6-v2)"
    )
    
    CORS_ORIGINS: Union[str, List[str]] = Field(
        default=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
        description="Allowed CORS Origins"
    )
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
