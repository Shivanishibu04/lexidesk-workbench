"""
Chatbot Router - Production Grade
POST /chat/qa - RAG-based Q&A with FAISS retrieval

Supports:
- OpenAI GPT-4o-mini (if OPENAI_API_KEY is set)
- Google Gemini 1.5 Pro (if GEMINI_API_KEY is set)
- Fallback to retrieval-only mode
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from pathlib import Path
import os
from dotenv import load_dotenv

# Ensure env vars are loaded
load_dotenv()

# --------------------------------------------------
# Router initialization
# --------------------------------------------------
router = APIRouter(
    prefix="/chat",
    tags=["Chatbot"]
)

# --------------------------------------------------
# Request / Response Schemas
# --------------------------------------------------
class QARequest(BaseModel):
    question: str = Field(..., min_length=1)
    top_k: Optional[int] = Field(default=5, ge=1, le=50)

    class Config:
        extra = "ignore"  # Prevents 422 from extra frontend keys


class QAResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]


# --------------------------------------------------
# LLM Client Loader (SAFE + MODERN)
# --------------------------------------------------
def get_llm_client():
    """
    Returns (client, provider)
    provider ∈ {"openai", "gemini", None}
    """

    # ---------- OpenAI ----------
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        try:
            from openai import OpenAI
            return OpenAI(api_key=openai_key), "openai"
        except Exception:
            pass

    # ---------- Gemini (google-genai) ----------
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            print("[INFO] Gemini LLM client initialized successfully.")
            return client, "gemini"
        except ImportError:
            print("[WARN] Gemini SDK 'google-genai' not found. Try: pip install google-genai")
        except Exception as e:
            print(f"[ERROR] Failed to initialize Gemini client: {e}")

    print("[WARN] No LLM provider could be initialized. Check API keys and package installations.")
    return None, None


# --------------------------------------------------
# LLM Generation
# --------------------------------------------------
def generate_answer(question: str, context: str) -> str:
    client, provider = get_llm_client()

    if not provider:
        return (
            "No LLM API key configured (OPENAI_API_KEY or GEMINI_API_KEY).\n\n"
            "Showing retrieved passages only."
        )

    prompt = (
    "You are an AI Legal Assistant designed to help users understand legal documents.\n"
    "Answer ONLY using the information provided in the CONTEXT.\n"
    "Do NOT use external knowledge, assumptions, or guesses.\n"
    "If the answer is not clearly present in the CONTEXT, respond exactly with:\n"
    "'I cannot find this information in the provided documents.'\n\n"
    "Guidelines:\n"
    "- Provide clear and concise answers.\n"
    "- Base your response strictly on the provided context.\n"
    "- If multiple relevant points exist, summarize them clearly.\n"
    "- Do not fabricate legal clauses, facts, or interpretations.\n"
    "- If possible, reference or quote the relevant part of the context.\n\n"
    f"CONTEXT:\n{context}\n\n"
    f"QUESTION:\n{question}\n\n"
    "ANSWER:"
)

    # ---------- OpenAI ----------
    if provider == "openai":
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=512,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OpenAI error: {e}")

    # ---------- Gemini (New SDK) ----------
    if provider == "gemini":
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            print(f"[WARN] Gemini error: {e}")
            return (
                "LLM generation failed. Showing retrieved passages only.\n\n"
                + context[:1000]
                + ("..." if len(context) > 1000 else "")
            )

    # ---------- No LLM ----------
    return (
        "No LLM API key configured (OPENAI_API_KEY or GEMINI_API_KEY).\n\n"
        "Showing retrieved passages only."
    )


# --------------------------------------------------
# Main Q&A Endpoint
# --------------------------------------------------
@router.post("/qa", response_model=QAResponse)
def qa(req: QARequest):
    print(f"[/chat/qa] question='{req.question[:50]}...' top_k={req.top_k}")

    # ---------- Retrieval ----------
    try:
        from lexidesk_chatbot.retrieval.retriever import retrieve
        docs = retrieve(req.question, k=req.top_k)
    except FileNotFoundError:
        return QAResponse(
            answer="No documents have been indexed yet. Please upload a PDF first.",
            sources=[]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {e}")

    if not docs:
        return QAResponse(
            answer="I cannot find this information in the provided documents.",
            sources=[]
        )

    # ---------- Build Context ----------
    context = "\n\n".join(
        f"[Source: {d.get('doc_id')} | Page {d.get('page')}]\n{d.get('text')}"
        for d in docs
    )

    # ---------- Generate Answer ----------
    answer = generate_answer(req.question, context)

    return QAResponse(
        answer=answer,
        sources=docs
    )


# --------------------------------------------------
# Health Check
# --------------------------------------------------
@router.get("/health")
def chatbot_health():
    client, provider = get_llm_client()

    index_exists = (
        Path(__file__).resolve().parents[1]
        / "index"
        / "faiss.index"
    ).exists()

    return {
        "chatbot": "ok",
        "llm_provider": provider or "none",
        "index_exists": index_exists,
    }
