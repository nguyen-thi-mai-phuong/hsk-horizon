// src/components/CharacterAnalyzer.jsx - Clean input, Pinyin, Radicals, meanings, hanzi-writer
import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import HanziWriter from 'hanzi-writer';
import { getRadical, getHanViet } from '../utils/characterData';

export default function CharacterAnalyzer({ lang = 'vi' }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const writerRef = useRef(null);
  const containerRef = useRef(null);

  const analyze = () => {
    setError(null);
    setResult(null);
    if (writerRef.current) {
      writerRef.current = null;
    }

    const trimmed = input.trim();
    if (!trimmed) {
      setError(lang === 'vi' ? 'Vui lòng nhập một chữ Hán' : 'Please enter one Chinese character');
      return;
    }

    const char = trimmed[0];
    const pinyinMap = {
      你: 'nǐ', 好: 'hǎo', 我: 'wǒ', 是: 'shì', 在: 'zài', 有: 'yǒu', 不: 'bù',
      了: 'le', 的: 'de', 和: 'hé', 中: 'zhōng', 大: 'dà', 人: 'rén', 这: 'zhè',
      上: 'shàng', 国: 'guó', 个: 'gè', 到: 'dào', 说: 'shuō', 们: 'men', 为: 'wèi',
      子: 'zǐ', 他: 'tā', 她: 'tā', 爸: 'bà', 妈: 'mā', 哥: 'gē', 姐: 'jiě',
      孩: 'hái', 谁: 'shéi', 现: 'xiàn', 几: 'jǐ', 点: 'diǎn', 叫: 'jiào',
      什: 'shén', 么: 'me', 老: 'lǎo', 师: 'shī', 王: 'wáng', 学: 'xué', 生: 'shēng',
      书: 'shū', 本: 'běn', 笔: 'bǐ', 桌: 'zhuō', 椅: 'yǐ', 门: 'mén', 窗: 'chuāng',
      房: 'fáng', 家: 'jiā', 吃: 'chī', 喝: 'hē', 饭: 'fàn', 水: 'shuǐ', 茶: 'chá',
      买: 'mǎi', 卖: 'mài', 钱: 'qián', 工: 'gōng', 作: 'zuò', 时: 'shí', 间: 'jiān',
      年: 'nián', 月: 'yuè', 日: 'rì', 今: 'jīn', 明: 'míng', 昨: 'zuó', 天: 'tiān',
      星: 'xīng', 期: 'qī', 名: 'míng', 字: 'zì',
    };
    const meaningMap = {
      你: { vi: 'bạn', en: 'you' }, 好: { vi: 'tốt, chào', en: 'good, hello' },
      我: { vi: 'tôi', en: 'I, me' }, 是: { vi: 'là', en: 'to be' },
      在: { vi: 'ở', en: 'at, in' }, 有: { vi: 'có', en: 'to have' },
      不: { vi: 'không', en: 'not' }, 了: { vi: 'rồi (trợ từ)', en: 'particle' },
      的: { vi: 'của', en: 'possessive' }, 和: { vi: 'và', en: 'and' },
      中: { vi: 'trung tâm', en: 'middle' }, 大: { vi: 'lớn', en: 'big' },
      人: { vi: 'người', en: 'person' }, 这: { vi: 'này', en: 'this' },
      上: { vi: 'trên', en: 'above' }, 国: { vi: 'nước', en: 'country' },
      个: { vi: 'cái', en: 'measure word' }, 到: { vi: 'đến', en: 'to arrive' },
      说: { vi: 'nói', en: 'to say' }, 们: { vi: 'số nhiều', en: 'plural' },
      为: { vi: 'vì', en: 'for' }, 子: { vi: 'con', en: 'child' },
      他: { vi: 'anh ấy', en: 'he' }, 她: { vi: 'cô ấy', en: 'she' },
      爸: { vi: 'bố', en: 'dad' }, 妈: { vi: 'mẹ', en: 'mom' },
      学: { vi: 'học', en: 'study' },
    };

    const pinyin = pinyinMap[char] || '—';
    const radical = getRadical(char);
    const hanViet = getHanViet(char);
    const meaning = meaningMap[char]?.[lang] || (lang === 'vi' ? '—' : '—');

    setResult({
      char,
      pinyin,
      radical,
      hanViet,
      meaning,
    });
  };

  useEffect(() => {
    if (!result?.char || !containerRef.current) return;

    const el = containerRef.current;
    el.innerHTML = '';

    try {
      const writer = HanziWriter.create(el, result.char, {
        width: 120,
        height: 120,
        padding: 5,
        showOutline: true,
        strokeAnimationSpeed: 1.5,
        radicalColor: '#6366f1',
      });
      writerRef.current = writer;
      writer.showCharacter();
    } catch (e) {
      console.warn('HanziWriter error:', e);
    }

    return () => {
      if (writerRef.current) {
        writerRef.current = null;
      }
    };
  }, [result?.char]);

  const labels = {
    title: lang === 'vi' ? 'Phân tích chữ Hán (Bộ thủ & Pinyin)' : 'Character Analyzer',
    placeholder: lang === 'vi' ? 'Nhập chữ Hán (vd: 好)...' : 'Enter character (e.g. 好)...',
    button: lang === 'vi' ? 'Phân tích' : 'Analyze',
    charLabel: lang === 'vi' ? 'Chữ' : 'Character',
    pinyinLabel: lang === 'vi' ? 'Phiên âm' : 'Pinyin',
    radicalLabel: lang === 'vi' ? 'Bộ thủ' : 'Radical',
    hanVietLabel: lang === 'vi' ? 'Hán-Việt' : 'Han-Viet',
    meaningLabel: lang === 'vi' ? 'Nghĩa' : 'Meaning',
  };

  return (
    <div className="my-8 rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-lg max-w-xl mx-auto">
      <h3 className="text-xl font-bold mb-4 text-center text-indigo-800">
        {labels.title}
      </h3>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400" />
          <input
            type="text"
            maxLength={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && analyze()}
            placeholder={labels.placeholder}
            className="w-full rounded-xl border-2 border-indigo-200 bg-white py-3 pl-12 pr-4 text-center text-xl font-medium text-gray-800 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <button
          onClick={analyze}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 font-medium text-white shadow-md transition-all hover:from-indigo-700 hover:to-purple-700"
        >
          {labels.button}
        </button>
      </div>

      {error && <p className="mt-4 text-center font-medium text-red-600">{error}</p>}

      {result && (
        <div className="mt-6 rounded-xl border border-indigo-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-6">
            <div ref={containerRef} className="min-h-[120px] flex items-center justify-center" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full text-center">
              <div className="rounded-lg bg-indigo-50 p-3">
                <p className="text-xs font-medium text-indigo-600">{labels.charLabel}</p>
                <p className="text-3xl font-bold mt-1 text-indigo-800">{result.char}</p>
              </div>
              <div className="rounded-lg bg-indigo-50 p-3">
                <p className="text-xs font-medium text-indigo-600">{labels.pinyinLabel}</p>
                <p className="text-lg font-medium mt-1 text-indigo-800">{result.pinyin}</p>
              </div>
              <div className="rounded-lg bg-indigo-50 p-3">
                <p className="text-xs font-medium text-indigo-600">{labels.radicalLabel}</p>
                <p className="text-2xl font-bold mt-1 text-indigo-800">{result.radical}</p>
              </div>
              <div className="rounded-lg bg-indigo-50 p-3">
                <p className="text-xs font-medium text-indigo-600">{labels.hanVietLabel}</p>
                <p className="text-lg font-medium mt-1 text-indigo-800">{result.hanViet}</p>
              </div>
            </div>
            {result.meaning && result.meaning !== '—' && (
              <div className="w-full rounded-lg bg-purple-50 p-3 text-center">
                <p className="text-xs font-medium text-purple-600">{labels.meaningLabel}</p>
                <p className="text-lg font-medium mt-1 text-purple-800">{result.meaning}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
