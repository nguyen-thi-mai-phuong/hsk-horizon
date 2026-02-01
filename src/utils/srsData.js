// src/utils/srsData.js - localStorage utilities for SRS, categorized by HSK level
const SRS_DATA_KEY = 'srsData';
const LOOKUP_COUNT_KEY = 'srsLookupCount';

const DEFAULT_STATS = {
  easiness: 2.5,
  interval: 0,
  repetition: 0,
  nextReview: Date.now(),
  lastReview: null,
};

export function getLookupCount(zh) {
  try {
    const saved = localStorage.getItem(LOOKUP_COUNT_KEY);
    const data = saved ? JSON.parse(saved) : {};
    return data[zh] || 0;
  } catch (e) {
    return 0;
  }
}

export function incrementLookupCount(zh) {
  try {
    const saved = localStorage.getItem(LOOKUP_COUNT_KEY);
    const data = saved ? JSON.parse(saved) : {};
    data[zh] = (data[zh] || 0) + 1;
    localStorage.setItem(LOOKUP_COUNT_KEY, JSON.stringify(data));
    return data[zh];
  } catch (e) {
    return 0;
  }
}

export function getSrsData() {
  try {
    const saved = localStorage.getItem(SRS_DATA_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.error('Error reading srsData:', e);
    return {};
  }
}

/**
 * Normalize HSK level to string: '1', '2', ..., '7-9'
 * Do NOT use parseInt - always string-based.
 */
function toHskLevelString(level) {
  if (level == null) return '1';
  if (typeof level === 'string') {
    const s = level.trim();
    if (s === 'hsk7-9' || s === '7-9' || s === '7–9' || s.toLowerCase().includes('7-9')) return '7-9';
    const stripped = s.replace(/^hsk/i, '');
    const n = parseInt(stripped, 10);
    if (!isNaN(n) && n >= 7) return '7-9';
    if (!isNaN(n) && n >= 1 && n <= 6) return String(n);
    return '1';
  }
  const n = Number(level);
  if (n >= 7) return '7-9';
  if (n >= 1 && n <= 6) return String(n);
  return '1';
}

export function saveWordToSrs(word) {
  const data = getSrsData();
  const key = word.zh;
  if (data[key]) return false;

  const lookupCount = getLookupCount(key);
  const hasFriction = lookupCount > 2;
  const hskLevel = toHskLevelString(word.hskLevel);

  const stats = { ...DEFAULT_STATS };
  if (hasFriction) {
    stats.easiness = Math.max(1.3, 2.5 - 0.3);
    stats.interval = 0;
  }

  data[key] = {
    zh: word.zh,
    pinyin: word.pinyin || '',
    vi: word.vi || '',
    en: word.en || '',
    hskLevel,
    hsk_level: hskLevel,
    ...stats,
  };
  localStorage.setItem(SRS_DATA_KEY, JSON.stringify(data));
  return true;
}

export function isWordInSrs(zh) {
  return !!getSrsData()[zh];
}

export function updateSrsCard(zh, updatedCard) {
  const data = getSrsData();
  if (!data[zh]) return;
  data[zh] = { ...data[zh], ...updatedCard };
  localStorage.setItem(SRS_DATA_KEY, JSON.stringify(data));
}

/**
 * Get cards for a specific HSK level.
 * Strict filtering: word.hsk_level === selectedLevel (string comparison).
 * level: 'hsk1' | 'hsk2' | ... | 'hsk7-9' or '1' | '2' | ... | '7-9'
 */
export function getCardsByLevel(level) {
  const data = getSrsData();
  const target = level == null ? '1' : (typeof level === 'string' && level.startsWith('hsk')
    ? (level === 'hsk7-9' ? '7-9' : level.replace('hsk', ''))
    : toHskLevelString(level));
  return Object.values(data).filter((c) => {
    const cardLevel = toHskLevelString(c.hskLevel ?? c.hsk_level);
    return cardLevel === target;
  });
}

/**
 * Get queue: cards with nextReview <= now OR never reviewed (repetition === 0)
 */
export function getDueQueue(level) {
  const now = Date.now();
  const cards = getCardsByLevel(level);
  return cards.filter((c) => {
    const nextReview = c.nextReview ? new Date(c.nextReview).getTime() : 0;
    const repetition = c.repetition ?? 0;
    return nextReview <= now || repetition === 0;
  });
}

/**
 * Get SRS analytics: New (never reviewed), Learning (reviewed but due), Mastered (nextReview > now)
 */
export function getSrsAnalytics(level) {
  const now = Date.now();
  const cards = getCardsByLevel(level);

  let newCards = 0;
  let learning = 0;
  let mastered = 0;

  cards.forEach((c) => {
    const nextReview = c.nextReview ? new Date(c.nextReview).getTime() : 0;
    const repetition = c.repetition ?? 0;

    if (repetition === 0) {
      newCards++;
    } else if (nextReview <= now) {
      learning++;
    } else {
      mastered++;
    }
  });

  return { newCards, learning, mastered, total: cards.length };
}
