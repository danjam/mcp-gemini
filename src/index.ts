#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { GoogleGenAI } from '@google/genai';

import { createHandlers } from './handlers.js';
import { tools } from './tools.js';
import type { MCPRequest, MCPResponse, RequestId, ToolName } from './types.js';

const JSONRPC_METHOD_NOT_FOUND = -32601;
const JSONRPC_PARSE_ERROR = -32700;

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey });

function send(msg: MCPResponse): void {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

function reply(id: RequestId, result: unknown): void {
  send({ jsonrpc: '2.0', id, result });
}

function textReply(id: RequestId, text: string): void {
  reply(id, { content: [{ type: 'text', text }] });
}

function errorReply(id: RequestId, text: string): void {
  reply(id, { content: [{ type: 'text', text }], isError: true });
}

function error(id: RequestId, code: number, message: string): void {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

const handlers = createHandlers(genAI);

async function handleToolCall(id: RequestId, name: string, args: Record<string, unknown>): Promise<void> {
  if (!(name in handlers)) {
    error(id, JSONRPC_METHOD_NOT_FOUND, `Unknown tool: ${name}`);
    return;
  }
  const handler = handlers[name as ToolName];
  try {
    const result = await handler(args);
    if (result.ok) {
      textReply(id, result.text);
    } else {
      errorReply(id, result.message);
    }
  } catch (e) {
    errorReply(id, e instanceof Error ? e.message : 'Internal error');
  }
}

function handleRequest(req: MCPRequest): void {
  if (req.id == null) return;
  const id = req.id;

  switch (req.method) {
    case 'initialize':
      reply(id, {
        protocolVersion: '2025-11-25',
        serverInfo: { name: 'mcp-gemini', version: '1.0.0' },
        capabilities: { tools: {} },
        instructions:
          'Generate text, analyze images, and review code using Google Gemini. Use when working with the Gemini API for text generation, vision tasks, or code review.',
      });
      break;
    case 'tools/list':
      reply(id, { tools });
      break;
    case 'tools/call':
      void handleToolCall(id, req.params?.name as string, (req.params?.arguments ?? {}) as Record<string, unknown>);
      break;
    case 'ping':
      reply(id, {});
      break;
    default:
      error(id, JSONRPC_METHOD_NOT_FOUND, 'Method not found');
  }
}

const rl = createInterface({ input: process.stdin, terminal: false });
rl.on('line', function handleLine(line: string): void {
  if (!line.trim()) return;
  try {
    handleRequest(JSON.parse(line));
  } catch {
    send({ jsonrpc: '2.0', id: null, error: { code: JSONRPC_PARSE_ERROR, message: 'Parse error' } });
  }
});
