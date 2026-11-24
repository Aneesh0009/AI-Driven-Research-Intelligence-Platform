from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

class PaperItem(BaseModel):
    id: str
    external_id: str
    title: str
    abstract: Optional[str] = None
    authors: List[Any] = []
    publication_date: Optional[str] = None
    url: Optional[str] = None
    doi: Optional[str] = None
    venue: Optional[str] = None
    citation_count: int = 0
    similarity: float = 0.0
    rank: int = 1

    model_config = ConfigDict(from_attributes=True)


class ResearchComparisonItem(BaseModel):
    paper_id: str
    problem: str
    method: str
    dataset: str
    results: str
    limitations: str


class ResearchGapItem(BaseModel):
    gap: str
    evidence: List[str]
    confidence: str  # "high" | "medium" | "low"


class InnovationIndicator(BaseModel):
    research_similarity: str  # "high" | "medium" | "low"
    method_differentiation: str  # "high" | "medium" | "low"
    dataset_differentiation: str  # "high" | "medium" | "low"
    research_gap_evidence: str  # "high" | "medium" | "low"
    assessment: str


class ResearchAnalysisResult(BaseModel):
    summary: str
    research_comparison: List[ResearchComparisonItem] = []
    research_gaps: List[ResearchGapItem] = []
    innovation_indicator: InnovationIndicator
    future_directions: List[str] = []


class ResearchAnalysisResponse(BaseModel):
    analysis_id: str
    title: str
    abstract: Optional[str] = None
    domain: Optional[str] = None
    created_at: datetime
    papers: List[PaperItem] = []
    result: ResearchAnalysisResult

    model_config = ConfigDict(from_attributes=True)


class HealthResponse(BaseModel):
    status: str
    database: str
    version: str = "1.0.0"
