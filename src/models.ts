// Last updated: 2026-02-26

export const MODELS = [
  'gemini-pro-latest',
  'gemini-flash-latest',
  'gemini-3.1-pro-preview',
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
] as const;

export const DEFAULT_MODEL: string = process.env.GEMINI_DEFAULT_MODEL ?? 'gemini-flash-latest';
