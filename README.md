# MCP Gemini

An [MCP](https://modelcontextprotocol.io/) server that lets AI assistants use Google's [Gemini](https://ai.google.dev/) models. Generate text, analyze images, review code, and more — with support for multi-turn conversations and web-grounded answers.

Works with Claude Desktop, Claude Code, or any MCP-compatible client.

---

## Use Cases

- Get a second opinion on code reviews
- Analyze screenshots or diagrams
- Summarize or translate long documents
- Have multi-turn conversations with Gemini for brainstorming
- Get up-to-date answers with Google Search grounding
- Generate structured JSON for use in other tools

---

## Setup

Requires [Node.js](https://nodejs.org/) 18+.

### 1. Get a Gemini API Key

Go to [Google AI Studio](https://aistudio.google.com/apikey) and create an API key.

### 2. Configure Your MCP Client

Add the server to your MCP client's configuration. There are two ways to do this:

**Option A: Run directly from GitHub (no install needed)**

```json
{
  "mcpServers": {
    "gemini": {
      "command": "npx",
      "args": ["-y", "github:danjam/mcp-gemini"],
      "env": {
        "GEMINI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Option B: Clone and run locally**

```bash
git clone https://github.com/danjam/mcp-gemini.git
cd mcp-gemini
npm install
```

Then point your MCP client at the local build:

```json
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": ["/path/to/mcp-gemini/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Replace `/path/to/mcp-gemini` with the actual path where you cloned the project.

### Changing the Default Model

By default, the server uses `gemini-flash-latest`. To change this, add `GEMINI_DEFAULT_MODEL` to your environment:

```json
"env": {
  "GEMINI_API_KEY": "your-api-key-here",
  "GEMINI_DEFAULT_MODEL": "gemini-pro-latest"
}
```

---

## What You Can Do

### Generate Text

Ask Gemini to write, answer questions, summarize, translate, or anything else text-based.

Tool: `generate_text`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | What you want Gemini to do |
| `model` | string | No | Which model to use |
| `systemInstruction` | string | No | Set the tone or role (e.g. "You are a helpful tutor") |
| `temperature` | number | No | How creative the response is (0 = focused, 2 = creative). Default: 0.7 |
| `maxTokens` | number | No | Limit the response length. Default: 2048 |
| `grounding` | boolean | No | Let Gemini search the web for up-to-date answers |
| `conversationId` | string | No | Continue a multi-turn conversation (see below) |
| `jsonMode` | boolean | No | Get the response as structured JSON |
| `jsonSchema` | object | No | Define the exact shape of the JSON response |
| `safetySettings` | array | No | Adjust content filtering thresholds |

### Analyze Images

Send an image and ask questions about it — describe what's in a photo, read text from a screenshot, identify objects, and more. Provide either `imageUrl` or `imageBase64`.

Tool: `analyze_image`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | Your question about the image |
| `imageUrl` | string | No | URL of the image to analyze |
| `imageBase64` | string | No | Base64-encoded image (with or without data URI prefix) |
| `model` | string | No | Which model to use |

### List Models

See all available Gemini models. No parameters needed.

Tool: `list_models`

### Code Review

Review a code diff for bugs, style issues, security concerns, and improvements. Uses low temperature (0.3) for focused, consistent feedback.

Tool: `code_review`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `diff` | string | Yes | The code diff or code to review |
| `context` | string | No | Focus areas or additional context (e.g. "focus on security") |
| `model` | string | No | Which model to use |

**Note:** Use `list_models` to see available models, or pass any model name directly. Pro models aren't available on the free tier — if you see a quota error, switch to a Flash model or upgrade your plan.

---

## Conversations

You can have multi-turn conversations where Gemini remembers what was said before. Pass the same `conversationId` across multiple `generate_text` calls:

1. First message: `{ "prompt": "What is photosynthesis?", "conversationId": "chat-1" }`
2. Follow-up: `{ "prompt": "Explain it to a 5-year-old", "conversationId": "chat-1" }`

Gemini will remember the first message when answering the follow-up.

Conversations expire after 30 minutes of inactivity.

---

## License

[MIT](LICENSE)
