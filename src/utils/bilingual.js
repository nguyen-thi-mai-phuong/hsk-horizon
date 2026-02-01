/**
 * Bilingual format helper - handles Object (vi/en) or String
 * @param {object|string} field - theme, question, title, etc.
 * @param {string} lang - 'vi' | 'en'
 * @param {string} fallback - default if missing
 * @returns {string}
 */
export function getBilingual(field, lang, fallback = '') {
  if (field == null) return fallback;
  if (typeof field === 'string') return field;
  if (typeof field === 'object') {
    const val = field[lang] ?? field.en ?? field.vi;
    return val != null ? String(val) : fallback;
  }
  return fallback;
}

/**
 * Get bilingual from array item (e.g. options)
 */
export function getBilingualOption(option, lang) {
  if (option == null) return '';
  if (typeof option === 'string') return option;
  return getBilingual(option, lang, '');
}
