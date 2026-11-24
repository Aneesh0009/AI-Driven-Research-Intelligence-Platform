import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.request import ResearchAnalysisRequest
from app.schemas.response import ResearchAnalysisResponse
from app.services.query_service import query_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/research", tags=["Research Intelligence"])

@router.post(
    "/analyze",
    response_model=ResearchAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Analyze Academic Research Idea",
    description="Ingests OpenAlex literature, embeds vector representations, computes pgvector similarity, and synthesizes evidence-backed RAG analysis."
)
async def analyze_research(
    request: ResearchAnalysisRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        response = await query_service.analyze_research(db, request)
        return response
    except Exception as e:
        logger.exception("Error executing research analysis pipeline:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process research intelligence pipeline: {str(e)}"
        )

@router.get(
    "/{analysis_id}",
    response_model=ResearchAnalysisResponse,
    summary="Retrieve Research Analysis by ID",
    description="Fetches stored academic literature analysis report and vector-ranked paper list."
)
async def get_analysis(
    analysis_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    analysis = await query_service.get_analysis_by_id(db, analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Research analysis with ID '{analysis_id}' was not found."
        )
    return analysis
