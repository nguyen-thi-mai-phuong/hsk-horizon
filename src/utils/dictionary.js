// src/utils/dictionary.js - Local dictionary lookup from complete.min.json
// Optimized for Chinese character/word lookup: Pinyin + English meanings + Radical

const CACHED_WORDS_KEY = 'cachedWords';

let dictIndex = null;

/**
 * Build a Map index from the dictionary array for fast lookup.
 * Keys: exact character/word (s). Multi-char entries take precedence.
 */
function buildIndex(entries) {
  if (!Array.isArray(entries)) return new Map();
  const map = new Map();
  for (const entry of entries) {
    const key = entry?.s;
    if (!key || typeof key !== 'string') continue;
    map.set(key, entry);
  }
  return map;
}

/**
 * Load dictionary (lazy). Returns the index Map.
 */
async function loadDictionary() {
  if (dictIndex) return dictIndex;
  try {
    const mod = await import('../data/complete.min.json');
    const entries = mod.default ?? mod;
    dictIndex = buildIndex(Array.isArray(entries) ? entries : []);
    return dictIndex;
  } catch (e) {
    console.error('Dictionary load error:', e);
    dictIndex = new Map();
    return dictIndex;
  }
}

/**
 * Extract pinyin and meanings from a dictionary entry.
 */
function parseEntry(entry) {
  if (!entry) return null;
  const forms = entry.f ?? [];
  const first = Array.isArray(forms) ? forms[0] : null;
  if (!first) return null;
  const info = first.i ?? first;
  const pinyin = info?.y ?? info?.n ?? '';
  const meanings = first.m ?? [];
  const en = Array.isArray(meanings) ? meanings.join('; ') : String(meanings || '');
  const radical = entry.r ?? '';
  return { pinyin, en, radical };
}

/**
 * Lookup a character or word in the local dictionary.
 * @param {string} zh - Chinese character(s)
 * @returns {Promise<{pinyin:string, en:string, radical:string}|null>}
 */
export async function lookupLocal(zh) {
  if (!zh || typeof zh !== 'string') return null;
  const trimmed = zh.trim();
  if (!trimmed) return null;

  const index = await loadDictionary();
  // Try exact match first (word), then single char
  let entry = index.get(trimmed);
  if (!entry && trimmed.length > 1) {
    entry = index.get(trimmed[0]);
  }
  if (!entry) return null;
  return parseEntry(entry);
}

/**
 * Get cached word from localStorage (Gemini results).
 */
export function getCachedWord(zh) {
  try {
    const raw = localStorage.getItem(CACHED_WORDS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data[zh] ?? null;
  } catch (e) {
    return null;
  }
}

/**
 * Save a word to the cache (e.g. from Gemini API).
 */
export function saveToCache(entry) {
  if (!entry?.zh) return;
  try {
    const raw = localStorage.getItem(CACHED_WORDS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[entry.zh] = {
      zh: entry.zh,
      pinyin: entry.pinyin ?? '',
      vi: entry.vi ?? '',
      en: entry.en ?? '',
      radical: entry.radical ?? '',
    };
    localStorage.setItem(CACHED_WORDS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Cache save error:', e);
  }
}

/**
 * Universal lookup chain:
 * 1. lessonData (from segments/vocabulary_inventory)
 * 2. Local dictionary (complete.min.json)
 * 3. localStorage cachedWords
 * Returns { zh, pinyin, vi?, en, radical?, source } or null.
 * If not found, returns null (caller can trigger Gemini).
 */
export async function universalLookup(zh, lessonData = null) {
  if (!zh?.trim()) return null;

  const key = zh.trim();

  // 1. Lesson segments / vocabulary_inventory
  if (lessonData) {
    const { pinyin, vi, en } = lessonData;
    if (pinyin || vi || en) {
      return {
        zh: key,
        pinyin: pinyin ?? '',
        vi: vi ?? '',
        en: en ?? '',
        radical: lessonData.radical ?? '',
        source: 'lesson',
      };
    }
  }

  // 2. Local dictionary
  const local = await lookupLocal(key);
  if (local) {
    return {
      zh: key,
      pinyin: local.pinyin ?? '',
      vi: '',
      en: local.en ?? '',
      radical: local.radical ?? '',
      source: 'dictionary',
    };
  }

  // 3. Cached (Gemini results)
  const cached = getCachedWord(key);
  if (cached) {
    return {
      zh: key,
      pinyin: cached.pinyin ?? '',
      vi: cached.vi ?? '',
      en: cached.en ?? '',
      radical: cached.radical ?? '',
      source: 'cache',
    };
  }

  return null;
}
