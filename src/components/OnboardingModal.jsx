// src/components/OnboardingModal.jsx - User profiling for personalized learning
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, User, Target, Heart } from 'lucide-react';
import { saveUserProfile } from '../utils/userProfile';

export default function OnboardingModal({ onComplete, lang = 'en' }) {
  const [name, setName] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const labels = {
    title: lang === 'vi' ? 'Chào mừng đến HSK Horizon!' : 'Welcome to HSK Horizon!',
    subtitle: lang === 'vi' ? 'Cho chúng tôi biết về bạn để cá nhân hóa trải nghiệm học tập.' : 'Tell us about you to personalize your learning experience.',
    name: lang === 'vi' ? 'Tên của bạn' : 'Your name',
    namePlaceholder: lang === 'vi' ? 'Ví dụ: Minh, Lan' : 'e.g. John, Sarah',
    goal: lang === 'vi' ? 'Mục tiêu của bạn' : 'Your target goal',
    goalPlaceholder: lang === 'vi' ? 'Ví dụ: Du học Ireland, làm việc tại SuccessHR' : 'e.g. Study in Ireland, work at SuccessHR',
    hobbies: lang === 'vi' ? 'Sở thích' : 'Hobbies',
    hobbiesPlaceholder: lang === 'vi' ? 'Ví dụ: bóng đá, âm nhạc, du lịch' : 'e.g. football, music, travel',
    skip: lang === 'vi' ? 'Bỏ qua' : 'Skip',
    start: lang === 'vi' ? 'Bắt đầu học' : 'Start Learning',
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const profile = {
      name: name.trim() || (lang === 'vi' ? 'Học viên' : 'Learner'),
      target_goal: targetGoal.trim() || '',
      hobbies: hobbies.split(/[,，]/).map((h) => h.trim()).filter(Boolean),
    };
    saveUserProfile(profile);
    setIsSubmitting(false);
    onComplete?.();
  };

  const handleSkip = () => {
    saveUserProfile({ name: lang === 'vi' ? 'Học viên' : 'Learner', target_goal: '', hobbies: [] });
    onComplete?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md rounded-2xl border-2 border-indigo-200 bg-white p-8 shadow-2xl"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-indigo-800">{labels.title}</h2>
              <p className="text-sm text-gray-600">{labels.subtitle}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-indigo-700">
                <User className="h-4 w-4" />
                {labels.name}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={labels.namePlaceholder}
                className="w-full rounded-xl border-2 border-indigo-100 px-4 py-3 text-gray-800 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-indigo-700">
                <Target className="h-4 w-4" />
                {labels.goal}
              </label>
              <input
                type="text"
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                placeholder={labels.goalPlaceholder}
                className="w-full rounded-xl border-2 border-indigo-100 px-4 py-3 text-gray-800 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-indigo-700">
                <Heart className="h-4 w-4" />
                {labels.hobbies}
              </label>
              <input
                type="text"
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                placeholder={labels.hobbiesPlaceholder}
                className="w-full rounded-xl border-2 border-indigo-100 px-4 py-3 text-gray-800 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                {labels.skip}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 font-medium text-white shadow-md transition-all hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60"
              >
                {labels.start}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
