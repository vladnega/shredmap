import { createOpenAI } from '@ai-sdk/openai';

/**
 * Returns an OpenAI provider instance when `OPENAI_API_KEY` is set.
 * Used by API routes; returns null when AI is not configured (local dev without keys).
 */
export function getOpenAIProvider() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return createOpenAI({ apiKey });
}

export function getDefaultChatModel() {
  return process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
}
