import { useState, useEffect, useCallback } from 'react';
import CharacterAnalyzer from './components/CharacterAnalyzer';
import SimpleQuiz from './components/SimpleQuiz';
import ProgressDashboard from './components/ProgressDashboard';
import AIChatSidebar from './components/AIChatSidebar';
import SRSReview from './components/SRSReview';
import PlacementTest from './components/PlacementTest';
import SlangExplorer from './components/SlangExplorer';
import Toast from './components/Toast';
import StoryCharacterPopover from './components/StoryCharacterPopover';
import OnboardingModal from './components/OnboardingModal';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, ChevronDown, ChevronRight, BookOpen, Sparkles, User } from 'lucide-react';
import { saveWordToSrs, isWordInSrs, incrementLookupCount } from './utils/srsData';
import { getRadical, getHanViet } from './utils/characterData';
import { detectAmbiguousWords } from './utils/ambiguityHighlighter';
import { resolveBilingual } from './utils/bilingualHelper';
import { universalLookup } from './utils/dictionary';
import { fetchFromGemini } from './utils/geminiLookup';
import { getUserProfile } from './utils/userProfile';
import { getCachedStory, saveStoryToCache } from './utils/personalizedStories';
import { streamPersonalizeStory } from './services/personalizationService';
import './App.css';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

function App() {
  const [data, setData] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('en'); // 'vi' or 'en'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [ambiguousWords, setAmbiguousWords] = useState([]);
  const [ambiguityLoading, setAmbiguityLoading] = useState(false);
  const [popoverWord, setPopoverWord] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [popoverLoading, setPopoverLoading] = useState(false);
  const [aiTriggerQuery, setAiTriggerQuery] = useState(null);
  const [lessonsExpanded, setLessonsExpanded] = useState(false);
  const [selectedLevelView, setSelectedLevelView] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [personalizedStory, setPersonalizedStory] = useState(null);
  const [isPersonalizing, setIsPersonalizing] = useState(false);

  useEffect(() => {
    const levelFiles = [
      { key: 'hsk1', path: '/data-hsk1.json' },
      { key: 'hsk2', path: '/data-hsk2.json' },
      { key: 'hsk3', path: '/data-hsk3.json' },
      { key: 'hsk4', path: '/data-hsk4.json' },
      { key: 'hsk5', path: '/data-hsk5.json' },
      { key: 'hsk6', path: '/data-hsk6.json' },
      { key: 'hsk7-9', path: '/data-hsk7-9.json' },
    ];
  
    const loadAllLevels = async () => {
      const allData = {};
      let hasError = false;
  
      for (const { key, path } of levelFiles) {
        try {
          // Thêm cache: 'no-store' để tránh lỗi cache server cũ
          const response = await fetch(path, {
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const json = await response.json();
          allData[key] = json;
          console.log(`✅ Loaded ${key} successfully`);
        } catch (err) {
          console.error(`❌ Error fetching ${path}:`, err);
          hasError = true;
          // Tạo mảng rỗng cho level bị lỗi để giao diện không bị crash
          allData[key] = []; 
        }
      }
  
      setData(allData);
      setLoading(false);
      
      if (Object.keys(allData).length === 0) {
        console.error("No data loaded at all!");
      }
    };
  
    loadAllLevels();
  }, []);

  useEffect(() => {
    if (!selectedLesson) {
      setAmbiguousWords([]);
    }
  }, [selectedLesson]);

  useEffect(() => {
    if (currentView === 'level' && selectedLevelView) {
      setLessonsExpanded(true);
    }
  }, [currentView, selectedLevelView]);

  useEffect(() => {
    if (!selectedLesson) {
      setPersonalizedStory(null);
    }
  }, [selectedLesson]);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hskOnboardingSeen');
    if (!hasSeenOnboarding) setShowOnboarding(true);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem('hskOnboardingSeen', 'true');
    setShowOnboarding(false);
  }, []);

  const handlePersonalizeStory = useCallback(async (lesson, levelKey) => {
    const profile = getUserProfile();
    if (!profile?.name || !apiKey) {
      setToastMessage(language === 'vi' ? 'Hoàn thành hồ sơ hoặc cấu hình API key.' : 'Complete profile or configure API key.');
      setToastType('error');
      return;
    }
    const cacheKey = `${levelKey}:${lesson?.lesson_id}`;
    const cached = getCachedStory(levelKey, lesson?.lesson_id);
    if (cached?.text) {
      setPersonalizedStory({ text: cached.text, levelKey, lessonId: lesson?.lesson_id });
      return;
    }
    setIsPersonalizing(true);
    setPersonalizedStory({ text: '', levelKey, lessonId: lesson?.lesson_id });
    let fullText = '';
    try {
      await streamPersonalizeStory(lesson, profile, language, (chunk) => {
        fullText = chunk;
        setPersonalizedStory((prev) => prev ? { ...prev, text: chunk } : null);
      });
      if (fullText) saveStoryToCache(levelKey, lesson?.lesson_id, { text: fullText });
    } catch (e) {
      console.error('Personalize story error:', e);
      setToastMessage(language === 'vi' ? 'Lỗi khi cá nhân hóa.' : 'Error personalizing story.');
      setToastType('error');
      setPersonalizedStory(null);
    } finally {
      setIsPersonalizing(false);
    }
  }, [language]);
  const handleSaveWord = useCallback((word) => {
    if (isWordInSrs(word.zh)) {
      setToastMessage(language === 'vi' ? `Từ '${word.zh}' đã có trong kho ôn tập.` : `Word '${word.zh}' already in review list.`);
      setToastType('error');
    } else {
      saveWordToSrs({ zh: word.zh, pinyin: word.pinyin, vi: word.vi, en: word.en, hskLevel: word.hskLevel });
      setToastMessage(language === 'vi' ? `Đã lưu từ '${word.zh}' vào kho ôn tập!` : `Word '${word.zh}' saved!`);
      setToastType('success');
    }
  }, [language]);

  const runAmbiguityScan = useCallback(async (lesson) => {
    if (!lesson?.story?.length) return;
    if (!apiKey) {
      setToastMessage(language === 'vi' ? 'Chưa cấu hình VITE_GEMINI_API_KEY.' : 'VITE_GEMINI_API_KEY not configured.');
      setToastType('error');
      return;
    }
    setAmbiguityLoading(true);
    setAmbiguousWords([]);
    try {
      const storyText = lesson.story.map((s) => s.zh).join(' ');
      const words = await detectAmbiguousWords(storyText);
      setAmbiguousWords(words);
    } catch (e) {
      console.error('Ambiguity scan error:', e);
    } finally {
      setAmbiguityLoading(false);
    }
  }, [language]);

  const handleAmbiguousWordClick = useCallback((word, sentenceZh) => {
    if (!apiKey) {
      setToastMessage(language === 'vi' ? 'Chưa cấu hình VITE_GEMINI_API_KEY.' : 'VITE_GEMINI_API_KEY not configured.');
      setToastType('error');
      return;
    }
    const query = language === 'vi'
      ? `Giải thích từ "${word}" trong câu: "${sentenceZh}". Tại sao từ này đa nghĩa? Nghĩa nào được dùng trong câu này?`
      : `Explain the word "${word}" in the sentence: "${sentenceZh}". Why is it ambiguous? Which meaning is used here?`;
    setAiTriggerQuery(query);
  }, [language]);

  const handleCharClick = useCallback(async (zh, sentenceZh, lesson, levelKey, e) => {
    if (!zh?.trim()) return;
    const char = zh.trim();
    incrementLookupCount(char);
    setPopoverPosition({ x: e.clientX, y: e.clientY });

    const vocab = lesson?.vocabulary_inventory ?? [];
    const segments = lesson?.story?.flatMap((s) => s?.segments ?? []) ?? [];
    const segMatch = segments.find((s) => s?.zh === char);
    const vocabMatch = vocab.find((v) => v?.zh === char);
    const lessonData = segMatch
      ? { pinyin: segMatch.pinyin, vi: vocabMatch?.vi ?? segMatch.vi, en: vocabMatch?.en ?? segMatch.en }
      : vocabMatch
        ? { pinyin: vocabMatch.pinyin, vi: vocabMatch.vi, en: vocabMatch.en }
        : null;

    setPopoverLoading(true);
    setPopoverWord({ zh: char, pinyin: '', vi: '', en: '', hskLevel: levelKey ?? lesson?.hsk_level });

    let result = await universalLookup(char, lessonData);
    if (!result && apiKey) {
      const geminiResult = await fetchFromGemini(char, language, sentenceZh);
      if (geminiResult) {
        result = { ...geminiResult, zh: char, hskLevel: levelKey ?? lesson?.hsk_level };
      }
    }

    setPopoverLoading(false);
    if (result) {
      const radical = result.radical || getRadical(char);
      const hanViet = getHanViet(char);
      setPopoverWord({
        zh: char,
        pinyin: result.pinyin ?? '',
        vi: result.vi ?? '',
        en: result.en ?? '',
        radical: radical && radical !== '—' ? radical : undefined,
        hanViet: hanViet && hanViet !== '—' ? hanViet : undefined,
        hskLevel: levelKey ?? lesson?.hsk_level,
      });
    } else {
      setPopoverWord((prev) => prev ? { ...prev, pinyin: prev.pinyin || '—', vi: prev.vi || (language === 'vi' ? 'Không tìm thấy' : 'Not found'), en: prev.en || 'Not found' } : null);
    }
  }, [language]);

  const dismissToast = () => {
    setToastMessage(null);
  };

  if (loading) {
    return (
      <div className="text-center mt-10 text-xl font-semibold">
        {language === 'vi' ? 'Đang tải dữ liệu HSK... vui lòng chờ' : 'Loading HSK data... please wait'}
      </div>
    );
  }

  if (Object.keys(data).length === 0) {
    return (
      <div className="text-center mt-10 p-8 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-red-700 mb-4">
          {language === 'vi' ? 'Không tải được dữ liệu HSK' : 'Failed to load HSK data'}
        </h2>
        <p className="text-lg mb-4">
          {language === 'vi'
            ? 'Kiểm tra các bước sau:'
            : 'Please check the following:'}
        </p>
        <ul className="list-disc list-inside text-left mx-auto max-w-lg text-gray-800">
          <li>{language === 'vi' ? 'File JSON có tồn tại trong thư mục public/ không?' : 'JSON files exist in public/ folder?'}</li>
          <li>{language === 'vi' ? 'Tên file đúng chính xác (phân biệt hoa thường)?' : 'File names exact match (case-sensitive)?'}</li>
          <li>{language === 'vi' ? 'JSON có hợp lệ không (không dư dấu phẩy, encoding UTF-8)?' : 'JSON is valid (no trailing commas, UTF-8)?'}</li>
          <li>{language === 'vi' ? 'Mở DevTools → Network → xem request /data-hsk*.json' : 'DevTools → Network tab → check /data-hsk*.json requests'}</li>
          <li>Try running in normal browser: http://localhost:5173</li>
        </ul>
      </div>
    );
  }

  return (
    <>
      {/* AI Chat sidebar on the right */}
      <AIChatSidebar
        triggerQuery={aiTriggerQuery}
        onTriggerHandled={() => setAiTriggerQuery(null)}
        lang={language}
      />
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-3 rounded-full bg-white shadow-lg transition-all hover:bg-indigo-50 hover:shadow-xl"
        aria-label="Open menu"
      >
        <Menu className="w-8 h-8 text-indigo-700" strokeWidth={2} />
      </button>

      {/* Sidebar - Indigo/Purple theme with smooth transition */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-indigo-50 to-purple-50 shadow-2xl transform z-40 overflow-y-auto border-r border-indigo-100 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 text-indigo-600 hover:text-indigo-900 rounded-lg hover:bg-indigo-100 transition"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="pt-20 px-6">
          <h2 className="text-2xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {language === 'vi' ? 'Menu' : 'Menu'}
          </h2>

          <ul className="space-y-2">
            <li>
              <button
                onClick={() => {
                  setCurrentView('home');
                  setSelectedLevelView(null);
                  setSelectedLesson(null);
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left py-3 px-4 rounded-xl transition text-lg font-medium ${
                  currentView === 'home' && !selectedLevelView ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-indigo-100/80 text-gray-800'
                }`}
              >
                {language === 'vi' ? 'Trang chủ' : 'Home'}
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setLessonsExpanded(!lessonsExpanded);
                }}
                className={`flex w-full items-center justify-between py-3 px-4 rounded-xl transition text-lg font-medium ${
                  currentView === 'home' || selectedLevelView ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-indigo-100/80 text-gray-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {language === 'vi' ? 'Bài học' : 'Lessons'}
                </span>
                {lessonsExpanded ? (
                  <ChevronDown className="h-5 w-5 transition-transform" />
                ) : (
                  <ChevronRight className="h-5 w-5 transition-transform" />
                )}
              </button>
              {lessonsExpanded && (
                <ul className="mt-1 ml-4 space-y-1 border-l-2 border-indigo-200 pl-3">
                  {['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6', 'hsk7-9'].map((levelKey) => (
                    <li key={levelKey}>
                      <button
                        onClick={() => {
                          setSelectedLevelView(levelKey);
                          setCurrentView('level');
                          setSelectedLesson(null);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full text-left py-2 px-3 rounded-lg text-sm font-medium transition ${
                          currentView === 'level' && selectedLevelView === levelKey
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'hover:bg-indigo-50 text-gray-700'
                        }`}
                      >
                        HSK {levelKey === 'hsk7-9' ? '7-9' : levelKey.replace('hsk', '')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            <li>
              <button
                onClick={() => {
                  setCurrentView('dashboard');
                  setSelectedLevelView(null);
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left py-3 px-4 rounded-xl transition text-lg font-medium ${
                  currentView === 'dashboard' ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-indigo-100/80 text-gray-800'
                }`}
              >
                {language === 'vi' ? 'Tiến độ học tập' : 'Progress Dashboard'}
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setCurrentView('srs-review');
                  setSelectedLevelView(null);
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left py-3 px-4 rounded-xl transition text-lg font-medium ${
                  currentView === 'srs-review' ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-indigo-100/80 text-gray-800'
                }`}
              >
                {language === 'vi' ? 'Ôn tập từ vựng (SRS)' : 'Vocabulary Review (SRS)'}
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setCurrentView('placement-test');
                  setSelectedLevelView(null);
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left py-3 px-4 rounded-xl transition text-lg font-medium ${
                  currentView === 'placement-test' ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-indigo-100/80 text-gray-800'
                }`}
              >
                {language === 'vi' ? 'Kiểm tra đầu vào' : 'Placement Test'}
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setCurrentView('slang');
                  setSelectedLevelView(null);
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left py-3 px-4 rounded-xl transition text-lg font-medium ${
                  currentView === 'slang' ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-indigo-100/80 text-gray-800'
                }`}
              >
                {language === 'vi' ? 'Khám phá tiếng lóng' : 'Slang Explorer'}
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setShowOnboarding(true);
                  setIsSidebarOpen(false);
                }}
                className="flex w-full items-center gap-2 py-3 px-4 rounded-xl transition text-lg font-medium hover:bg-indigo-100/80 text-gray-800"
              >
                <User className="h-5 w-5" />
                {language === 'vi' ? 'Chỉnh sửa hồ sơ' : 'Edit Profile'}
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-6xl">
        {(currentView === 'home' || currentView === 'level') && (
          <>
            {/* Back button for Level view */}
            {currentView === 'level' && (
              <button
                onClick={() => {
                  setCurrentView('home');
                  setSelectedLevelView(null);
                  setSelectedLesson(null);
                }}
                className="mb-6 flex items-center gap-2 rounded-lg border border-indigo-200 px-4 py-2 font-medium text-indigo-700 transition-colors hover:bg-indigo-50"
              >
                <ChevronRight className="h-5 w-5 rotate-180" />
                {language === 'vi' ? 'Quay lại trang chính' : 'Back to Home'}
              </button>
            )}
            {/* Title - full on home, compact on level */}
            <div className={`text-center ${currentView === 'level' ? 'mb-6' : 'mb-16'}`}>
              {currentView === 'level' ? (
                <div className="flex flex-col items-center gap-3">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    HSK {selectedLevelView === 'hsk7-9' ? '7-9' : selectedLevelView?.replace('hsk', '')} — {language === 'vi' ? 'Bài học' : 'Lessons'}
                  </h1>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLanguage('vi')}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                        language === 'vi' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      VI
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                        language === 'en' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {language === 'vi' ? (
                    <>
                      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 bg-clip-text text-transparent drop-shadow-lg leading-tight">
                        HSK Horizon
                      </h1>
                      <p className="mt-4 text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800">
                        Hành trình thành thạo Tiếng Trung HSK 1-9
                      </p>
                    </>
                  ) : (
                    <>
                      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 bg-clip-text text-transparent drop-shadow-lg leading-tight">
                        HSK Horizon
                      </h1>
                      <p className="mt-4 text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800">
                        Journey to Fluency – HSK 1-9
                      </p>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Language toggle & Analyzer - only on home */}
            {currentView === 'home' && (
              <>
                <div className="flex justify-center gap-4 mb-8">
                  <button
                    onClick={() => setLanguage('vi')}
                    className={`px-6 py-2 rounded-full font-medium text-lg ${
                      language === 'vi' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    } transition-all`}
                  >
                    Tiếng Việt
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-6 py-2 rounded-full font-medium text-lg ${
                      language === 'en' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    } transition-all`}
                  >
                    English
                  </button>
                </div>
                <CharacterAnalyzer lang={language} />
                <div className="my-6 text-center">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-md"
                  >
                    {language === 'vi' ? 'Xem tiến độ học tập' : 'View Progress Dashboard'}
                  </button>
                </div>
              </>
            )}

            {/* All HSK Levels Grid - filter by selectedLevelView when on level page */}
            {(currentView === 'level' && selectedLevelView
              ? [[selectedLevelView, data[selectedLevelView] || []]]
              : Object.entries(data)
            ).map(([levelKey, lessons]) => (
              <div key={levelKey} className="mb-12">
                <h2 className="text-3xl font-bold mb-6 text-gray-800">
                  HSK {levelKey === 'hsk7-9' ? '7-9' : levelKey.replace('hsk', '')}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(lessons ?? []).map((lesson, index) => {
                    const isSelected =
                      selectedLesson &&
                      selectedLesson.level === levelKey &&
                      selectedLesson.lessonIndex === index;

                    return (
                      <div
                        key={index}
                        className={`bg-white shadow-md rounded-xl p-6 transition-all border-2 cursor-pointer ${
                          isSelected ? 'ring-2 ring-indigo-500 border-indigo-300 bg-indigo-50/50' : 'border-gray-200 hover:shadow-xl hover:border-indigo-200'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedLesson(null);
                          } else {
                            setSelectedLesson({ level: levelKey, lessonIndex: index });
                          }
                        }}
                      >
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                          {language === 'vi' ? 'Bài' : 'Lesson'} {lesson?.lesson_id ?? 'N/A'}
                        </h3>
                        <p className="text-gray-600 mb-1">
                          {language === 'vi' ? 'Cấp độ' : 'Level'}:
                          <span className="font-bold">{lesson?.hsk_level ?? '?'}</span>
                        </p>
                        <p className="text-gray-700">
                          {language === 'vi' ? 'Chủ đề' : 'Theme'}:
                          <strong>
                            {resolveBilingual(lesson?.theme, language, language === 'vi' ? 'Chưa có chủ đề' : 'No theme')}
                          </strong>
                        </p>

                        {/* Last score */}
                        {(() => {
                          const history = JSON.parse(localStorage.getItem('hskQuizHistory') ?? '[]');
                          const thisLessonResults = (history ?? []).filter(
                            (r) => r?.level === levelKey && r?.lesson === lesson?.lesson_id
                          );
                          if (thisLessonResults.length > 0) {
                            const latest = thisLessonResults[thisLessonResults.length - 1];
                            return (
                              <p className="text-sm text-green-600 mt-1 font-medium">
                                {language === 'vi' ? 'Lần gần nhất: ' : 'Last score: '}
                                {latest.percentage}%
                                <span className="text-gray-500 text-xs ml-1">({latest.date})</span>
                              </p>
                            );
                          }
                          return null;
                        })()}

                        {isSelected && (
                          <div
                            className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <h4 className="text-lg font-bold mb-3 text-indigo-800">
                              {language === 'vi' ? 'Nội dung bài học' : 'Lesson Content'}: {lesson?.lesson_id ?? ''}
                            </h4>

                            {/* Adaptive: Story OR fallback to Vocabulary as primary content */}
                            {/* Story header with Personalize button */}
                            {Array.isArray(lesson?.story) && lesson.story.length > 0 && (
                              <div className="mb-4 flex flex-wrap items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    runAmbiguityScan(lesson);
                                  }}
                                  disabled={ambiguityLoading}
                                  className="rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-200 disabled:opacity-60"
                                >
                                  {ambiguityLoading ? (language === 'vi' ? 'Đang quét...' : 'Scanning...') : (language === 'vi' ? '🔍 Quét từ đa nghĩa' : '🔍 Scan ambiguous words')}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePersonalizeStory(lesson, levelKey);
                                  }}
                                  disabled={isPersonalizing}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1.5 text-sm font-medium text-white shadow transition-colors hover:from-indigo-600 hover:to-purple-600 disabled:opacity-60"
                                >
                                  <Sparkles className="h-4 w-4" />
                                  {isPersonalizing ? (language === 'vi' ? 'Đang tạo...' : 'Generating...') : (language === 'vi' ? '✨ Cá nhân hóa câu chuyện' : '✨ Personalize this Story')}
                                </button>
                                {personalizedStory?.levelKey === levelKey && personalizedStory?.lessonId === lesson?.lesson_id && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPersonalizedStory(null);
                                    }}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                                  >
                                    {language === 'vi' ? 'Xem bản gốc' : 'View original'}
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Story: personalized (typewriter) or original */}
                            {Array.isArray(lesson?.story) && lesson.story.length > 0 && (
                              (() => {
                                const isPersonalized = personalizedStory?.levelKey === levelKey && personalizedStory?.lessonId === lesson?.lesson_id;
                                const displayText = isPersonalized ? personalizedStory?.text : null;

                                if (displayText !== null && displayText !== undefined) {
                                  const isChinese = (c) => /[\u4e00-\u9fff]/.test(c);
                                  return (
                                    <motion.div
                                      key="personalized"
                                      initial={{ opacity: 0, y: 8 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="mb-4 rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-4"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <p className="text-xl font-medium leading-relaxed" style={{ wordSpacing: 0, letterSpacing: 0 }}>
                                        {[...displayText].map((c, j) => {
                                          if (!isChinese(c)) {
                                            return <span key={j} className="inline" style={{ margin: 0, padding: 0 }}>{c}</span>;
                                          }
                                          const isAmbiguous = (ambiguousWords ?? []).includes(c);
                                          return (
                                            <span
                                              key={j}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (isAmbiguous) handleAmbiguousWordClick(c, displayText);
                                                else handleCharClick(c, displayText, lesson, levelKey, e);
                                              }}
                                              className={`inline cursor-pointer transition-colors hover:bg-indigo-100 hover:underline ${isAmbiguous ? 'text-red-500 font-semibold' : 'hover:text-indigo-700'}`}
                                              style={{ margin: 0, padding: 0 }}
                                            >
                                              {c}
                                            </span>
                                          );
                                        })}
                                        {isPersonalizing && (
                                          <span className="inline-block w-0.5 h-[1em] ml-0.5 animate-pulse bg-indigo-600 align-baseline" />
                                        )}
                                      </p>
                                    </motion.div>
                                  );
                                }

                                return (lesson.story ?? []).map((item, i) => {
                                  const itemZh = item?.zh ?? '';
                                  const isChinese = (c) => /[\u4e00-\u9fff]/.test(c);
                                  return (
                                    <div key={i} className="mb-4" onClick={(e) => e.stopPropagation()}>
                                      <p className="text-xl font-medium leading-relaxed" style={{ wordSpacing: 0, letterSpacing: 0 }}>
                                        {[...itemZh].map((c, j) => {
                                          if (!isChinese(c)) {
                                            return <span key={j} className="inline" style={{ margin: 0, padding: 0 }}>{c}</span>;
                                          }
                                          const isAmbiguous = (ambiguousWords ?? []).includes(c);
                                          return (
                                            <span
                                              key={j}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (isAmbiguous) handleAmbiguousWordClick(c, itemZh);
                                                else handleCharClick(c, itemZh, lesson, levelKey, e);
                                              }}
                                              className={`inline cursor-pointer transition-colors hover:bg-indigo-100 hover:underline ${isAmbiguous ? 'text-red-500 font-semibold hover:bg-red-50' : 'hover:text-indigo-700'}`}
                                              style={{ margin: 0, padding: 0 }}
                                              title={isAmbiguous ? (language === 'vi' ? 'Bấm để AI giải thích' : 'Click for AI explanation') : ''}
                                            >
                                              {c}
                                            </span>
                                          );
                                        })}
                                      </p>
                                      <p className="text-gray-600 italic">{item?.pinyin ?? ''}</p>
                                      <p className="text-gray-800">{resolveBilingual(item, language, '')}</p>
                                    </div>
                                  );
                                });
                              })()
                            )}

                            {/* Vocabulary - Primary when no story, secondary when story exists */}
                            {(lesson?.vocabulary_inventory ?? []).length > 0 && (
                              <div className="mt-6">
                                <h5 className="text-lg font-semibold mb-3 border-b border-indigo-200 pb-2 text-indigo-800">
                                  {language === 'vi' ? 'Từ vựng' : 'Vocabulary'}
                                </h5>
                                <ul className="space-y-4">
                                  {lesson.vocabulary_inventory.map((word, i) => (
                                    <li key={i} className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        <span className="font-medium text-lg whitespace-nowrap">
                                          {word.zh} <span className="text-gray-600 italic">({word.pinyin})</span>
                                        </span>
                                        <span className="text-gray-800">
                                          — {language === 'vi' ? word.vi : word.en}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSaveWord({ ...word, hskLevel: levelKey });
                                          }}
                                          className="ml-auto p-2 rounded-full text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                                          aria-label="Bookmark"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21.18c0 .276-.207.51-.482.54A22.357 22.357 0 0112 21.75c-2.676 0-5.216-.584-7.485-1.68a1.18 1.18 0 01-.482-.54V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.026 0z" />
                                          </svg>
                                        </button>
                                      </div>
                                      {/* Smart Glossaries: Radicals & Han-Viet */}
                                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                                        <span><strong>{language === 'vi' ? 'Bộ thủ' : 'Radical'}:</strong> {getRadical(word.zh)}</span>
                                        <span><strong>{language === 'vi' ? 'Hán-Việt' : 'Han-Viet'}:</strong> {getHanViet(word.zh)}</span>
                                      </div>

                                      {word.examples && word.examples.length > 0 && (
                                        <ul className="mt-2 ml-6 text-sm text-gray-600 list-disc space-y-1">
                                          {word.examples.map((ex, j) => (
                                            <li key={j}>
                                              {ex.zh} – {language === 'vi' ? ex.vi : ex.en}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </li>
                                  ))}
                                </ul>

                                {/* Grammar */}
                                {(lesson?.grammar ?? []).length > 0 && (
                                  <div className="mt-8">
                                    <h5 className="text-lg font-semibold mb-4 border-b border-indigo-200 pb-2 text-indigo-800">
                                      {language === 'vi' ? 'Ngữ pháp' : 'Grammar'}
                                    </h5>
                                    <div className="space-y-6">
                                      {(lesson.grammar ?? []).map((g, i) => (
                                        <div key={i} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                          <h6 className="text-md font-medium mb-2">
                                            {resolveBilingual(g?.title, language, '')}
                                          </h6>
                                          <p className="text-gray-800 leading-relaxed">{g?.point ?? ''}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Quiz - stopPropagation prevents card toggle */}
                                {(lesson?.practice ?? []).length > 0 && (
                                  <div className="mt-10" onClick={(e) => e.stopPropagation()}>
                                    <h5 className="text-lg font-semibold mb-4 border-b border-indigo-200 pb-2 text-indigo-800">
                                      {language === 'vi' ? 'Bài kiểm tra thực hành' : 'Practice Quiz'}
                                    </h5>
                                    <SimpleQuiz
                                      questions={lesson?.practice ?? []}
                                      lang={language}
                                      onComplete={(result) => {
                                        console.log('Quiz completed:', result);

                                        const savedResults = JSON.parse(localStorage.getItem('hskQuizHistory') || '[]');

                                        const newResult = {
                                          date: new Date().toLocaleString(),
                                          level: levelKey,
                                          lesson: lesson.lesson_id,
                                          score: result.score,
                                          total: result.total,
                                          percentage: result.percentage,
                                        };

                                        savedResults.push(newResult);
                                        localStorage.setItem('hskQuizHistory', JSON.stringify(savedResults));

                                        alert(
                                          `${language === 'vi' ? 'Hoàn thành! Điểm số:' : 'Completed! Score:'} ${
                                            result.percentage
                                          }% \nĐã lưu kết quả!`
                                        );
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Fallback when neither story nor vocabulary */}
                            {(!Array.isArray(lesson?.story) || lesson.story.length === 0) &&
                              (lesson?.vocabulary_inventory ?? []).length === 0 && (
                                <p className="py-6 text-center text-gray-500 italic">
                                  {language === 'vi' ? 'Chưa có nội dung cho bài học này.' : 'No content available for this lesson.'}
                                </p>
                              )}

                            {/* Close */}
                            <button
                              className="mt-4 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-2 font-medium text-white transition hover:from-gray-700 hover:to-gray-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLesson(null);
                              }}
                            >
                              {language === 'vi' ? 'Đóng' : 'Close'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        {currentView === 'dashboard' && (
          <>
            {/* Back button */}
            <button
              onClick={() => setCurrentView('home')}
              className="mb-8 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition shadow-md"
            >
              {language === 'vi' ? '← Quay lại trang chính' : '← Back to Home'}
            </button>

            <h1 className="text-3xl font-bold mb-8 text-center">
              {language === 'vi' ? 'Tiến độ học tập' : 'Progress Dashboard'}
            </h1>

            <ProgressDashboard lang={language} userProfile={getUserProfile()} />
          </>
        )}

        {currentView === 'srs-review' && (
          <>
            <button
              onClick={() => setCurrentView('home')}
              className="mb-8 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-3 font-medium text-white shadow-md transition hover:from-gray-700 hover:to-gray-800"
            >
              {language === 'vi' ? '← Quay lại trang chính' : '← Back to Home'}
            </button>
            <SRSReview lang={language} />
          </>
        )}

        {currentView === 'placement-test' && (
          <>
            <button
              onClick={() => setCurrentView('home')}
              className="mb-8 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-3 font-medium text-white shadow-md transition hover:from-gray-700 hover:to-gray-800"
            >
              {language === 'vi' ? '← Quay lại trang chính' : '← Back to Home'}
            </button>
            <PlacementTest lang={language} data={data} />
          </>
        )}

        {currentView === 'slang' && (
          <>
            <button
              onClick={() => setCurrentView('home')}
              className="mb-8 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-3 font-medium text-white shadow-md transition hover:from-gray-700 hover:to-gray-800"
            >
              {language === 'vi' ? '← Quay lại trang chính' : '← Back to Home'}
            </button>
            <SlangExplorer lang={language} />
          </>
        )}
      </div>
      {/* Story Character Popover with smooth transitions */}
      <AnimatePresence>
        {popoverWord && (
          <>
            <div
              className="fixed inset-0 z-[55] transition-opacity duration-200"
              onClick={() => setPopoverWord(null)}
              aria-hidden="true"
            />
            <StoryCharacterPopover
              key="popover"
              word={popoverWord}
              position={popoverPosition}
              onClose={() => setPopoverWord(null)}
              onSave={(word) => {
                handleSaveWord({ ...word, hskLevel: popoverWord?.hskLevel });
                setPopoverWord(null);
              }}
              isInSrs={isWordInSrs(popoverWord?.zh)}
              language={language}
              isLoading={popoverLoading}
              userProfile={getUserProfile()}
            />
          </>
        )}
      </AnimatePresence>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal
            onComplete={handleOnboardingComplete}
            lang={language}
          />
        )}
      </AnimatePresence>

      {/* Toast notification */}
      <Toast message={toastMessage} type={toastType} onDismiss={() => setToastMessage(null)} />
    </>
  );
}

export default App;