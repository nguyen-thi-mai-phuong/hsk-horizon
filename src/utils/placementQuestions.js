// src/utils/placementQuestions.js - 20-question diagnostic bank (HSK 1 to 7-9)
export const PLACEMENT_QUESTIONS = [
  { id: 1, level: 1, question: { en: "Select 'Hello':", vi: "Chọn từ 'Chào bạn':" }, options: ["A. 再见", "B. 谢谢", "C. 你好", "D. 对不起"], answer: "C" },
  { id: 2, level: 1, question: { en: "Which one is 'Teacher'?", vi: "Từ nào là 'Giáo viên'?" }, options: ["A. 学生", "B. 老师", "C. 医生", "D. 朋友"], answer: "B" },
  { id: 3, level: 1, question: { en: "Number 5:", vi: "Số 5 là:" }, options: ["A. 三", "B. 四", "C. 五", "D. 六"], answer: "C" },
  { id: 4, level: 2, question: { en: "Translate 'Already':", vi: "Dịch từ 'Đã/Rồi':" }, options: ["A. 准备", "B. 已经", "C. 开始", "D. 介绍"], answer: "B" },
  { id: 5, level: 2, question: { en: "Measure word for books:", vi: "Lượng từ cho sách:" }, options: ["A. 个", "B. 本", "C. 件", "D. 只"], answer: "B" },
  { id: 6, level: 2, question: { en: "Opposite of 'Expensive' (贵):", vi: "Trái nghĩa với 'Đắt' (贵):" }, options: ["A. 便宜", "B. 远", "C. 快", "D. 忙"], answer: "A" },
  { id: 7, level: 3, question: { en: "Which conjunction pair means 'Although... but'?", vi: "Cặp liên từ nào nghĩa là 'Tuy... nhưng'?" }, options: ["A. 因为...所以", "B. 虽然...但是", "C. 不仅...而且", "D. 如果...就"], answer: "B" },
  { id: 8, level: 3, question: { en: "What does '根据' mean?", vi: "'根据' nghĩa là gì?" }, options: ["A. Decide", "B. According to", "C. Influence", "D. Result"], answer: "B" },
  { id: 9, level: 3, question: { en: "Fill in: 这家超市的环境不错，___ 东西也很便宜。", vi: "Điền từ: 这家超市的环境不错，___ 东西也很便宜。" }, options: ["A. 但是", "B. 还是", "C. 而且", "D. 只有"], answer: "C" },
  { id: 10, level: 4, question: { en: "Select the synonym for 'Satisfied':", vi: "Từ đồng nghĩa với 'Hài lòng':" }, options: ["A. 愿意", "B. 满意", "C. 注意", "D. 得意"], answer: "B" },
  { id: 11, level: 4, question: { en: "What is 'Experience' in a professional context?", vi: "Từ nào là 'Kinh nghiệm'?" }, options: ["A. 经历", "B. 经验", "C. 经常", "D. 经典"], answer: "B" },
  { id: 12, level: 4, question: { en: "Select 'To be responsible for':", vi: "Chọn từ 'Chịu trách nhiệm':" }, options: ["A. 保护", "B. 负责", "C. 甚至", "D. 确实"], answer: "B" },
  { id: 13, level: 5, question: { en: "Which one means 'To Relieve/Alleviate'?", vi: "Từ nào nghĩa là 'Xoa dịu/Giảm bớt'?" }, options: ["A. 缓解", "B. 解决", "C. 解释", "D. 释放"], answer: "A" },
  { id: 14, level: 5, question: { en: "Select 'In brief/In short':", vi: "Chọn từ 'Tóm lại/Nói tóm lại':" }, options: ["A. 总之", "B. 比如", "C. 即使", "D. 既然"], answer: "A" },
  { id: 15, level: 5, question: { en: "What does '规模' mean?", vi: "'规模' nghĩa là gì?" }, options: ["A. Regulation", "B. Scale/Size", "C. Model", "D. Norm"], answer: "B" },
  { id: 16, level: 6, question: { en: "Idiom for 'unshakeable will':", vi: "Thành ngữ chỉ 'ý chí sắt đá':" }, options: ["A. 坚韧不拔", "B. 走马观花", "C. 顺其自然", "D. 乱七八糟"], answer: "A" },
  { id: 17, level: 6, question: { en: "What is 'Macro' in economics?", vi: "Từ nào là 'Vĩ mô'?" }, options: ["A. 宏观", "B. 微观", "C. 客观", "D. 主观"], answer: "A" },
  { id: 18, level: 6, question: { en: "Meaning of '弥补'?", vi: "Nghĩa của '弥补'?" }, options: ["A. Compensate/Make up for", "B. Distribute", "C. Overcome", "D. Abolish"], answer: "A" },
  { id: 19, level: "7-9", question: { en: "Select 'Environmental Restoration':", vi: "Chọn 'Phục hồi môi trường':" }, options: ["A. 生态保护", "B. 环境修复", "C. 资源循环", "D. 气候变化"], answer: "B" },
  { id: 20, level: "7-9", question: { en: "What is '划算' in a business deal?", vi: "'划算' trong giao dịch nghĩa là gì?" }, options: ["A. Expensive", "B. Complicated", "C. Cost-effective", "D. Unstable"], answer: "C" },
];

/**
 * Get HSK level recommendation from score (0-20)
 * <5: HSK 1, 5-8: HSK 2, 9-12: HSK 3, 13-15: HSK 4, 16-18: HSK 5, 19-20: HSK 6/7-9
 */
export function getLevelRecommendation(score) {
  if (score < 5) return { level: 'HSK 1', key: 'hsk1' };
  if (score <= 8) return { level: 'HSK 2', key: 'hsk2' };
  if (score <= 12) return { level: 'HSK 3', key: 'hsk3' };
  if (score <= 15) return { level: 'HSK 4', key: 'hsk4' };
  if (score <= 18) return { level: 'HSK 5', key: 'hsk5' };
  return { level: 'HSK 6 / 7-9', key: 'hsk6' };
}
