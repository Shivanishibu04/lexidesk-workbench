// API configuration for LeXIDesk backend
// Backend should be running at the configured URL with FastAPI wrapper

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

export interface ChatRequest {
  question: string;
  document_id?: string;
}

export interface ChatResponse {
  answer: string;
  relevant_passages?: string[];
  sources?: string[];
}

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  status: string;
}

// Health check to verify backend connection
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Sentence Boundary Detection API
// Connects to the CNN-CRF model in predict.py
export async function detectSentences(text: string): Promise<SentenceDetectionResponse> {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sentence detection failed: ${error}`);
  }

  return await response.json();
}

// Extractive Summarization API
// Connects to the LegalSummarizer in src/summarizer.py
export async function summarizeText(
  text: string,
  options?: { compression_ratio?: number; top_k?: number }
): Promise<SummarizationResponse> {
  const response = await fetch(`${API_BASE_URL}/summarize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      compression: options?.compression_ratio,
      top_k: options?.top_k,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Summarization failed: ${error}`);
  }

  return await response.json();
}

// Document Upload API for RAG chatbot
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

// Chat/RAG API for legal document Q&A
export async function sendChatMessage(
  question: string,
  documentId?: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      document_id: documentId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Chat request failed: ${error}`);
  }

  return await response.json();
}
