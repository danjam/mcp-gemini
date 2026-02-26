# MCP Gemini

A Model Context Protocol (MCP) server that gives AI assistants access to Google's Gemini models. Use it to add text generation, image analysis, and more to any MCP-compatible client.

## Setup

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
      "args": ["github:danjam/mcp-gemini"],
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

By default, the server uses `gemini-2.5-flash`. To change this, add `GEMINI_DEFAULT_MODEL` to your environment:

```json
"env": {
  "GEMINI_API_KEY": "your-api-key-here",
  "GEMINI_DEFAULT_MODEL": "gemini-pro-latest"
}
```

## What You Can Do

### Generate Text

Ask Gemini to write, answer questions, summarize, translate, or anything else text-based.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `prompt` | Yes | What you want Gemini to do |
| `model` | No | Which model to use |
| `systemInstruction` | No | Set the tone or role (e.g. "You are a helpful tutor") |
| `temperature` | No | How creative the response is (0 = focused, 2 = creative). Default: 0.7 |
| `maxTokens` | No | Limit the response length. Default: 2048 |
| `grounding` | No | Let Gemini search the web for up-to-date answers |
| `conversationId` | No | Continue a multi-turn conversation (see below) |
| `jsonMode` | No | Get the response as structured JSON |
| `jsonSchema` | No | Define the exact shape of the JSON response |
| `safetySettings` | No | Adjust content filtering thresholds |

### Analyze Images

Send an image and ask questions about it — describe what's in a photo, read text from a screenshot, identify objects, and more. Provide either `imageUrl` or `imageBase64`.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `prompt` | Yes | Your question about the image |
| `imageUrl` | No | URL of the image to analyze |
| `imageBase64` | No | Base64-encoded image (with or without data URI prefix) |
| `model` | No | Which model to use |

### List Models

See all available Gemini models. No parameters needed.

### Code Review

Review a code diff for bugs, style issues, security concerns, and improvements. Uses low temperature (0.3) for focused, consistent feedback.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `diff` | Yes | The code diff or code to review |
| `context` | No | Focus areas or additional context (e.g. "focus on security") |
| `model` | No | Which model to use |

## Conversations

You can have multi-turn conversations where Gemini remembers what was said before. Pass the same `conversationId` across multiple `generate_text` calls:

1. First message: `{ "prompt": "What is photosynthesis?", "conversationId": "chat-1" }`
2. Follow-up: `{ "prompt": "Explain it to a 5-year-old", "conversationId": "chat-1" }`

Gemini will remember the first message when answering the follow-up.

Conversations expire after 30 minutes of inactivity.

## Available Models

| Model | Best For |
|-------|----------|
| `gemini-pro-latest` | Highest capability (currently points to 3.1 Pro) |
| `gemini-flash-latest` | Fast and capable (currently points to 3 Flash) |
| `gemini-3.1-pro-preview` | State-of-the-art reasoning |
| `gemini-3-pro-preview` | Advanced multimodal reasoning |
| `gemini-3-flash-preview` | Fast multimodal reasoning |
| `gemini-2.5-pro` | Complex reasoning, code, large context |
| `gemini-2.5-flash` | Fast general-purpose (default) |
| `gemini-2.5-flash-lite` | Lightweight, high-throughput tasks |

You can also pass any model name not on this list — the server will forward it to the Gemini API directly.

**Note:** Pro models are not available on the free Gemini API plan. If you see an error about usage limits being hit, this is normal — you'll need a paid plan to use them, or switch to a Flash model.

## License

MIT
