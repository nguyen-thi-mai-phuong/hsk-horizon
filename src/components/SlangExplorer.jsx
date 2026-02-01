// src/components/SlangExplorer.jsx - AI-powered Chinese internet slang explorer
import { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const POPULAR_SLANG = [
  '666', 'yyds', '绝绝子', '内卷', '躺平', '摆烂', 'emo', '打工人',
  '凡尔赛', '社恐', '社牛', '破防', '上头', '下头', '种草', '拔草',
  '吃瓜', '瓜', 'CP', '磕CP', '舔狗', '备胎', '海王', '绿茶',
  '佛系', '摸鱼', '划水', '卷', '卷王', '卷不动',
];

export default function SlangExplorer({ lang = 'vi' }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (term) => {
    const q = term || query?.trim();
    if (!q) return;

    setLoading(true);
    setError('');
    setResult(null);

    if (!apiKey) {
      setError(lang === 'vi'
        ? 'Chưa cấu hình VITE_GEMINI_API_KEY trong file .env'
        : 'VITE_GEMINI_API_KEY not configured in .env');
      setLoading(false);
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `You are an expert on modern Chinese internet slang (网络用语) and youth culture.
Explain the slang term "${q}" in a structured way:
1. Meaning (literal and figurative)
2. Origin / etymology (where it came from)
3. Cultural context (when/how it's used)
4. Example sentences in Chinese with pinyin and ${lang === 'vi' ? 'Vietnamese' : 'English'} translation
5. Related terms if any

Respond in ${lang === 'vi' ? 'Vietnamese' : 'English'}. Be concise but informative.`;

      const res = await model.generateContent(prompt);
      const text = res?.response?.text?.() || '';

      setResult(text);
    } catch (err) {
      console.error('Slang Explorer error:', err);
      setError(lang === 'vi' ? 'Lỗi khi gọi API. Thử lại sau.' : 'API error. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    title: lang === 'vi' ? 'Khám phá tiếng lóng mạng Trung Quốc' : 'Chinese Internet Slang Explorer',
    subtitle: lang === 'vi' ? 'Tìm hiểu tiếng lóng hiện đại và bối cảnh văn hóa' : 'Explore modern slang and cultural context',
    placeholder: lang === 'vi' ? 'Nhập từ lóng (vd: 666, yyds, 内卷)...' : 'Enter slang (e.g. 666, yyds, 内卷)...',
    search: lang === 'vi' ? 'Tìm kiếm' : 'Search',
    popular: lang === 'vi' ? 'Phổ biến' : 'Popular',
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {labels.title}
        </h2>
        <p className="text-gray-600">{labels.subtitle}</p>
      </div>

      {/* Search */}
      <div className="mb-8 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={labels.placeholder}
            className="w-full rounded-xl border-2 border-gray-200 py-3 pl-12 pr-4 text-lg transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-medium text-white shadow transition-all hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60"
        >
          <Sparkles className="h-5 w-5" />
          {labels.search}
        </button>
      </div>

      {/* Popular tags */}
      <div className="mb-8">
        <p className="mb-3 text-sm font-medium text-gray-600">{labels.popular}</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SLANG.map((term) => (
            <button
              key={term}
              onClick={() => {
                setQuery(term);
                handleSearch(term);
              }}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 py-12">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>{lang === 'vi' ? 'Đang phân tích...' : 'Analyzing...'}</span>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="rounded-2xl border-2 border-indigo-200 bg-white p-8 shadow-lg">
          <div className="prose prose-indigo prose-headings:font-normal max-w-none whitespace-pre-wrap text-left text-gray-800">
            {result.replace(/\*\*(.+?)\*\*/g, '$1').replace(/^#+\s*/gm, '')}
          </div>
        </div>
      )}
    </div>
  );
}
