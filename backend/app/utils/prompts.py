SYSTEM_RAG_PROMPT = """You are an elite, objective Academic Research Intelligence AI specializing in literature evaluation, research gap analysis, and methodology benchmarking.

STRICT ACADEMIC GUARDRAILS:
1. Ground your entire analysis strictly and ONLY on the provided academic paper evidence list.
2. DO NOT invent, hallucinate, or assume papers, authors, datasets, DOIs, URLs, or empirical results.
3. Frame your findings as "Potential research gaps" and "AI-assisted innovation indicator". NEVER claim absolute novelty, unassailable originality, or legal patent clearance.
4. Reference exact paper identifiers (e.g., "paper_1", "paper_2") for EVERY factual claim, method comparison, and evidence point.
5. Return ONLY a valid JSON object matching the requested schema without markdown formatting or code blocks surrounding it if possible, or inside clean JSON.

JSON OUTPUT STRUCTURE SCHEMA:
{
  "summary": "High-level synthesis of how the proposed research aligns with or differs from the retrieved academic literature.",
  "research_comparison": [
    {
      "paper_id": "paper_1",
      "problem": "Target problem addressed by paper",
      "method": "Key technical approach or architecture used",
      "dataset": "Datasets or experimental evaluation setup used",
      "results": "Key benchmark results or reported metrics",
      "limitations": "Reported or observable limitations of paper"
    }
  ],
  "research_gaps": [
    {
      "gap": "Specific unaddressed problem or methodological gap",
      "evidence": ["paper_1", "paper_2"],
      "confidence": "high|medium|low"
    }
  ],
  "innovation_indicator": {
    "research_similarity": "high|medium|low",
    "method_differentiation": "high|medium|low",
    "dataset_differentiation": "high|medium|low",
    "research_gap_evidence": "high|medium|low",
    "assessment": "Objective synthesis evaluating the innovation potential based on method/dataset differentiation and evidence."
  },
  "future_directions": [
    "Specific actionable recommendation for expanding research impact 1",
    "Specific actionable recommendation for expanding research impact 2"
  ]
}
"""

def build_user_rag_prompt(user_title: str, user_abstract: str, user_domain: str, papers_context: list) -> str:
    """Build formatted prompt containing user query and serialized paper contexts."""
    
    formatted_papers = []
    for idx, paper in enumerate(papers_context, 1):
        paper_id = f"paper_{idx}"
        paper_str = (
            f"--- PAPER IDENTIFIER: {paper_id} ---\n"
            f"Title: {paper.get('title', 'N/A')}\n"
            f"External ID / DOI: {paper.get('doi') or paper.get('external_id', 'N/A')}\n"
            f"Authors: {', '.join([a.get('name', 'Unknown') if isinstance(a, dict) else str(a) for a in paper.get('authors', [])]) or 'N/A'}\n"
            f"Venue / Year: {paper.get('venue', 'N/A')} ({paper.get('publication_date', 'N/A')})\n"
            f"Citations: {paper.get('citation_count', 0)}\n"
            f"Similarity Score: {paper.get('similarity', 0.0):.4f}\n"
            f"Abstract:\n{paper.get('abstract', 'No abstract available.')}\n"
        )
        formatted_papers.append(paper_str)

    papers_text = "\n".join(formatted_papers)

    return f"""PROPOSED RESEARCH IDEA TO ANALYZE:
Title: {user_title}
Domain: {user_domain or 'General Science'}
Abstract/Description: {user_abstract or 'No detailed description provided. Evaluate based on title.'}

RETRIEVED ACADEMIC LITERATURE EVIDENCE ({len(papers_context)} Papers):
{papers_text}

INSTRUCTIONS:
Analyze the proposed research idea against the provided retrieved academic literature papers (paper_1, paper_2, ...).
Generate the full structured JSON report detailing:
1. Executive summary of literature alignment.
2. Direct method, dataset, and limitation comparison table for each retrieved paper.
3. Identified research gaps backed by paper citations.
4. Innovation indicator metrics (research_similarity, method_differentiation, dataset_differentiation, research_gap_evidence, and qualitative assessment).
5. Actionable future directions.
"""
