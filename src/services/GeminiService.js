// src/services/GeminiService.js - Streaming Gemini API with typewriter support
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let genAIInstance = null;
function getGenAI() {
  if (!apiKey) return null;
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
}

/**
 * Generate content (non-streaming) - for simple one-shot calls
 */
export async function generateContent(prompt) {
  const genAI = getGenAI();
  if (!genAI) return null;
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result?.response?.text?.() ?? null;
  } catch (e) {
    console.error('Gemini generateContent error:', e);
    return null;
  }
}

/**
 * Stream content from Gemini. Yields text chunks.
 * @param {string} prompt
 * @yields {string} Text chunks
 */
export async function* generateContentStream(prompt) {
  const genAI = getGenAI();
  if (!genAI) return;
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContentStream(prompt);
    const stream = result.stream;
    for await (const chunk of stream) {
      const text = chunk.text?.();
      if (text) yield text;
    }
  } catch (e) {
    console.error('Gemini stream error:', e);
  }
}

/**
 * Consume stream and call onChunk for each piece (typewriter effect).
 * @param {AsyncGenerator<string>} stream
 * @param {(text: string) => void} onChunk - Called with accumulated text so far
 * @param {number} minDelay - Minimum ms between updates for smoother effect
 */
export async function streamText(stream, onChunk, minDelay = 30) {
  let full = '';
  let lastUpdate = 0;
  for await (const chunk of stream) {
    full += chunk;
    const now = Date.now();
    if (now - lastUpdate >= minDelay) {
      onChunk(full);
      lastUpdate = now;
    }
  }
  onChunk(full);
}

/**
 * Stream text from a prompt and feed to onChunk (typewriter effect).
 */
export async function streamPrompt(prompt, onChunk, minDelay = 30) {
  const stream = generateContentStream(prompt);
  await streamText(stream, onChunk, minDelay);
}

export function hasApiKey() {
  return !!apiKey;
}
