import logging
import uuid
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.models import Analysis, AnalysisResult, AnalysisDocument, Document
from app.schemas.request import ResearchAnalysisRequest
from app.schemas.response import (
    ResearchAnalysisResponse,
    PaperItem,
    ResearchAnalysisResult,
    ResearchComparisonItem,
    ResearchGapItem,
    InnovationIndicator
)
from app.services.openalex_service import openalex_service
from app.services.vector_service import vector_service
from app.services.rag_service import rag_service

logger = logging.getLogger(__name__)

class QueryService:
    async def analyze_research(
        self,
        db: AsyncSession,
        request: ResearchAnalysisRequest
    ) -> ResearchAnalysisResponse:
        """
        Execute full end-to-end research intelligence pipeline:
        Fetch -> Embed -> Store -> Vector Rank -> RAG LLM -> Store Result -> Response
        """
        logger.info(f"Starting research analysis for title: '{request.title}'")

        # 1. Create Analysis record
        analysis = Analysis(
            title=request.title,
            abstract=request.abstract,
            domain=request.domain
        )
        db.add(analysis)
        await db.flush()
        
        # 2. Fetch relevant academic papers from OpenAlex
        search_query = f"{request.title} {request.domain or ''}".strip()
        raw_papers = await openalex_service.fetch_papers(query=search_query, limit=15)
        
        # 3. Vector embedding, DB storage & pgvector cosine similarity ranking
        full_query = f"{request.title}\n{request.abstract or ''}\n{request.domain or ''}".strip()
        ranked_tuples = await vector_service.index_and_rank_papers(
            db=db,
            analysis_id=analysis.id,
            papers=raw_papers,
            query_text=full_query,
            top_k=15
        )
        
        # 4. Prepare context list for RAG
        papers_context: List[Dict[str, Any]] = []
        paper_items: List[PaperItem] = []
        
        for doc, sim, rank in ranked_tuples:
            authors_list = doc.authors if isinstance(doc.authors, list) else []
            
            paper_dict = {
                "id": str(doc.id),
                "external_id": doc.external_id,
                "title": doc.title,
                "abstract": doc.abstract,
                "authors": authors_list,
                "publication_date": doc.publication_date,
                "url": doc.url,
                "doi": doc.doi,
                "venue": doc.venue,
                "citation_count": doc.citation_count,
                "similarity": sim,
                "rank": rank
            }
            papers_context.append(paper_dict)
            paper_items.append(PaperItem(**paper_dict))

        # 5. Generate RAG Literature Analysis via LLM
        rag_data = await rag_service.generate_rag_analysis(
            user_title=request.title,
            user_abstract=request.abstract or "",
            user_domain=request.domain or "",
            papers_context=papers_context
        )

        # 6. Save AnalysisResult in database
        analysis_result = AnalysisResult(
            analysis_id=analysis.id,
            summary=rag_data["summary"],
            research_comparison=rag_data["research_comparison"],
            research_gaps=rag_data["research_gaps"],
            innovation_indicator=rag_data["innovation_indicator"],
            future_directions=rag_data["future_directions"]
        )
        db.add(analysis_result)
        await db.commit()

        # 7. Construct and return final Pydantic response
        formatted_result = ResearchAnalysisResult(
            summary=rag_data["summary"],
            research_comparison=[ResearchComparisonItem(**c) for c in rag_data["research_comparison"]],
            research_gaps=[ResearchGapItem(**g) for g in rag_data["research_gaps"]],
            innovation_indicator=InnovationIndicator(**rag_data["innovation_indicator"]),
            future_directions=rag_data["future_directions"]
        )

        return ResearchAnalysisResponse(
            analysis_id=str(analysis.id),
            title=analysis.title,
            abstract=analysis.abstract,
            domain=analysis.domain,
            created_at=analysis.created_at,
            papers=paper_items,
            result=formatted_result
        )

    async def get_analysis_by_id(
        self,
        db: AsyncSession,
        analysis_id: uuid.UUID
    ) -> Optional[ResearchAnalysisResponse]:
        """Retrieve existing analysis by UUID."""
        stmt = (
            select(Analysis)
            .options(
                selectinload(Analysis.analysis_documents).selectinload(AnalysisDocument.document),
                selectinload(Analysis.result)
            )
            .where(Analysis.id == analysis_id)
        )
        
        result = await db.execute(stmt)
        analysis = result.scalar_one_or_none()
        
        if not analysis or not analysis.result:
            return None

        # Format associated papers with rank and similarity
        sorted_assoc = sorted(analysis.analysis_documents, key=lambda x: x.rank)
        paper_items: List[PaperItem] = []
        
        for assoc in sorted_assoc:
            doc = assoc.document
            paper_items.append(
                PaperItem(
                    id=str(doc.id),
                    external_id=doc.external_id,
                    title=doc.title,
                    abstract=doc.abstract,
                    authors=doc.authors if isinstance(doc.authors, list) else [],
                    publication_date=doc.publication_date,
                    url=doc.url,
                    doi=doc.doi,
                    venue=doc.venue,
                    citation_count=doc.citation_count,
                    similarity=assoc.similarity,
                    rank=assoc.rank
                )
            )

        res = analysis.result
        formatted_result = ResearchAnalysisResult(
            summary=res.summary,
            research_comparison=[ResearchComparisonItem(**c) for c in (res.research_comparison or [])],
            research_gaps=[ResearchGapItem(**g) for g in (res.research_gaps or [])],
            innovation_indicator=InnovationIndicator(**(res.innovation_indicator or {
                "research_similarity": "medium",
                "method_differentiation": "medium",
                "dataset_differentiation": "medium",
                "research_gap_evidence": "high",
                "assessment": "Retrieved analysis result."
            })),
            future_directions=res.future_directions or []
        )

        return ResearchAnalysisResponse(
            analysis_id=str(analysis.id),
            title=analysis.title,
            abstract=analysis.abstract,
            domain=analysis.domain,
            created_at=analysis.created_at,
            papers=paper_items,
            result=formatted_result
        )

query_service = QueryService()
