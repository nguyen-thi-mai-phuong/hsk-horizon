// src/components/PlacementTest.jsx - 20-question diagnostic (HSK 1 to 7-9)
import { useState } from 'react';
import { Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { PLACEMENT_QUESTIONS, getLevelRecommendation } from '../utils/placementQuestions';
import { resolveBilingual } from '../utils/bilingualHelper';

export default function PlacementTest({ lang = 'vi' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const questions = PLACEMENT_QUESTIONS;
  const currentQ = questions[currentIndex];
  const total = questions.length;
  const isLast = currentIndex === total - 1;

  const handleSelect = (optionKey) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: optionKey }));
  };

  const handleNext = () => {
    if (isLast) {
      let correct = 0;
      questions.forEach((q, i) => {
        const userAnswer = answers[i];
        if (userAnswer === q.answer) correct++;
      });
      setScore(correct);
      setShowResult(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const labels = {
    title: lang === 'vi' ? 'Bài kiểm tra xếp lớp' : 'Placement Test',
    instruction: lang === 'vi' ? 'Chọn câu trả lời đúng cho mỗi câu hỏi. Kết quả sẽ gợi ý cấp độ HSK phù hợp.' : 'Select the correct answer for each question. Results will recommend your HSK level.',
    question: lang === 'vi' ? 'Câu hỏi' : 'Question',
    next: lang === 'vi' ? 'Tiếp theo' : 'Next',
    prev: lang === 'vi' ? 'Trước' : 'Previous',
    submit: lang === 'vi' ? 'Xem kết quả' : 'See Results',
    result: lang === 'vi' ? 'Kết quả' : 'Result',
    score: lang === 'vi' ? 'Điểm số' : 'Score',
    recommendation: lang === 'vi' ? 'Gợi ý cấp độ' : 'Level Recommendation',
    startOver: lang === 'vi' ? 'Làm lại' : 'Start Over',
  };

  if (showResult) {
    const recommendation = getLevelRecommendation(score);
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    return (
      <div className="mx-auto max-w-xl rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-8 shadow-xl">
        <Award className="mx-auto mb-4 h-16 w-16 text-indigo-600" />
        <h2 className="mb-6 text-center text-2xl font-bold text-indigo-800">{labels.result}</h2>
        <div className="mb-6 rounded-xl bg-white p-6 shadow">
          <p className="text-center text-4xl font-bold text-indigo-600">
            {score} / {total}
          </p>
          <p className="mt-2 text-center text-gray-600">
            {labels.score}: {percentage}%
          </p>
        </div>
        <div className="rounded-xl bg-indigo-100 p-4">
          <p className="font-semibold text-indigo-800">{labels.recommendation}</p>
          <p className="mt-2 text-xl font-bold text-indigo-600">{recommendation.level}</p>
        </div>
        <button
          onClick={() => {
            setShowResult(false);
            setCurrentIndex(0);
            setAnswers({});
          }}
          className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
        >
          {labels.startOver}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-2 text-center text-2xl font-bold text-indigo-800">{labels.title}</h2>
      <p className="mb-6 text-center text-sm text-gray-600">{labels.instruction}</p>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">
          {labels.question} {currentIndex + 1} / {total}
        </span>
        <div className="mx-4 h-2 flex-1 rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border-2 border-indigo-200 bg-white p-8 shadow-lg">
        <p className="mb-6 text-xl font-medium text-gray-800">
          {resolveBilingual(currentQ?.question, lang, '')}
        </p>

        <div className="space-y-3">
          {(currentQ?.options ?? []).map((opt, idx) => {
            const key = String.fromCharCode(65 + idx);
            const isSelected = answers[currentIndex] === key;
            return (
              <button
                key={idx}
                onClick={() => handleSelect(key)}
                className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                  {key}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" />
          {labels.prev}
        </button>
        <button
          onClick={handleNext}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-2 font-medium text-white shadow transition-colors hover:from-indigo-700 hover:to-blue-700"
        >
          {isLast ? labels.submit : labels.next}
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
