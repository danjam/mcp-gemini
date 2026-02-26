import type { MODELS, EMBEDDING_MODELS } from './models.js';

export type GeminiModel = (typeof MODELS)[number];

export type EmbeddingModel = (typeof EMBEDDING_MODELS)[number];

export type RequestId = string | number;

export interface ConversationMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface Conversation {
  messages: ConversationMessage[];
  lastAccess: number;
}

export interface Responder {
  textReply: (id: RequestId, text: string) => void;
  error: (id: RequestId, code: number, message: string) => void;
}

export type ToolHandler = (id: RequestId, args: Record<string, any>) => Promise<void>;

export interface MCPRequest {
  jsonrpc: '2.0';
  id?: RequestId;
  method: string;
  params?: Record<string, any>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: RequestId | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}
