import logging
import numpy as np
from typing import List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.db.models import Document, AnalysisDocument
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)

class VectorService:
    async def index_and_rank_papers(
        self,
        db: AsyncSession,
        analysis_id: Any,
        papers: List[Dict[str, Any]],
        query_text: str,
        top_k: int = 15
    ) -> List[Tuple[Document, float, int]]:
        """
        Embed query & papers, persist papers to pgvector DB, compute cosine similarity, and return ranked top papers.
        """
        if not papers:
            return []

        query_embedding = embedding_service.get_embedding(query_text)
        
        indexed_documents: List[Document] = []
        
        for paper_data in papers:
            ext_id = paper_data["external_id"]
            
            stmt = select(Document).where(Document.external_id == ext_id)
            result = await db.execute(stmt)
            existing_doc = result.scalar_one_or_none()
            
            paper_text = f"{paper_data['title']} {paper_data.get('abstract', '')}"
            paper_vec = embedding_service.get_embedding(paper_text)
            
            if existing_doc:
                existing_doc.title = paper_data["title"]
                existing_doc.abstract = paper_data.get("abstract")
                existing_doc.authors = paper_data.get("authors")
                existing_doc.publication_date = paper_data.get("publication_date")
                existing_doc.url = paper_data.get("url")
                existing_doc.doi = paper_data.get("doi")
                existing_doc.venue = paper_data.get("venue")
                existing_doc.citation_count = paper_data.get("citation_count", 0)
                existing_doc.embedding = paper_vec
                indexed_documents.append(existing_doc)
            else:
                new_doc = Document(
                    external_id=ext_id,
                    source="paper",
                    title=paper_data["title"],
                    abstract=paper_data.get("abstract"),
                    authors=paper_data.get("authors"),
                    publication_date=paper_data.get("publication_date"),
                    url=paper_data.get("url"),
                    doi=paper_data.get("doi"),
                    venue=paper_data.get("venue"),
                    citation_count=paper_data.get("citation_count", 0),
                    embedding=paper_vec
                )
                db.add(new_doc)
                indexed_documents.append(new_doc)
                
        await db.flush()

        scored_docs: List[Tuple[Document, float]] = []
        query_np = np.array(query_embedding, dtype=np.float32)
        q_norm = np.linalg.norm(query_np)

        for doc in indexed_documents:
            if doc.embedding is not None:
                doc_vec = np.array(doc.embedding, dtype=np.float32)
                d_norm = np.linalg.norm(doc_vec)
                if q_norm > 0 and d_norm > 0:
                    similarity = float(np.dot(query_np, doc_vec) / (q_norm * d_norm))
                else:
                    similarity = 0.5
            else:
                similarity = 0.5
                
            similarity = max(0.0, min(1.0, similarity))
            scored_docs.append((doc, similarity))

        scored_docs.sort(key=lambda x: x[1], reverse=True)
        top_docs = scored_docs[:top_k]

        ranked_results: List[Tuple[Document, float, int]] = []
        for rank, (doc, sim) in enumerate(top_docs, 1):
            assoc = AnalysisDocument(
                analysis_id=analysis_id,
                document_id=doc.id,
                similarity=sim,
                rank=rank
            )
            db.add(assoc)
            ranked_results.append((doc, sim, rank))

        await db.flush()
        logger.info(f"Indexed and ranked {len(ranked_results)} papers for analysis {analysis_id}")
        return ranked_results

vector_service = VectorService()
