import type { SafetySetting } from '@google/genai';

export type RequestId = string | number;

export interface ConversationMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface Conversation {
  messages: ConversationMessage[];
  lastAccess: number;
}

export type ToolName = 'generate_text' | 'analyze_image' | 'list_models' | 'code_review';

export type ToolResult = { ok: true; text: string } | { ok: false; message: string };

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
  maxTokens?: number;
}

export interface MCPToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface MCPToolDefinition {
  name: ToolName;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  annotations?: MCPToolAnnotations;
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
