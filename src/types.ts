import type { SafetySetting } from '@google/genai';

import type { MODELS } from './models.js';

export type GeminiModel = (typeof MODELS)[number];

export type RequestId = string | number;

export interface ConversationMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface Conversation {
  messages: ConversationMessage[];
  lastAccess: number;
}

export type ToolResult = { ok: true; text: string } | { ok: false; code: number; message: string };

export type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

export interface GenerateTextArgs {
  prompt: string;
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  jsonSchema?: object;
  grounding?: boolean;
  conversationId?: string;
  safetySettings?: SafetySetting[];
}

export interface AnalyzeImageArgs {
  prompt: string;
  imageBase64?: string;
  imageUrl?: string;
  model?: string;
}

export interface CodeReviewArgs {
  diff: string;
  context?: string;
  model?: string;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id?: RequestId;
  method: string;
  params?: Record<string, unknown>;
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
