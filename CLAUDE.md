# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run

```bash
npm install      # Install dependencies
npm run build    # Compile TypeScript (tsc)
npm start        # Run server (node dist/index.js)
```

No test framework or linter is configured.

## Environment

Requires `GEMINI_API_KEY` env var. Create a `.env` file or export it directly.

Optional: `GEMINI_DEFAULT_MODEL` overrides the default model (falls back to `gemini-2.5-flash`).

## Manual Testing

Pipe JSON-RPC messages to stdin:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | GEMINI_API_KEY=your-key node dist/index.js
```

## Architecture

This is a **Model Context Protocol (MCP) server** that wraps Google Gemini's API. It communicates over **stdin/stdout using JSON-RPC 2.0** — there is no HTTP server.

**Source files:**
- `src/index.ts` — Entrypoint: I/O helpers (`send`, `reply`, `textReply`, `error`), request dispatch, readline listener
- `src/handlers.ts` — `createHandlers()` factory returning a handler map; individual tool handler functions
- `src/tools.ts` — Tool schema definitions (static JSON Schema data for MCP `tools/list`)
- `src/conversations.ts` — Conversation store with TTL pruning (30min expiry, max 100 conversations)
- `src/models.ts` — Model lists, defaults, `GEMINI_DEFAULT_MODEL` env var override
- `src/types.ts` — All type definitions: `RequestId`, `Responder`, `ToolHandler`, `Conversation`, MCP interfaces

**Request flow:** stdin line → JSON parse → `handleRequest` dispatches by MCP method (`initialize`, `tools/list`, `tools/call`) → `handleToolCall` looks up handler in map → handler executes → JSON-RPC response written to stdout.

**Tools exposed:** `generate_text`, `analyze_image`, `count_tokens`, `list_models`, `embed_text`.

**Conversation state:** Multi-turn conversations are tracked in-memory via `getHistory`/`saveHistory` in `conversations.ts`, keyed by `conversationId`. Conversations expire after 30 minutes of inactivity, with a hard cap of 100 concurrent conversations.

**Key dependency:** `@google/genai` — the official Google Generative AI SDK. Requires `GEMINI_API_KEY` env var.

## Project Config

- ES modules (`"type": "module"` in package.json)
- TypeScript strict mode, target ES2022, module NodeNext
- Output to `dist/`, source in `src/`
- Executable as CLI via shebang (`#!/usr/bin/env node`)

## Gotchas

- **Import extensions**: NodeNext module resolution requires `.js` extensions in imports (e.g., `import { MCPRequest } from './types.js'`), even though source files are `.ts`.
