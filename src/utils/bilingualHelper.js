// src/utils/bilingualHelper.js - Handle mixed Object/String bilingual fields

/**
 * Resolve bilingual content: Object uses language key, String returns as-is
 * @param {object|string} field - theme, question, title, etc.
 * @param {string} lang - 'vi' | 'en'
 * @param {string} fallback - default if missing
 * @returns {string}
 */
export function resolveBilingual(field, lang, fallback = '') {
  if (field == null) return fallback;
  if (typeof field === 'string') return field;
  if (typeof field === 'object') {
    const val = field[lang] ?? field.en ?? field.vi ?? fallback;
    return typeof val === 'string' ? val : fallback;
  }
  return fallback;
}

/**
 * Resolve options array - each item can be string or { vi, en }
 */
export function resolveOptions(options, lang) {
  if (!Array.isArray(options)) return [];
  return options.map((opt) => resolveBilingual(opt, lang, String(opt)));
}
