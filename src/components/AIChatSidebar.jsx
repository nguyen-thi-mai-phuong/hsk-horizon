// src/components/AIChatSidebar.jsx - FAB with slide-in panel, supports external trigger
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let genAIInstance = null;
function getGenAI() {
  if (!apiKey) return null;
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
}

const DEFAULT_MESSAGES = {
  en: 'Hello! I\'m your AI assistant for HSK Horizon. Ask me about vocabulary, grammar, or practice tips for Chinese.',
  vi: 'Xin chào! Tôi là trợ lý AI cho HSK Horizon. Hãy hỏi tôi về từ vựng, ngữ pháp hoặc gợi ý luyện tập Tiếng Trung nhé.',
};

export default function AIChatSidebar({ triggerQuery = null, onTriggerHandled, lang = 'en' }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: DEFAULT_MESSAGES[lang] ?? DEFAULT_MESSAGES.en },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef(null);

  const handleScrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(handleScrollToBottom, 50);
    }
  }, [isOpen, messages]);

  // External trigger: open sidebar and send query to AI
  useEffect(() => {
    if (!triggerQuery?.trim()) return;

    setIsOpen(true);
    const trimmed = triggerQuery.trim();
    const newUserMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, newUserMessage]);

    if (!apiKey) {
      setError(lang === 'vi' ? 'Chưa cấu hình VITE_GEMINI_API_KEY. Thêm vào file .env.' : 'VITE_GEMINI_API_KEY not configured. Add to .env file.');
      onTriggerHandled?.();
      return;
    }

    setIsLoading(true);
    setError('');

    const fetchResponse = async () => {
      try {
        const genAI = getGenAI();
        if (!genAI) throw new Error('API key not configured');

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const historyText = [...messages, newUserMessage]
          .slice(-10)
          .map((m) => `${m.role === 'user' ? (lang === 'vi' ? 'Người dùng' : 'User') : 'AI'}: ${m.content}`)
          .join('\n');

        const prompt = lang === 'vi'
          ? `Bạn là trợ lý AI giúp người học Tiếng Trung HSK trên ứng dụng HSK Horizon.
Hãy trả lời ngắn gọn, rõ ràng, thân thiện. Có thể giải thích từ vựng, ngữ pháp, gợi ý cách luyện tập với các bài HSK 1-9.

Lịch sử hội thoại gần đây:
${historyText}

Trả lời cho tin nhắn cuối cùng của người dùng bằng tiếng Việt (có thể xen tiếng Trung nếu cần).`
          : `You are an AI assistant for HSK Chinese learners on HSK Horizon.
Reply concisely, clearly, and friendly. You can explain vocabulary, grammar, and suggest practice for HSK 1-9 lessons.

Recent conversation:
${historyText}

Reply to the user's last message in English (you may include Chinese when helpful).`;

        const result = await model.generateContent(prompt);
        const responseText = result?.response?.text?.() || (lang === 'vi' ? 'Xin lỗi, tôi chưa thể trả lời lúc này.' : 'Sorry, I couldn\'t respond right now.');

        setMessages((prev) => [...prev, { role: 'assistant', content: responseText }]);
        setTimeout(handleScrollToBottom, 50);
      } catch (err) {
        console.error('Gemini chat error:', err);
        setError(lang === 'vi' ? 'Có lỗi khi gọi Gemini API. Vui lòng thử lại sau.' : 'Error calling Gemini API. Please try again.');
      } finally {
        setIsLoading(false);
        onTriggerHandled?.();
      }
    };

    fetchResponse();
  }, [triggerQuery]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    if (!apiKey) {
      setError(lang === 'vi' ? 'Chưa cấu hình API key cho Gemini. Vui lòng thêm VITE_GEMINI_API_KEY vào file .env và khởi động lại ứng dụng.' : 'API key not configured. Add VITE_GEMINI_API_KEY to .env and restart.');
      return;
    }

    setError('');

    const newUserMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const genAI = getGenAI();
      if (!genAI) throw new Error('Không thể khởi tạo Gemini client.');

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const historyText = [...messages, newUserMessage]
        .slice(-10)
        .map((m) => `${m.role === 'user' ? (lang === 'vi' ? 'Người dùng' : 'User') : 'AI'}: ${m.content}`)
        .join('\n');

      const prompt = lang === 'vi'
        ? `Bạn là trợ lý AI giúp người học Tiếng Trung HSK trên ứng dụng HSK Horizon.
Hãy trả lời ngắn gọn, rõ ràng, thân thiện.

Lịch sử hội thoại gần đây:
${historyText}

Trả lời cho tin nhắn cuối cùng của người dùng bằng tiếng Việt.`
        : `You are an AI assistant for HSK Chinese learners on HSK Horizon.
Reply concisely, clearly, and friendly.

Recent conversation:
${historyText}

Reply to the user's last message in English.`;

      const result = await model.generateContent(prompt);
      const responseText = result?.response?.text?.() || (lang === 'vi' ? 'Xin lỗi, tôi chưa thể trả lời lúc này.' : 'Sorry, I couldn\'t respond right now.');

      setMessages((prev) => [...prev, { role: 'assistant', content: responseText }]);
      setTimeout(handleScrollToBottom, 50);
    } catch (err) {
      console.error('Gemini chat error:', err);
      setError(lang === 'vi' ? 'Có lỗi khi gọi Gemini API. Vui lòng thử lại sau.' : 'Error calling Gemini API. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300"
        aria-label={isOpen ? 'Close chat' : 'Open AI chat'}
      >
        <MessageCircle className="h-7 w-7" strokeWidth={2} />
      </button>

      <div
        className={`fixed right-0 top-0 z-40 h-full w-full transform bg-white/95 shadow-2xl backdrop-blur-lg transition-all duration-300 ease-in-out sm:w-96 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white">
            <div>
              <h2 className="font-semibold text-lg">HSK AI Tutor</h2>
              <p className="text-xs text-indigo-100">Powered by Gemini</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 transition-colors hover:bg-white/20"
              aria-label="Close chat"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50 to-white px-4 py-3"
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm text-left ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-indigo-600 text-white'
                      : 'rounded-bl-sm border border-gray-200 bg-white text-gray-900'
                  }`}
                >
                  {m.content.split('\n').map((line, i) => (
                    <p key={i} className="whitespace-pre-wrap font-normal">
                      {line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/^#+\s*/gm, '')}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500 shadow-sm">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                  <span>{lang === 'vi' ? 'Đang suy nghĩ...' : 'Thinking...'}</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="border-t border-gray-200 bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={lang === 'vi' ? 'Hỏi AI về từ vựng, ngữ pháp...' : 'Ask about vocabulary, grammar...'}
                className="flex-1 resize-none rounded-2xl border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="inline-flex items-center justify-center gap-1 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                {lang === 'vi' ? 'Gửi' : 'Send'}
              </button>
            </div>
            {!apiKey && (
              <p className="mt-2 text-[11px] text-amber-600">
                {lang === 'vi' ? (
                  <>Chưa tìm thấy <code className="font-mono">VITE_GEMINI_API_KEY</code>. Thêm vào file <code className="font-mono">.env</code> rồi khởi động lại.</>
                ) : (
                  <>Missing <code className="font-mono">VITE_GEMINI_API_KEY</code>. Add to <code className="font-mono">.env</code> and restart.</>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
