#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { GoogleGenAI } from '@google/genai';

import { createHandlers } from './handlers.js';
import { tools } from './tools.js';
import type { MCPRequest, MCPResponse, RequestId } from './types.js';

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

function error(id: RequestId, code: number, message: string): void {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

const handlers = createHandlers(genAI);

async function handleToolCall(id: RequestId, name: string, args: Record<string, unknown>): Promise<void> {
  const handler = handlers[name];
  if (!handler) {
    error(id, -32601, `Unknown tool: ${name}`);
    return;
  }
  try {
    const result = await handler(args);
    if (result.ok) {
      textReply(id, result.text);
    } else {
      error(id, result.code, result.message);
    }
  } catch (e) {
    error(id, -32603, e instanceof Error ? e.message : 'Internal error');
  }
}

function handleRequest(req: MCPRequest): void {
  if (req.id === undefined || req.id === null) return;
  const id = req.id;

  switch (req.method) {
    case 'initialize':
      reply(id, {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'mcp-gemini', version: '1.0.0' },
        capabilities: { tools: {} },
      });
      break;
    case 'tools/list':
      reply(id, { tools });
      break;
    case 'tools/call':
      handleToolCall(id, req.params?.name as string, (req.params?.arguments ?? {}) as Record<string, unknown>);
      break;
    default:
      error(id, -32601, 'Method not found');
  }
}

const rl = createInterface({ input: process.stdin, terminal: false });
rl.on('line', function handleLine(line: string): void {
  if (!line.trim()) return;
  try {
    handleRequest(JSON.parse(line));
  } catch {
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
  }
});
