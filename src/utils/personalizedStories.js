// src/utils/personalizedStories.js - Cache for personalized lesson stories
const CACHE_KEY = 'personalizedStories';

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Get cache key for a lesson: levelKey + lesson_id
 */
export function getStoryCacheKey(levelKey, lessonId) {
  return `${levelKey}:${lessonId ?? ''}`;
}

/**
 * Get cached personalized story for a lesson
 */
export function getCachedStory(levelKey, lessonId) {
  const cache = getCache();
  const key = getStoryCacheKey(levelKey, lessonId);
  return cache[key] ?? null;
}

/**
 * Save personalized story to cache
 */
export function saveStoryToCache(levelKey, lessonId, storyData) {
  if (!storyData) return;
  try {
    const cache = getCache();
    const key = getStoryCacheKey(levelKey, lessonId);
    cache[key] = { ...storyData, cachedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Failed to cache personalized story:', e);
  }
}
