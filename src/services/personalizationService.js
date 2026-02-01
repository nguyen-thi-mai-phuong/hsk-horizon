// src/services/personalizationService.js - AI personalization for lessons
import { generateContent, streamPrompt } from './GeminiService';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

function buildStoryPrompt(lesson, userProfile, lang) {
  const vocab = (lesson.vocabulary_inventory ?? []).concat(
    (lesson.story ?? []).flatMap((s) => s?.segments ?? [])
  );
  const vocabList = [...new Set(vocab.map((v) => v?.zh).filter(Boolean))].join('、') || '通用词汇';
  const originalText = lesson.story.map((s) => s.zh).join('\n');
  const name = userProfile.name;
  const goal = userProfile.target_goal || (lang === 'vi' ? 'học tiếng Trung' : 'learn Chinese');
  const hobbies = Array.isArray(userProfile.hobbies) ? userProfile.hobbies.join('、') : (userProfile.hobbies || '');

  return lang === 'vi'
    ? `Bạn là giáo viên HSK. Viết lại câu chuyện sau bằng tiếng Trung (chỉ dùng Hán tự), tích hợp ngữ cảnh cá nhân:
- Tên học viên: ${name}
- Mục tiêu: ${goal}
- Sở thích: ${hobbies}

Từ vựng BẮT BUỘC phải dùng (ít nhất 80%): ${vocabList}

Câu chuyện gốc:
${originalText}

Yêu cầu: 
1. Xác định câu chuyện gốc là đối thoại (có lời nhân vật) hay tường thuật (kể chuyện). 
2. Nếu là đối thoại: giữ cấu trúc từng dòng cho mỗi lượt lời, xuống dòng rõ ràng giữa các nhân vật.
3. Nếu là tường thuật: giữ mạch văn, đoạn văn logic.
4. Viết lại câu chuyện mới, dùng tên "${name}", nhắc đến mục tiêu/sở thích nếu phù hợp.
5. Chỉ trả lời bằng văn bản tiếng Trung, không giải thích. Giữ độ dài tương đương.`
    : `You are an HSK teacher. Rewrite the following story in Chinese (Chinese characters only), integrating personal context:
- Student name: ${name}
- Target goal: ${goal}
- Hobbies: ${hobbies}

REQUIRED vocabulary (use at least 80%): ${vocabList}

Original story:
${originalText}

Requirements:
1. First check if the original story is DIALOGUE (character speech) or NARRATIVE (storytelling).
2. If DIALOGUE: preserve the structure with clear line breaks between each speaker's turn. Keep one line per speech.
3. If NARRATIVE: preserve paragraph flow and logical structure.
4. Rewrite a new story using name "${name}", mention goal/hobbies if relevant.
5. Reply ONLY with Chinese text, no explanation. Keep similar length.`;
}

/**
 * Generate a personalized story (non-streaming). For cache lookup fallback.
 */
export async function personalizeStory(lesson, userProfile, lang = 'en') {
  if (!apiKey || !lesson?.story?.length) return null;
  if (!userProfile?.name) return null;
  const prompt = buildStoryPrompt(lesson, userProfile, lang);
  return await generateContent(prompt);
}

/**
 * Stream personalized story with typewriter effect. Calls onChunk(text) as text arrives.
 */
export async function streamPersonalizeStory(lesson, userProfile, lang, onChunk) {
  if (!apiKey || !lesson?.story?.length) return;
  if (!userProfile?.name) return;
  const prompt = buildStoryPrompt(lesson, userProfile, lang);
  await streamPrompt(prompt, onChunk, 25);
}

/**
 * Generate a short personalized example sentence for a word (<15 words).
 * @param {string} word - Chinese word (zh)
 * @param {string} meaning - English or Vietnamese meaning
 * @param {object} userProfile - { name, target_goal, hobbies }
 * @param {string} lang - 'vi' | 'en'
 * @returns {Promise<string|null>}
 */
export async function getPersonalizedExample(word, meaning, userProfile, lang = 'en') {
  if (!apiKey || !word?.trim()) return null;
  if (!userProfile?.name) return null;

  const name = userProfile.name;
  const goal = userProfile.target_goal || '';
  const hobbies = Array.isArray(userProfile.hobbies) ? userProfile.hobbies.join(', ') : (userProfile.hobbies || '');

  const prompt = lang === 'vi'
    ? `Tạo MỘT câu tiếng Trung ngắn (<15 từ) dùng từ "${word}" (${meaning}), liên quan đến: tên ${name}, mục tiêu "${goal}", sở thích "${hobbies}". Chỉ trả lời câu tiếng Trung, không giải thích.`
    : `Create ONE short Chinese sentence (<15 words) using the word "${word}" (${meaning}), related to: name ${name}, goal "${goal}", hobbies "${hobbies}". Reply ONLY with the Chinese sentence, no explanation.`;

  return await generateContent(prompt);
}
