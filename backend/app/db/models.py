import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey, Index, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship
# pyrefly: ignore [missing-import]
from pgvector.sqlalchemy import Vector
from app.config import settings

Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String(50), nullable=False, default="paper")
    external_id = Column(String(255), unique=True, index=True, nullable=False)
    title = Column(Text, nullable=False)
    abstract = Column(Text, nullable=True)
    authors = Column(JSONB, nullable=True)
    publication_date = Column(String(50), nullable=True)
    url = Column(String(500), nullable=True)
    doi = Column(String(255), nullable=True)
    venue = Column(String(255), nullable=True)
    citation_count = Column(Integer, default=0)
    embedding = Column(Vector(settings.VECTOR_DIMENSION), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    analysis_associations = relationship("AnalysisDocument", back_populates="document", cascade="all, delete-orphan")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    abstract = Column(Text, nullable=True)
    domain = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    analysis_documents = relationship("AnalysisDocument", back_populates="analysis", cascade="all, delete-orphan")
    result = relationship("AnalysisResult", back_populates="analysis", uselist=False, cascade="all, delete-orphan")


class AnalysisDocument(Base):
    __tablename__ = "analysis_documents"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    similarity = Column(Float, nullable=False, default=0.0)
    rank = Column(Integer, nullable=False, default=1)

    analysis = relationship("Analysis", back_populates="analysis_documents")
    document = relationship("Document", back_populates="analysis_associations")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    summary = Column(Text, nullable=False)
    research_comparison = Column(JSONB, nullable=True)
    research_gaps = Column(JSONB, nullable=True)
    innovation_indicator = Column(JSONB, nullable=True)
    future_directions = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    analysis = relationship("Analysis", back_populates="result")
