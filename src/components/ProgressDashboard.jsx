// src/components/ProgressDashboard.jsx - With motivational AI greeting
import { useState, useEffect } from 'react';
import { generateContent } from '../services/GeminiService';
import { getSrsData } from '../utils/srsData';

export default function ProgressDashboard({ lang = 'vi', userProfile = null }) {
    const history = JSON.parse(localStorage.getItem('hskQuizHistory') || '[]');
    const [greeting, setGreeting] = useState(null);

    useEffect(() => {
      if (!userProfile?.name || !userProfile?.target_goal) return;
      const srsData = getSrsData();
      const total = Object.keys(srsData).length;
      const now = Date.now();
      const dueCount = Object.values(srsData).filter((c) => {
        const nr = c.nextReview ? new Date(c.nextReview).getTime() : 0;
        const rep = c.repetition ?? 0;
        return nr <= now || rep === 0;
      }).length;

      const prompt = lang === 'vi'
        ? `Viết MỘT câu động viên ngắn (<25 từ) cho học viên tên "${userProfile.name}", mục tiêu "${userProfile.target_goal}". Nhắc số từ cần ôn hôm nay: ${dueCount}. Ví dụ: "Hey ${userProfile.name}, mục tiêu ${userProfile.target_goal} đang chờ! Ôn ${dueCount} từ hôm nay để tiến bộ." Chỉ trả lời câu động viên, không giải thích.`
        : `Write ONE short motivational sentence (<25 words) for student named "${userProfile.name}", goal "${userProfile.target_goal}". Mention words to review today: ${dueCount}. Example: "Hey ${userProfile.name}, your dream of ${userProfile.target_goal} is waiting! Review ${dueCount} words today to stay on track." Reply ONLY with the sentence, no explanation.`;

      generateContent(prompt).then((res) => {
        if (res?.trim()) setGreeting(res.trim());
      }).catch(() => {});
    }, [userProfile?.name, userProfile?.target_goal, lang]);

    const recent = history.slice(-5).reverse();

    return (
      <div className="my-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        {greeting && (
          <div className="mb-6 rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
            <p className="text-lg font-medium text-indigo-800">{greeting}</p>
          </div>
        )}
        <h3 className="text-xl font-bold mb-4 text-center">
          {lang === 'vi' ? 'Tiến độ học tập' : 'Progress Dashboard'}
        </h3>

        {!history.length ? (
          <p className="text-center text-gray-600 py-4">
            {lang === 'vi' ? 'Chưa có kết quả kiểm tra nào. Hãy làm một bài kiểm tra!' : 'No quiz results yet. Take a practice quiz!'}
          </p>
        ) : (
        <div className="space-y-4">
          {recent.map((item, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg border">
              <p className="font-medium">
                {lang === 'vi' ? 'HSK' : 'HSK'} {item.level.replace('hsk', '')} - {item.lesson}
              </p>
              <p className="text-sm text-gray-600">
                {item.date}
              </p>
              <p className="text-lg font-bold mt-1">
                {lang === 'vi' ? 'Điểm: ' : 'Score: '}{item.percentage}% ({item.score}/{item.total})
              </p>
            </div>
          ))}
        </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          {lang === 'vi' ? `Tổng số lần kiểm tra: ${history.length}` : `Total quizzes taken: ${history.length}`}
        </p>
      </div>
    );
  }
