// API configuration and placeholder endpoints
// These will connect to the backend services

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

// Sentence Boundary Detection API
export async function detectSentences(text: string): Promise<SentenceDetectionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/detect-sentences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Sentence detection error:', error);
    // Fallback: Simple sentence splitting for demo
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);
    return {
      sentences,
      count: sentences.length,
    };
  }
}

// Extractive Summarization API
export async function summarizeText(
  text: string,
  options?: { compression_ratio?: number; top_k?: number }
): Promise<SummarizationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        ...options,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Summarization error:', error);
    // Fallback: Return first few sentences for demo
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const topK = options?.top_k || Math.ceil(sentences.length * 0.3);
    const summary = sentences.slice(0, topK).join(' ');
    return {
      summary,
      original_sentence_count: sentences.length,
      summary_sentence_count: topK,
    };
  }
}

// Document Upload API
export async function uploadDocument(file: File): Promise<DocumentUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/upload-document`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Document upload error:', error);
    // Fallback for demo
    return {
      document_id: `doc_${Date.now()}`,
      filename: file.name,
      status: 'processed',
    };
  }
}

// Chat/RAG API
export async function sendChatMessage(
  question: string,
  documentId?: string
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
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
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Chat error:', error);
    // Fallback for demo
    return {
      answer: `I understand you're asking about "${question}". This is a demo response. Please ensure the backend RAG service is running to get actual legal document analysis.`,
      relevant_passages: [
        'This is a sample passage that would be retrieved from the uploaded document.',
      ],
      sources: documentId ? ['Uploaded Document'] : undefined,
    };
  }
}
