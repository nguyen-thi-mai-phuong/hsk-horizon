// src/utils/characterData.js - Radicals and Han-Viet (Sino-Vietnamese) readings for Smart Glossaries
// Common HSK character mappings - expandable

export const RADICALS = {
  你: '亻', 好: '女', 我: '戈', 是: '日', 在: '土', 有: '月', 不: '一', 了: '亅',
  的: '白', 和: '口', 中: '丨', 大: '大', 人: '人', 这: '辶', 上: '一', 国: '囗',
  个: '丨', 到: '至', 说: '讠', 们: '亻', 为: '灬', 子: '子', 他: '亻', 她: '女',
  爸: '父', 妈: '女', 哥: '口', 姐: '女', 孩: '子', 谁: '讠', 现: '王', 在: '土',
  几: '几', 点: '灬', 现: '王', 在: '土', 名: '口', 字: '子', 叫: '口', 什: '亻',
  么: '丿', 老: '耂', 师: '巾', 王: '王', 学: '子', 生: '生', 书: '丨', 本: '木',
  笔: '竹', 桌: '木', 椅: '木', 门: '门', 窗: '穴', 房: '户', 家: '宀', 吃: '口',
  喝: '口', 饭: '饣', 水: '水', 茶: '艹', 买: '贝', 卖: '贝', 钱: '钅', 工: '工',
  作: '亻', 时: '日', 间: '门', 年: '干', 月: '月', 日: '日', 今: '人', 明: '日',
  昨: '日', 天: '大', 星: '日', 期: '月',
};

// Han-Viet (âm Hán Việt) - Sino-Vietnamese readings for common characters
export const HAN_VIET = {
  中: 'trung', 国: 'quốc', 人: 'nhân', 大: 'đại', 小: 'tiểu', 上: 'thượng',
  下: 'hạ', 学: 'học', 生: 'sinh', 老: 'lão', 师: 'sư', 名: 'danh', 字: 'tự',
  时: 'thời', 间: 'gian', 年: 'niên', 月: 'nguyệt', 日: 'nhật', 今: 'kim',
  明: 'minh', 昨: 'tạc', 天: 'thiên', 星: 'tinh', 期: 'kỳ', 你: 'nhĩ',
  我: 'ngã', 他: 'tha', 她: 'tha', 好: 'hảo', 是: 'thị', 在: 'tại',
  有: 'hữu', 不: 'bất', 了: 'liễu', 的: 'đích', 和: 'hòa', 这: 'giá',
  那: 'na', 个: 'cá', 到: 'đáo', 说: 'thuyết', 们: 'môn', 为: 'vi',
  子: 'tử', 爸: 'bá', 妈: 'ma', 哥: 'ca', 姐: 'tỷ', 孩: 'hài',
  谁: 'thuỳ', 现: 'hiện', 几: 'kỷ', 点: 'điểm', 叫: 'khiếu',
  什: 'thập', 么: 'ma', 王: 'vương', 书: 'thư', 本: 'bản', 笔: 'bút',
  工: 'công', 作: 'tác', 买: 'mãi', 卖: 'mại', 钱: 'tiền', 吃: 'ngật',
  喝: 'hát', 饭: 'phạn', 水: 'thủy', 茶: 'trà', 家: 'gia', 房: 'phòng',
  门: 'môn', 窗: 'song', 桌: 'trác', 椅: 'ỷ',
};

/**
 * Get radical for a character (or first char of multi-char word)
 */
export function getRadical(char) {
  if (!char) return '—';
  const c = typeof char === 'string' ? char[0] : char;
  return RADICALS[c] || '—';
}

/**
 * Get Han-Viet reading for a character or word (first char if multi-char)
 */
export function getHanViet(char) {
  if (!char) return '—';
  const c = typeof char === 'string' ? char[0] : char;
  return HAN_VIET[c] || '—';
}
