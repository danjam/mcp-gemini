// Last updated: 2026-02-26

import type { GeminiModel, EmbeddingModel } from './types.js';

export const MODELS = [
  'gemini-pro-latest',
  'gemini-flash-latest',
  'gemini-3.1-pro-preview',
  'gemini-3.1-flash-image',
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  'gemini-3-deep-think',
  'nano-banana-pro',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash-live-native-audio',
] as const;

const FALLBACK_MODEL: GeminiModel = 'gemini-2.5-flash';

export const DEFAULT_MODEL: string = process.env.GEMINI_DEFAULT_MODEL ?? FALLBACK_MODEL;

export const EMBEDDING_MODELS = [
  'text-embedding-004',
  'text-multilingual-embedding-002',
] as const;

export const DEFAULT_EMBEDDING_MODEL: EmbeddingModel = 'text-embedding-004';
