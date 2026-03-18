// API configuration for LeXIDesk backend
// Backend should be running at the configured URL with FastAPI wrapper

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ----------------------------
// TypeScript Interfaces
// ----------------------------
export interface SentenceDetectionRequest {
  text: string;
}

export interface SentenceDetectionResponse {
  sentences: string[];
  count: number;
}

export interface SummarizationRequest {
  text: string;
  compression_ratio?: number;
  top_k?: number;
}

export interface SummarizationResponse {
  summary: string;
  original_sentence_count: number;
  summary_sentence_count: number;
  sentences?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Request schema for /chat/qa
export interface ChatRequest {
  question: string;
  top_k?: number;
}

// Source chunk from FAISS retrieval
export interface SourceChunk {
  doc_id: string;
  page: number;
  text: string;
  distance: number;
  chunk_id: number;
}

// Response schema for /chat/qa
export interface ChatResponse {
  answer: string;
  sources: SourceChunk[];
}

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  status: string;
}

export interface RhetoricalRoleResponse {
  roles: Array<{ sentence: string; role: string }>;
}

export interface AbstractiveSummaryResponse {
  summary: string;
}

// ----------------------------
// Health Check
// ----------------------------
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

// ----------------------------
// Sentence Boundary Detection
// ----------------------------
export async function detectSentences(
  text: string
): Promise<SentenceDetectionResponse> {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sentence detection failed: ${errorText}`);
  }

  return response.json();
}

// ----------------------------
// Extractive Summarization
// ----------------------------
export async function summarizeText(
  text: string,
  options?: { compression_ratio?: number; top_k?: number; preserve_order?: boolean }
): Promise<SummarizationResponse> {
  const response = await fetch(`${API_BASE_URL}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      compression_ratio: options?.compression_ratio, // ✅ match backend key
      top_k: options?.top_k,
      preserve_order: options?.preserve_order ?? true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Summarization failed: ${error}`);
  }

  return await response.json();
}

// ----------------------------
// Document Upload for RAG
// ----------------------------
export async function uploadDocument(file: File): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Document upload failed: ${error}`);
  }

  return await response.json();
}

// ----------------------------
// Chat / RAG Q&A (CORRECT)
// ----------------------------
export async function sendChatMessage(
  question: string,
  topK: number = 5
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/qa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      top_k: topK,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Chat request failed: ${error}`);
  }

  return await response.json();
}

// ----------------------------
// Rhetorical Role Classifier
// ----------------------------
export async function classifyRhetoricalRoles(
  sentences: string[]
): Promise<RhetoricalRoleResponse> {
  const response = await fetch(`${API_BASE_URL}/classify-roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentences }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Rhetorical Role Classification failed: ${error}`);
  }

  return await response.json();
}

// ----------------------------
// Abstractive Summarization
// ----------------------------
export async function abstractiveSummarizeText(
  text: string
): Promise<AbstractiveSummaryResponse> {
  const response = await fetch(`${API_BASE_URL}/abstractive-summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Abstractive Summarization failed: ${error}`);
  }

  return await response.json();
}
