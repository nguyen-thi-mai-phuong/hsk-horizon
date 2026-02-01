// src/utils/geminiLookup.js - Gemini API fallback for word lookup, saves to cache
import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveToCache } from './dictionary';
import { getRadical } from './characterData';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Fetch word definition from Gemini API. Saves result to cachedWords.
 * @param {string} zh - Chinese character(s)
 * @param {string} lang - 'vi' | 'en'
 * @param {string} context - Optional sentence context
 * @returns {Promise<{zh, pinyin, vi, en, radical}|null>}
 */
export async function fetchFromGemini(zh, lang = 'en', context = '') {
  if (!zh?.trim()) return null;
  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = lang === 'vi'
      ? `Cho từ/âm tiết Hán tự "${zh}"${context ? ` trong câu: "${context}"` : ''}.
Trả lời JSON chính xác theo format:
{"pinyin":"...","vi":"nghĩa tiếng Việt","en":"English meaning"}
Chỉ trả lời JSON, không giải thích thêm.`
      : `For the Chinese character/word "${zh}"${context ? ` in sentence: "${context}"` : ''}.
Return exact JSON:
{"pinyin":"...","vi":"Vietnamese meaning","en":"English meaning"}
Only JSON, no explanation.`;

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || '{}';
    const cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const pinyin = parsed?.pinyin ?? '';
    const vi = parsed?.vi ?? '';
    const en = parsed?.en ?? '';
    const radical = getRadical(zh);
    const hanViet = getHanViet(zh);

    const entry = {
      zh: zh.trim(),
      pinyin,
      vi,
      en,
      radical: radical && radical !== '—' ? radical : '',
    };
    saveToCache(entry);
    return entry;
  } catch (e) {
    console.error('Gemini lookup error:', e);
    return null;
  }
}
