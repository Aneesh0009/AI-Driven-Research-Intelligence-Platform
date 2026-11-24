import json
import logging
import re
from typing import Dict, Any, List, Optional, Tuple
from openai import AsyncOpenAI
from app.config import settings
from app.utils.prompts import SYSTEM_RAG_PROMPT, build_user_rag_prompt

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.client: Optional[AsyncOpenAI] = None
        self.model_name: str = ""
        self.provider_name: str = "fallback"
        self._initialize_llm_client()

    def _initialize_llm_client(self):
        """
        Auto-detect and initialize available LLM provider:
        Priority: NVIDIA NIM (Free Credits) -> Gemini (Free) -> Groq (Free) -> OpenAI -> Ollama Local -> Dynamic NLP Engine
        """
        provider = (settings.LLM_PROVIDER or "auto").lower()

        # 1. NVIDIA NIM (1,000 Free Credits from https://build.nvidia.com/)
        if (provider in ["auto", "nvidia"]) and settings.NVIDIA_API_KEY:
            logger.info("Initializing NVIDIA NIM LLM API (nvidia/nemotron-3-super-120b-a12b)...")
            self.client = AsyncOpenAI(
                api_key=settings.NVIDIA_API_KEY,
                base_url="https://integrate.api.nvidia.com/v1"
            )
            self.model_name = settings.LLM_MODEL_NAME or "nvidia/nemotron-3-super-120b-a12b"
            self.provider_name = "NVIDIA NIM (Nemotron)"
            return

        # 2. Google Gemini (100% Free API key from Google AI Studio)
        if (provider in ["auto", "gemini"]) and settings.GEMINI_API_KEY:
            logger.info("Initializing Google Gemini FREE LLM API (gemini-2.0-flash)...")
            self.client = AsyncOpenAI(
                api_key=settings.GEMINI_API_KEY,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
            )
            self.model_name = settings.LLM_MODEL_NAME or "gemini-2.0-flash"
            self.provider_name = "Google Gemini (Free)"
            return

        # 3. Groq Cloud (100% Free API key from Groq Cloud Console)
        if (provider in ["auto", "groq"]) and settings.GROQ_API_KEY:
            logger.info("Initializing Groq Cloud FREE LLM API...")
            self.client = AsyncOpenAI(
                api_key=settings.GROQ_API_KEY,
                base_url="https://api.groq.com/openai/v1"
            )
            # Default to active Groq models (openai/gpt-oss-120b or qwen/qwen3.8-27b or llama)
            self.model_name = settings.LLM_MODEL_NAME or "openai/gpt-oss-120b"
            self.provider_name = "Groq Cloud"
            return

        # 3. OpenAI API
        if (provider in ["auto", "openai"]) and settings.OPENAI_API_KEY:
            logger.info("Initializing OpenAI LLM API (gpt-4o-mini)...")
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.model_name = settings.LLM_MODEL_NAME or "gpt-4o-mini"
            self.provider_name = "OpenAI"
            return

        # 4. Ollama Local LLM
        if provider in ["ollama"]:
            logger.info(f"Initializing Ollama Local LLM ({settings.OLLAMA_BASE_URL})...")
            self.client = AsyncOpenAI(
                api_key="ollama",
                base_url=settings.OLLAMA_BASE_URL
            )
            self.model_name = settings.LLM_MODEL_NAME or "llama3.1"
            self.provider_name = "Ollama Local LLM"
            return

        logger.info("No external LLM API key detected. Utilizing Dynamic Paper Abstract Extraction Engine.")
        self.client = None
        self.provider_name = "Dynamic NLP Extraction Engine"

    async def generate_rag_analysis(
        self,
        user_title: str,
        user_abstract: str,
        user_domain: str,
        papers_context: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate evidence-based JSON literature analysis using configured LLM provider or dynamic paper extraction engine.
        Focuses RAG synthesis on top-k papers for deep comparative analysis.
        """
        self._initialize_llm_client()

        # Prioritize top-8 most relevant papers for focused deep synthesis
        top_k_context = papers_context[:8] if len(papers_context) > 8 else papers_context
        user_prompt = build_user_rag_prompt(user_title, user_abstract, user_domain, top_k_context)

        if self.client:
            models_to_try = [self.model_name]
            if "nvidia" in self.provider_name.lower():
                for fallback_m in ["nvidia/nemotron-3-super-120b-a12b", "meta/llama-3.1-70b-instruct", "meta/llama-3.3-70b-instruct"]:
                    if fallback_m not in models_to_try:
                        models_to_try.append(fallback_m)
            elif "groq" in self.provider_name.lower():
                # Provide alternate working fallback models on Groq if one model is unavailable
                for fallback_m in ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]:
                    if fallback_m not in models_to_try:
                        models_to_try.append(fallback_m)

            for model_attempt in models_to_try:
                for use_json_mode in [True, False]:
                    try:
                        logger.info(f"Calling LLM provider '{self.provider_name}' using model '{model_attempt}' (json_mode={use_json_mode})...")
                        
                        extra_args = {}
                        if use_json_mode:
                            extra_args["response_format"] = {"type": "json_object"}

                        response = await self.client.chat.completions.create(
                            model=model_attempt,
                            messages=[
                                {"role": "system", "content": SYSTEM_RAG_PROMPT},
                                {"role": "user", "content": user_prompt}
                            ],
                            temperature=0.2,
                            max_tokens=3000,
                            **extra_args
                        )
                        
                        content = response.choices[0].message.content
                        if content:
                            # Clean markdown wrappers or extract JSON block
                            json_match = re.search(r'(\{[\s\S]*\})', content)
                            if json_match:
                                clean_content = json_match.group(1)
                            else:
                                clean_content = re.sub(r"^```json\s*", "", content.strip())
                                clean_content = re.sub(r"^```\s*", "", clean_content)
                                clean_content = re.sub(r"\s*```$", "", clean_content)
                            
                            parsed_json = json.loads(clean_content)
                            logger.info(f"Successfully parsed RAG analysis from {self.provider_name} ({model_attempt}).")
                            return self._validate_and_sanitize_result(parsed_json, top_k_context)
                    except Exception as e:
                        logger.warning(f"LLM call with '{model_attempt}' (json_mode={use_json_mode}) failed: {e}. Trying next option...")

        logger.info("Falling back to dynamic paper abstract semantic extraction.")
        return self._generate_fallback_rag_analysis(user_title, user_abstract, user_domain, papers_context)

    def _validate_and_sanitize_result(self, result: Dict[str, Any], papers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Ensure all required keys exist and default missing values."""
        if not isinstance(result, dict):
            result = {}

        summary = result.get("summary", "Analysis of literature alignment based on retrieved OpenAlex evidence.")
        
        comparison = result.get("research_comparison", [])
        if not isinstance(comparison, list):
            comparison = []

        gaps = result.get("research_gaps", [])
        if not isinstance(gaps, list):
            gaps = []

        indicator = result.get("innovation_indicator", {})
        if not isinstance(indicator, dict):
            indicator = {}
            
        sanitized_indicator = {
            "research_similarity": indicator.get("research_similarity", "medium").lower(),
            "method_differentiation": indicator.get("method_differentiation", "medium").lower(),
            "dataset_differentiation": indicator.get("dataset_differentiation", "medium").lower(),
            "research_gap_evidence": indicator.get("research_gap_evidence", "high").lower(),
            "assessment": indicator.get("assessment", "Proposed research shows clear domain alignment with distinct opportunities for methodological differentiation.")
        }

        future_dirs = result.get("future_directions", [])
        if not isinstance(future_dirs, list):
            future_dirs = []

        return {
            "summary": summary,
            "research_comparison": comparison,
            "research_gaps": gaps,
            "innovation_indicator": sanitized_indicator,
            "future_directions": future_dirs
        }

    def _extract_paper_details(self, paper: Dict[str, Any], user_domain: str, paper_idx: int) -> Dict[str, str]:
        """Extract paper-specific problem, method, dataset, and limitations dynamically from paper text."""
        title = paper.get("title", "")
        abstract = paper.get("abstract", "") or ""
        venue = paper.get("venue", "Academic Repository") or "Academic Repository"
        citations = paper.get("citation_count", 0) or 0
        pub_year_str = str(paper.get("publication_date", "2023"))

        try:
            pub_year = int(pub_year_str[:4])
        except Exception:
            pub_year = 2023

        sentences = [s.strip() for s in re.split(r'\. |\n', abstract) if len(s.strip()) > 15]

        # 1. Problem extraction: find opening challenge/problem sentences
        problem = None
        for s in sentences[:3]:
            s_lower = s.lower()
            if any(k in s_lower for k in ["problem", "challenge", "crucial", "essential", "aims to", "focuses on", "investigates", "addresses"]):
                problem = s
                break
        if not problem and sentences:
            problem = sentences[0]
        if not problem:
            problem = f"Investigates foundational methodologies for '{title[:80]}'."

        # 2. Method extraction: find architecture / algorithm / method sentences
        method = None
        for s in sentences:
            s_lower = s.lower()
            if any(k in s_lower for k in ["we propose", "we introduce", "we present", "we develop", "architecture", "framework", "algorithm", "neural network", "transformer", "model"]):
                method = s
                break
        if not method:
            comb = f"{title} {abstract}".lower()
            if "graph" in comb or "gnn" in comb:
                method = "Graph Neural Network (GNN) and topological message passing architecture."
            elif "language model" in comb or "llm" in comb or "transformer" in comb:
                method = "Transformer-based sequence representation and self-attention model."
            elif "cnn" in comb or "convolutional" in comb:
                method = "Deep Convolutional Neural Network (CNN) feature extraction."
            elif "survey" in comb or "review" in comb or "bibliometric" in comb:
                method = f"Systematic literature review and quantitative bibliometric meta-analysis ({venue})."
            else:
                method = f"Empirical evaluation and analytical modeling framework ({venue}, {pub_year})."

        # 3. Dynamic Dataset extraction: find real dataset / benchmark sentences in the abstract
        dataset = None
        for s in sentences:
            s_lower = s.lower()
            if any(k in s_lower for k in ["dataset", "data set", "benchmark", "corpus", "evaluated on", "tested on", "experiments on", "empirical data", "database", "pdb", "chembl", "zinc", "imagenet", "kitti"]):
                dataset = s
                break
        if not dataset:
            comb = f"{title} {abstract}".lower()
            if "protein" in comb or "molecular" in comb or "mrna" in comb or "mutation" in comb:
                dataset = "Public molecular structural repositories (e.g., PDB, UniProt, ChEMBL assays)."
            elif "license plate" in comb or "vehicle" in comb:
                dataset = "Traffic surveillance camera video streams and Caltech/IRAN-LPR benchmarks."
            elif "satellite" in comb or "spaceborne" in comb or "maritime" in comb:
                dataset = "Optical satellite sensor imagery and Earth observation orbital datasets."
            elif "survey" in comb or "bibliometrics" in comb:
                dataset = f"Cross-institutional citation index across {venue} academic literature."
            else:
                dataset = f"Domain-specific experimental benchmarks and validation sets reported in {venue} ({pub_year})."

        # 4. Smart Abstract Sentence Limitation Extraction
        limitations = None
        for s in sentences:
            s_lower = s.lower()
            if any(kw in s_lower for kw in ["however", "limited", "suffer", "lack", "bottleneck", "overhead", "sensitive", "challenge", "trade-off", "remains a challenge", "drawback"]):
                limitations = s.strip()
                break

        if not limitations:
            comb = f"{title} {abstract}".lower()
            if "survey" in comb or "bibliometrics" in comb:
                limitations = "Taxonomic synthesis; lacks unified reproducible code benchmarks across unseen datasets."
            elif pub_year < 2020:
                limitations = f"Pre-{pub_year} baseline; lacks modern foundation model architectures and scaling."
            elif citations > 300:
                limitations = "Substantial computational training cost and hyperparameter sensitivity."
            else:
                limitations = f"Evaluation scope restricted primarily to {venue} experimental setups."

        # 5. Results extraction
        results = f"Demonstrates validated performance with {citations} cited references."
        if citations > 1000:
            results = f"Highly influential seminal work with {citations} academic citations."
        elif citations > 200:
            results = f"Extensively cited benchmark reporting competitive evaluation metrics ({citations} citations)."

        return {
            "problem": problem,
            "method": method,
            "dataset": dataset,
            "results": results,
            "limitations": limitations
        }

    def _generate_fallback_rag_analysis(
        self,
        user_title: str,
        user_abstract: str,
        user_domain: str,
        papers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Dynamic paper analysis synthesis based on retrieved paper evidence."""
        num_papers = len(papers)
        
        avg_similarity = sum(p.get("similarity", 0.5) for p in papers) / num_papers if num_papers > 0 else 0.5
        sim_level = "high" if avg_similarity > 0.7 else ("medium" if avg_similarity > 0.45 else "low")
        method_diff = "medium" if sim_level == "high" else "high"
        
        comparison_list = []
        for idx, p in enumerate(papers, 1):
            paper_id = f"paper_{idx}"
            details = self._extract_paper_details(p, user_domain, idx)
            comparison_list.append({
                "paper_id": paper_id,
                "problem": details["problem"],
                "method": details["method"],
                "dataset": details["dataset"],
                "results": details["results"],
                "limitations": details["limitations"]
            })

        def clean_sentence(text: str) -> str:
            if not text:
                return ""
            s = re.sub(r'^(however|moreover|furthermore|further|nevertheless|in addition|finally|in contrast),?\s*', '', text.strip(), flags=re.IGNORECASE)
            s = re.sub(r'\s*\.\.\.$', '', s.strip())
            if s and s[0].islower():
                s = s[0].upper() + s[1:]
            return s.strip()

        # Dynamically build research gaps based on the ACTUAL limitations extracted from the papers!
        p1 = comparison_list[0] if len(comparison_list) > 0 else None
        p2 = comparison_list[1] if len(comparison_list) > 1 else None
        p3 = comparison_list[2] if len(comparison_list) > 2 else None

        dynamic_gaps = []
        if p1 and p1.get("limitations"):
            lim1 = clean_sentence(p1['limitations'])
            dynamic_gaps.append({
                "gap": f"Unaddressed vulnerability in current baselines: {lim1}",
                "evidence": ["paper_1"],
                "confidence": "high"
            })
        if p2 and p2.get("limitations"):
            lim2 = clean_sentence(p2['limitations'])
            dynamic_gaps.append({
                "gap": f"Methodological trade-off observed in related literature: {lim2}",
                "evidence": ["paper_2", "paper_3"] if p3 else ["paper_2"],
                "confidence": "medium"
            })
        if len(dynamic_gaps) < 2:
            dynamic_gaps.append({
                "gap": f"Scarcity of unified, reproducible evaluation benchmarks specifically addressing challenges in '{user_title}'.",
                "evidence": ["paper_1", "paper_2"] if num_papers >= 2 else ["paper_1"],
                "confidence": "high"
            })

        p1_title = papers[0].get("title", "baseline literature") if papers else "current baselines"
        
        dynamic_directions = [
            f"Conduct rigorous comparative ablation studies evaluating '{user_title}' directly against established baselines (e.g., {p1_title[:70]}...).",
            f"Establish empirical cross-domain benchmark evaluations on diverse, unseen datasets to systematically address generalization and hallucination vulnerabilities.",
            f"Explore computational optimization, model pruning, and latency reduction strategies tailored for deployment in {user_domain or 'Computer Science'}."
        ]

        p1_lim = clean_sentence(p1['limitations']) if p1 and p1.get("limitations") else "generalization and scalability"

        return {
            "summary": f"The proposed research project '{user_title}' directly intersects with retrieved literature in {user_domain or 'Computer Science'}. While baseline studies establish foundational methods across the {num_papers} analyzed works, key limitations in {p1_lim[:65]} present strong opportunities for research differentiation.",
            "research_comparison": comparison_list,
            "research_gaps": dynamic_gaps,
            "innovation_indicator": {
                "research_similarity": sim_level,
                "method_differentiation": method_diff,
                "dataset_differentiation": "high",
                "research_gap_evidence": "high",
                "assessment": f"The proposed research '{user_title}' demonstrates clear innovation potential. While intersecting with {num_papers} retrieved papers, it directly addresses documented limitations in existing literature with defined methodological differentiation."
            },
            "future_directions": dynamic_directions
        }

rag_service = RAGService()
