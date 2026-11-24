from typing import Optional
from pydantic import BaseModel, Field

class ResearchAnalysisRequest(BaseModel):
    title: str = Field(..., min_length=3, description="Research title or core hypothesis / idea")
    abstract: Optional[str] = Field(default=None, description="Detailed research abstract or project description")
    domain: Optional[str] = Field(default=None, description="Academic domain or discipline (e.g. Computer Science, Medicine, AI)")
