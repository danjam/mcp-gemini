import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { parseImageData, createHandlers } from '../dist/handlers.js';
import { appendTurn, getHistory, clearStore } from '../dist/conversations.js';

// -- parseImageData --

describe('parseImageData', () => {
  it('parses data URI with mime type', () => {
    const result = parseImageData('data:image/png;base64,abc123');
    assert.deepStrictEqual(result, { mimeType: 'image/png', data: 'abc123' });
  });

  it('parses data URI with different mime type', () => {
    const result = parseImageData('data:image/webp;base64,xyz');
    assert.deepStrictEqual(result, { mimeType: 'image/webp', data: 'xyz' });
  });

  it('falls back to image/jpeg for raw base64', () => {
    const result = parseImageData('abc123raw');
    assert.deepStrictEqual(result, { mimeType: 'image/jpeg', data: 'abc123raw' });
  });
});

// -- handleGenerateText validation --

describe('handleGenerateText validation', () => {
  // Dummy genAI — validation errors return before any SDK call
  const handlers = createHandlers({});

  it('rejects temperature below 0', async () => {
    const result = await handlers.generate_text({ prompt: 'test', temperature: -1 });
    assert.equal(result.ok, false);

    assert.match(result.message, /temperature/i);
  });

  it('rejects temperature above 2', async () => {
    const result = await handlers.generate_text({ prompt: 'test', temperature: 3 });
    assert.equal(result.ok, false);

  });

  it('rejects non-integer maxTokens', async () => {
    const result = await handlers.generate_text({ prompt: 'test', maxTokens: 1.5 });
    assert.equal(result.ok, false);

    assert.match(result.message, /maxTokens/i);
  });

  it('rejects maxTokens of 0', async () => {
    const result = await handlers.generate_text({ prompt: 'test', maxTokens: 0 });
    assert.equal(result.ok, false);

  });

  it('rejects negative maxTokens', async () => {
    const result = await handlers.generate_text({ prompt: 'test', maxTokens: -10 });
    assert.equal(result.ok, false);

  });
});

// -- Conversation store --

describe('conversation store', () => {
  beforeEach(() => {
    clearStore();
  });

  it('returns empty array for unknown conversationId', () => {
    const history = getHistory('nonexistent');
    assert.deepStrictEqual(history, []);
  });

  it('saves and retrieves conversation via appendTurn', () => {
    appendTurn('conv1', 'hello', 'hi there');
    const history = getHistory('conv1');
    assert.deepStrictEqual(history, [
      { role: 'user', parts: [{ text: 'hello' }] },
      { role: 'model', parts: [{ text: 'hi there' }] },
    ]);
  });

  it('appends to existing conversation', () => {
    appendTurn('conv1', 'hello', 'hi there');
    appendTurn('conv1', 'how are you?', 'fine thanks');
    assert.deepStrictEqual(getHistory('conv1'), [
      { role: 'user', parts: [{ text: 'hello' }] },
      { role: 'model', parts: [{ text: 'hi there' }] },
      { role: 'user', parts: [{ text: 'how are you?' }] },
      { role: 'model', parts: [{ text: 'fine thanks' }] },
    ]);
  });
});
