// src/components/StoryCharacterPopover.jsx - Pop-over with Priority indicator + Personal Example
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, AlertTriangle, Sparkles } from 'lucide-react';
import { getRadical, getHanViet } from '../utils/characterData';
import { getLookupCount } from '../utils/srsData';
import { getPersonalizedExample } from '../services/personalizationService';

export default function StoryCharacterPopover({
  word,
  position,
  onClose,
  onSave,
  isInSrs,
  language,
  isLoading = false,
  userProfile = null,
}) {
  if (!word) return null;

  const radical = word.radical ?? getRadical(word.zh);
  const hanViet = word.hanViet ?? getHanViet(word.zh);
  const hasRadical = radical && radical !== '—';
  const hasHanViet = hanViet && hanViet !== '—';
  const lookupCount = getLookupCount(word.zh);
  const isDifficult = lookupCount > 2;

  const [personalExample, setPersonalExample] = useState(null);
  const [personalExampleLoading, setPersonalExampleLoading] = useState(false);

  const handlePersonalExampleClick = async () => {
    if (!word?.zh || !userProfile?.name || personalExampleLoading) return;
    setPersonalExample(null);
    setPersonalExampleLoading(true);
    const meaning = language === 'vi' ? (word.vi || word.en) : (word.en || word.vi);
    try {
      const res = await getPersonalizedExample(word.zh, meaning || '', userProfile, language);
      if (res?.trim()) setPersonalExample(res.trim());
    } catch {
      // Silently fail
    } finally {
      setPersonalExampleLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed z-[60] min-w-[180px] max-w-[220px] rounded-xl border-2 border-indigo-200 bg-white p-3 shadow-xl transition-shadow duration-200"
      style={{
        left: Math.min(position?.x ?? 0, window.innerWidth - 220),
        top: Math.max((position?.y ?? 0) - 120, 10),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-2xl font-bold text-indigo-800">{word.zh}</span>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="text-sm italic text-indigo-600">
          {isLoading ? (language === 'vi' ? 'Đang tải...' : 'Loading...') : (word.pinyin || '—')}
        </p>
        {(word.vi || word.en) && (
          <p className="text-sm text-gray-700">
            {language === 'vi' ? word.vi : word.en}
          </p>
        )}
        {isDifficult && (
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1.5 text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium">
              {language === 'vi' ? 'Ưu tiên (Khó)' : 'Priority: Difficult'}
            </span>
          </div>
        )}
        {hasRadical && (
          <p className="text-xs text-gray-500">
            {language === 'vi' ? 'Bộ thủ' : 'Radical'}: {radical}
          </p>
        )}
        {hasHanViet && (
          <p className="text-xs text-gray-500">
            {language === 'vi' ? 'Hán-Việt' : 'Han-Viet'}: {hanViet}
          </p>
        )}
        {userProfile?.name && (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-2 py-1.5">
            <button
              type="button"
              onClick={handlePersonalExampleClick}
              disabled={personalExampleLoading}
              className="flex w-full items-center gap-1 text-left text-xs font-medium text-indigo-700 transition-colors hover:text-indigo-800 disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              {language === 'vi' ? 'Ví dụ cá nhân' : 'Personal Example'}
            </button>
            {personalExampleLoading ? (
              <p className="mt-1 text-xs italic text-gray-500">{language === 'vi' ? 'Đang tạo...' : 'Generating...'}</p>
            ) : personalExample ? (
              <p className="mt-1 text-sm text-gray-800">{personalExample}</p>
            ) : null}
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave?.(word);
            onClose?.();
          }}
          disabled={isInSrs}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Bookmark className="h-4 w-4" />
          {isInSrs
            ? (language === 'vi' ? 'Đã lưu' : 'Saved')
            : (language === 'vi' ? 'Lưu vào SRS' : 'Save to Review')}
        </button>
      </div>
    </motion.div>
  );
}
