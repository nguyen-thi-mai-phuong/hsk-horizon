// src/utils/ambiguityHighlighter.js - Gemini API call for entropy-based ambiguity detection
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Call Gemini API to identify words with multiple meanings (high semantic entropy) in the story text.
 * Returns array of Chinese words/phrases to highlight in red.
 * @param {string} storyText - Combined zh text from story items
 * @returns {Promise<string[]>} Array of ambiguous words
 */
export async function detectAmbiguousWords(storyText) {
  if (!apiKey || !storyText?.trim()) return [];

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are analyzing Chinese text for semantic ambiguity (entropy-based logic).
Identify Chinese words or short phrases (1-4 characters) that have MULTIPLE distinct meanings depending on context.
Return ONLY a JSON array of the exact Chinese strings to highlight. No explanation.
Example: ["行", "打", "意思"]
Text to analyze:
${storyText}`;

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || '[]';
    const cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Ambiguity detection error:', e);
    return [];
  }
}
