// src/components/SRSReview.jsx - Level-based SRS with SM-2, Completion Screen, Analytics
import { useState, useEffect, useCallback } from 'react';
import { RotateCw, ChevronLeft, ChevronRight, Bookmark, CheckCircle2, ChevronDown } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import {
  getDueQueue,
  getSrsAnalytics,
  updateSrsCard,
} from '../utils/srsData';
import { calculateNextReview } from '../utils/srsLogic';

ChartJS.register(ArcElement, Tooltip, Legend);

const RATING_TO_QUALITY = { 1: 1, 2: 2, 3: 4, 4: 5 };
const HSK_LEVELS = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6', 'hsk7-9'];

export default function SRSReview({ lang = 'vi' }) {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  const loadQueue = useCallback(() => {
    if (selectedLevel == null) return;
    const queue = getDueQueue(selectedLevel);
    setCards(queue);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowRating(false);
    setSessionComplete(false);
  }, [selectedLevel]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const analytics = selectedLevel != null ? getSrsAnalytics(selectedLevel) : null;
  const currentCard = cards[currentIndex];
  const total = cards.length;

  const handleFlip = () => {
    setIsFlipped(true);
    setShowRating(true);
  };

  const handleRate = (rating) => {
    if (!currentCard) return;

    const quality = RATING_TO_QUALITY[rating] ?? 3;
    const cardForLogic = {
      easinessFactor: currentCard.easiness ?? 2.5,
      interval: currentCard.interval ?? 0,
      repetitions: currentCard.repetition ?? 0,
      lastReview: currentCard.lastReview ? new Date(currentCard.lastReview) : new Date(),
    };

    const updated = calculateNextReview(cardForLogic, quality);
    updateSrsCard(currentCard.zh, {
      easiness: updated.easinessFactor,
      interval: updated.interval,
      repetition: updated.repetitions,
      lastReview: updated.lastReview,
      nextReview: updated.nextReview,
    });

    setShowRating(false);
    setIsFlipped(false);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setSessionComplete(true);
    }
  };

  const labels = {
    title: lang === 'vi' ? 'Ôn tập từ vựng (SRS)' : 'Vocabulary Review (SRS)',
    selectLevel: lang === 'vi' ? 'Chọn cấp độ HSK' : 'Select HSK Level',
    empty: lang === 'vi' ? 'Chưa có từ vựng nào. Bookmark từ vựng trong bài học!' : 'No vocabulary. Bookmark words from lessons!',
    noDue: lang === 'vi' ? 'Không có thẻ cần ôn hôm nay.' : 'No cards due for review today.',
    noCardsInLevel: lang === 'vi' ? 'Chưa có từ vựng nào trong cấp độ này. Bookmark từ vựng trong bài học!' : 'No vocabulary in this level. Bookmark words from lessons!',
    complete: lang === 'vi' ? 'Đạt mục tiêu hôm nay!' : 'Daily Goal Reached!',
    completeDesc: lang === 'vi' ? 'Bạn đã ôn xong tất cả thẻ cần ôn. Quay lại sau!' : 'You\'ve reviewed all due cards. Come back later!',
    newCards: lang === 'vi' ? 'Thẻ mới' : 'New Cards',
    learning: lang === 'vi' ? 'Đang học' : 'Learning',
    mastered: lang === 'vi' ? 'Đã thuộc' : 'Mastered',
    flip: lang === 'vi' ? 'Xem nghĩa' : 'Show meaning',
    again: lang === 'vi' ? 'Quên' : 'Again',
    hard: lang === 'vi' ? 'Khó' : 'Hard',
    good: lang === 'vi' ? 'Tốt' : 'Good',
    easy: lang === 'vi' ? 'Dễ' : 'Easy',
    prev: lang === 'vi' ? 'Trước' : 'Prev',
    next: lang === 'vi' ? 'Sau' : 'Next',
  };

  // Level selection screen
  if (selectedLevel == null) {
    const allAnalytics = HSK_LEVELS.map((l) => ({
      level: l,
      ...getSrsAnalytics(l),
    }));

    return (
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-6 text-center text-2xl font-bold text-indigo-800">{labels.title}</h2>
        <p className="mb-6 text-center text-gray-600">{labels.selectLevel}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {allAnalytics.map(({ level, total: t }) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className="rounded-xl border-2 border-indigo-200 bg-white p-4 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50"
            >
              <span className="block text-lg font-bold text-indigo-700">
                HSK {level === 'hsk7-9' ? '7-9' : level.replace('hsk', '')}
              </span>
              <span className="text-sm text-gray-600">{t} {lang === 'vi' ? 'thẻ' : 'cards'}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Completion screen (session done or no cards due)
  if (sessionComplete || total === 0) {
    const justFinished = sessionComplete;
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h3 className="mb-2 text-xl font-bold text-indigo-800">{labels.complete}</h3>
          <p className="mb-6 text-gray-600">
            {justFinished ? labels.completeDesc : (analytics?.total === 0 ? labels.noCardsInLevel : labels.noDue)}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setSelectedLevel(null)}
              className="rounded-lg border-2 border-indigo-300 px-4 py-2 font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              {lang === 'vi' ? 'Chọn cấp độ khác' : 'Choose another level'}
            </button>
            <button
              onClick={loadQueue}
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
            >
              {lang === 'vi' ? 'Ôn lại' : 'Review again'}
            </button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {analytics && (analytics.newCards > 0 || analytics.learning > 0 || analytics.mastered > 0) && (
          <div className="mt-8 rounded-xl border-2 border-indigo-200 bg-white p-6">
            <h4 className="mb-4 text-center font-semibold text-indigo-800">
              {lang === 'vi' ? 'Tiến độ học tập' : 'Learning Progress'} — HSK {selectedLevel === 'hsk7-9' ? '7-9' : selectedLevel?.replace?.('hsk', '') ?? selectedLevel}
            </h4>
            <div className="mx-auto max-w-[200px]">
              <Doughnut
                data={{
                  labels: [labels.newCards, labels.learning, labels.mastered],
                  datasets: [
                    {
                      data: [analytics.newCards, analytics.learning, analytics.mastered],
                      backgroundColor: ['#6366f1', '#f59e0b', '#10b981'],
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom' },
                  },
                }}
              />
            </div>
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <span className="text-indigo-600">{labels.newCards}: {analytics.newCards}</span>
              <span className="text-amber-600">{labels.learning}: {analytics.learning}</span>
              <span className="text-green-600">{labels.mastered}: {analytics.mastered}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Flashcard session
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setSelectedLevel(null)}
          className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
          HSK {selectedLevel === 'hsk7-9' ? '7-9' : selectedLevel?.replace?.('hsk', '') ?? selectedLevel}
        </button>
        <span className="text-sm text-gray-600">
          {currentIndex + 1} / {total}
        </span>
      </div>

      <div className="mb-6 h-2 rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      <div className="relative min-h-[280px]">
        <div
          className="relative min-h-[280px] cursor-pointer rounded-2xl border-2 border-indigo-200 bg-white p-8 shadow-xl transition-all duration-500"
          onClick={!isFlipped ? handleFlip : undefined}
        >
          {!isFlipped ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center">
              <p className="text-5xl font-bold text-indigo-800">{currentCard?.zh}</p>
              <p className="mt-2 text-xl italic text-gray-500">{currentCard?.pinyin}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlip();
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-100 px-4 py-2 text-indigo-700 transition-colors hover:bg-indigo-200"
              >
                <RotateCw className="h-4 w-4" />
                {labels.flip}
              </button>
            </div>
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
              <p className="text-4xl font-bold text-indigo-800">{currentCard?.zh}</p>
              <p className="mt-1 text-lg italic text-gray-600">{currentCard?.pinyin}</p>
              <p className="mt-4 text-xl font-medium text-gray-800">
                {lang === 'vi' ? currentCard?.vi : currentCard?.en}
              </p>
            </div>
          )}
        </div>
      </div>

      {showRating && (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {[
            { key: 1, label: labels.again, color: 'bg-red-500 hover:bg-red-600' },
            { key: 2, label: labels.hard, color: 'bg-orange-500 hover:bg-orange-600' },
            { key: 3, label: labels.good, color: 'bg-green-500 hover:bg-green-600' },
            { key: 4, label: labels.easy, color: 'bg-indigo-500 hover:bg-indigo-600' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => handleRate(key)}
              className={`rounded-lg px-5 py-2.5 font-medium text-white shadow transition-colors ${color}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => {
            setCurrentIndex((i) => Math.max(0, i - 1));
            setIsFlipped(false);
            setShowRating(false);
          }}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" />
          {labels.prev}
        </button>
        <button
          onClick={() => {
            setCurrentIndex((i) => Math.min(cards.length - 1, i + 1));
            setIsFlipped(false);
            setShowRating(false);
          }}
          disabled={currentIndex >= cards.length - 1}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
        >
          {labels.next}
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* In-session Analytics */}
      {analytics && (
        <div className="mt-8 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <h5 className="mb-2 text-sm font-semibold text-indigo-800">
            {lang === 'vi' ? 'Tiến độ' : 'Progress'}
          </h5>
          <div className="flex gap-4">
            <div className="flex-1 rounded-lg bg-white p-2 text-center">
              <span className="block text-lg font-bold text-indigo-600">{analytics.newCards}</span>
              <span className="text-xs text-gray-600">{labels.newCards}</span>
            </div>
            <div className="flex-1 rounded-lg bg-white p-2 text-center">
              <span className="block text-lg font-bold text-amber-600">{analytics.learning}</span>
              <span className="text-xs text-gray-600">{labels.learning}</span>
            </div>
            <div className="flex-1 rounded-lg bg-white p-2 text-center">
              <span className="block text-lg font-bold text-green-600">{analytics.mastered}</span>
              <span className="text-xs text-gray-600">{labels.mastered}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
