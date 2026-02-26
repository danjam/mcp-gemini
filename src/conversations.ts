import type { Conversation, ConversationMessage } from './types.js';

const MAX_CONVERSATIONS = 100;
const CONVERSATION_TTL_MS = 30 * 60 * 1000; // 30 minutes

const store = new Map<string, Conversation>();

function prune(): void {
  const now = Date.now();
  for (const [id, conv] of store) {
    if (now - conv.lastAccess > CONVERSATION_TTL_MS) {
      store.delete(id);
    }
  }
  if (store.size > MAX_CONVERSATIONS) {
    const sorted = [...store.entries()].sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    for (let i = 0; i < sorted.length - MAX_CONVERSATIONS; i++) {
      const entry = sorted[i];
      if (entry) store.delete(entry[0]);
    }
  }
}

export function clearStore(): void {
  store.clear();
}

export function getHistory(conversationId: string): ConversationMessage[] {
  return store.get(conversationId)?.messages ?? [];
}

export function saveHistory(conversationId: string, messages: ConversationMessage[]): void {
  store.set(conversationId, { messages, lastAccess: Date.now() });
  prune();
}
