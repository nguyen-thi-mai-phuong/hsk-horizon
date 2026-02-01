// src/components/SimpleQuiz.jsx - Data-resilient practice quiz with bilingual support
import { useState } from 'react';
import { resolveBilingual } from '../utils/bilingualHelper';

export default function SimpleQuiz({ questions = [], lang = 'vi', onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(null);

  const safeQuestions = questions ?? [];
  if (!safeQuestions.length) {
    return <p className="text-center text-gray-600">{lang === 'vi' ? 'Chưa có câu hỏi thực hành.' : 'No practice questions available.'}</p>;
  }

  const currentQuestion = safeQuestions[currentIndex];
  const options = Array.isArray(currentQuestion?.options) && currentQuestion.options.length > 0
    ? currentQuestion.options
    : ['A', 'B', 'C', 'D'];

  const handleSelect = (option) => {
    setSelectedAnswer(option);
  };

  const getLetter = (option) => {
    if (typeof option === 'string' && option.length > 0) {
      return option.charAt(0); // 'A', 'B', etc. from "A. Something"
    }
    if (option && typeof option === 'object' && (option.vi || option.en)) {
      return null; // bilingual object - use index
    }
    return option; // fallback
  };

  const handleNext = () => {
    const idx = options.indexOf(selectedAnswer);
    const selectedLetter = (getLetter(selectedAnswer) ?? (idx >= 0 ? String.fromCharCode(65 + idx) : null));
    const correctLetter = currentQuestion?.answer ?? '';
    const isCorrect = selectedLetter === correctLetter;
    const newScore = isCorrect ? score + 1 : score;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    if (currentIndex + 1 < safeQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setFinalScore(newScore);
      setShowResult(true);
      const percentage = Math.round((newScore / safeQuestions.length) * 100);
      onComplete?.({ score: newScore, total: safeQuestions.length, percentage });
    }
  };

  return (
    <div className="my-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
      <h4 className="text-xl font-bold mb-4 text-center">
        {lang === 'vi' ? 'Bài kiểm tra thực hành' : 'Practice Quiz'}
      </h4>

      <p className="text-lg font-medium mb-6">
        {resolveBilingual(currentQuestion?.question, lang, '')}
      </p>

      <div className="space-y-3">
        {options.map((opt, idx) => {
          const optionText = resolveBilingual(opt, lang, typeof opt === 'string' ? opt : '');
          const letter = getLetter(opt) ?? String.fromCharCode(65 + idx);

          const isSelected = selectedAnswer === opt;
          let bg = 'bg-gray-100 hover:bg-gray-200';

          if (selectedAnswer) {
            if (letter === currentQuestion?.answer) {
              bg = 'bg-green-100 border-green-500'; // correct
            } else if (isSelected) {
              bg = 'bg-red-100 border-red-500'; // wrong
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(opt)}
              disabled={showResult}
              className={`w-full p-4 text-left rounded-lg border transition ${bg} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
            >
              {optionText || 'Option ' + (idx + 1)}
            </button>
          );
        })}
      </div>

      {selectedAnswer && !showResult && (
        <button
          onClick={handleNext}
          className="mt-6 px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition mx-auto block"
        >
          {lang === 'vi' ? 'Tiếp theo' : 'Next'}
        </button>
      )}

      {showResult && (
        <div className="mt-6 text-center">
          <p className="text-2xl font-bold">
            {lang === 'vi' 
              ? `Điểm: ${finalScore ?? score} / ${safeQuestions.length} (${Math.round(((finalScore ?? score) / safeQuestions.length) * 100)}%)` 
              : `Score: ${finalScore ?? score} / ${safeQuestions.length} (${Math.round(((finalScore ?? score) / safeQuestions.length) * 100)}%)`}
          </p>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setScore(0);
              setSelectedAnswer(null);
              setShowResult(false);
              setFinalScore(null);
            }}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {lang === 'vi' ? 'Làm lại' : 'Retry'}
          </button>
        </div>
      )}
    </div>
  );
}