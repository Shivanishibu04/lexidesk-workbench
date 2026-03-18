from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv
from pathlib import Path
import os
import shutil
import uuid

# Import ingestion + indexing logic
from lexidesk_chatbot.ingest.ingest import run as ingest_run
from lexidesk_chatbot.embeddings.indexer import build_index

# --------------------------------------------------
# Load .env as early as possible (before imports that use GEMINI_API_KEY)
# --------------------------------------------------
BASE_BACKEND_DIR = Path(__file__).parent.resolve()
load_dotenv(BASE_BACKEND_DIR / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("❌ GEMINI_API_KEY not found in .env")

# --------------------------------------------------
# Core ML / NLP imports
# --------------------------------------------------
from predict import segment_text
from src.summarizer import SentenceSummarizer
from src.rhetoric_role_pred import load_rhetorical_model, predict_roles
from src.role_aware_tfidf_mmr import summarize as role_aware_summarize, split_sentences as role_aware_split

# --------------------------------------------------
# Chatbot imports (ROUTER ONLY)
# --------------------------------------------------
# Import AFTER .env is loaded
from lexidesk_chatbot.api.router import router as chatbot_router

# --------------------------------------------------
# App initialization
# --------------------------------------------------
app = FastAPI(title="LexiDesk Backend API")

# --------------------------------------------------
# CORS
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Initialize summarizer ONCE
# --------------------------------------------------
summarizer = SentenceSummarizer()

# Initialize rhetorical model ONCE
print("Initializing rhetorical model...")
rhet_model, rhet_vocab, rhet_label_encoder = load_rhetorical_model()

# --------------------------------------------------
# Schemas
# --------------------------------------------------
class SentenceDetectionRequest(BaseModel):
    text: str

class SentenceDetectionResponse(BaseModel):
    sentences: List[str]
    count: int

class SummarizationRequest(BaseModel):
    text: str
    compression_ratio: Optional[float] = None
    top_k: Optional[int] = None
    preserve_order: Optional[bool] = True

class SummarizationResponse(BaseModel):
    summary: str
    original_sentence_count: int
    summary_sentence_count: int
    sentences: List[str]

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    status: str

class RhetoricalRoleRequest(BaseModel):
    sentences: List[str]

class RhetoricalRoleResponse(BaseModel):
    roles: List[dict]

# --------------------------------------------------
# Health & Root
# --------------------------------------------------
@app.get("/")
def root():
    return {"message": "LexiDesk backend is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

# --------------------------------------------------
# Sentence Detection module 
# --------------------------------------------------
@app.post("/predict", response_model=SentenceDetectionResponse)
def predict_sentences(req: SentenceDetectionRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty")

    try:
        sentences = segment_text(req.text)
        return {"sentences": sentences, "count": len(sentences)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --------------------------------------------------
# Summarization
# --------------------------------------------------
@app.post("/summarize", response_model=SummarizationResponse)
def summarize(req: SummarizationRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty")

    try:
        # Use the newly connected role-aware MMR summarizer
        selected, weights, component_scores = role_aware_summarize(
            judgement=req.text,
            rhet_model=rhet_model,
            vocab=rhet_vocab,
            label_encoder=rhet_label_encoder,
            compression=req.compression_ratio if req.compression_ratio is not None else 0.217,
            top_k=req.top_k,
            preserve_order=req.preserve_order if req.preserve_order is not None else True
        )
        
        # Get original sentence count for response
        orig_sentences = role_aware_split(req.text)

        return SummarizationResponse(
            summary=" ".join(selected),
            original_sentence_count=len(orig_sentences),
            summary_sentence_count=len(selected),
            sentences=selected,
        )
    except Exception as e:
        print(f"[Error] Role-aware summarization failed: {e}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

# --------------------------------------------------
# Rhetorical Role Classification
# --------------------------------------------------
@app.post("/classify-roles", response_model=RhetoricalRoleResponse)
def classify_roles(req: RhetoricalRoleRequest):
    if not req.sentences:
        raise HTTPException(status_code=400, detail="Sentence list cannot be empty")

    try:
        roles = predict_roles(req.sentences, rhet_model, rhet_vocab, rhet_label_encoder)
        
        # Combine into list of dicts for frontend
        results = []
        for sent, role in zip(req.sentences, roles):
            results.append({"sentence": sent, "role": role})
            
        return {"roles": results}
    except Exception as e:
        print(f"[Error] Rhetorical classification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --------------------------------------------------
# PDF Upload & Ingestion (FULL PIPELINE)
# --------------------------------------------------
@app.post("/upload", response_model=DocumentUploadResponse)
def upload(file: UploadFile = File(...)):
    try:
        # --------------------------------------------------
        # 1. Save uploaded PDF to a temp location
        # --------------------------------------------------
        uploads_dir = Path("uploads")
        uploads_dir.mkdir(exist_ok=True)

        document_id = str(uuid.uuid4())
        pdf_path = uploads_dir / f"{document_id}_{file.filename}"

        with open(pdf_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # --------------------------------------------------
        # 2. Run INGESTION (same as terminal)
        # python ingest/ingest.py file.pdf
        # --------------------------------------------------
        ingest_run([str(pdf_path)])

        # --------------------------------------------------
        # 3. Build / update FAISS index
        # python embeddings/indexer.py
        # --------------------------------------------------
        build_index()

        # --------------------------------------------------
        # 4. Cleanup
        # Remove the uploaded file after processing
        # --------------------------------------------------
        try:
            os.remove(pdf_path)
            print(f"[Cleanup] Deleted temporary upload: {pdf_path}")
        except Exception as cleanup_err:
            print(f"[Warn] Could not delete {pdf_path}: {cleanup_err}")

        return {
            "document_id": document_id,
            "filename": file.filename,
            "status": "ingested_and_indexed"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --------------------------------------------------
# Mount Chatbot Router
# --------------------------------------------------
app.include_router(chatbot_router)
