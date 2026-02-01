// src/hooks/useSRS.js
// Hook để quản lý dữ liệu từ vựng và tích hợp SRS với localStorage.
import { useState, useEffect, useCallback } from 'react';
import { calculateNextReview } from '../utils/srsLogic';

const STORAGE_KEY = 'hskVocabularySRS';

/**
 * Hook tùy chỉnh để quản lý dữ liệu từ vựng với tính năng lặp lại ngắt quãng (SRS) và lưu vào localStorage.
 * @returns {{vocabulary: object[], updateCard: function, getCard: function}}
 */
export function useSRS() {
  // State để lưu trữ toàn bộ dữ liệu từ vựng
  const [vocabulary, setVocabulary] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error("Lỗi khi đọc từ localStorage:", error);
      return {};
    }
  });

  // Effect để lưu dữ liệu vào localStorage mỗi khi vocabulary thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vocabulary));
    } catch (error) {
      console.error("Lỗi khi ghi vào localStorage:", error);
    }
  }, [vocabulary]);

  /**
   * Cập nhật một thẻ từ vựng cụ thể sau khi người dùng trả lời.
   * Áp dụng logic SRS và lưu vào state.
   * @param {string} lessonId - ID của bài học (ví dụ: 'hsk1-lesson1').
   * @param {string} wordId - ID của từ vựng (ví dụ: '你好').
   * @param {number} quality - Chất lượng trả lời (0-5).
   */
  const updateCard = useCallback((lessonId, wordId, quality) => {
    setVocabulary(prevVocab => {
      const lessonVocab = prevVocab[lessonId] || {};
      const currentCard = lessonVocab[wordId] || {
        easinessFactor: 2.5,
        interval: 0,
        repetitions: 0,
        lastReview: null,
        nextReview: new Date(), // Mặc định là hôm nay nếu là thẻ mới
      };

      const updatedCard = calculateNextReview(currentCard, quality);

      return {
        ...prevVocab,
        [lessonId]: {
          ...lessonVocab,
          [wordId]: updatedCard,
        },
      };
    });
  }, []);

  /**
   * Lấy thông tin của một thẻ từ vựng cụ thể.
   * @param {string} lessonId - ID của bài học.
   * @param {string} wordId - ID của từ vựng.
   * @returns {object|null} Đối tượng thẻ từ vựng hoặc null nếu không tìm thấy.
   */
  const getCard = useCallback((lessonId, wordId) => {
    return vocabulary[lessonId]?.[wordId] || null;
  }, [vocabulary]);

  return {
    vocabulary,
    updateCard,
    getCard,
  };
}
