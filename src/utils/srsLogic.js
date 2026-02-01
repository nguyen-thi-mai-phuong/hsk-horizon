// src/utils/srsLogic.js - SuperMemo-2 with friction-based adjustments

/**
 * Calculate next review based on SuperMemo-2.
 * Supports friction weight: if lookupCount > 2, applies reduced easiness and shorter first interval.
 * @param {object} card - Card object with easinessFactor, interval, repetitions, lastReview
 * @param {number} quality - User rating 1-5
 * @param {object} options - { friction: boolean } - apply friction if user looked up word > 2 times
 */
export function calculateNextReview(card, quality, options = {}) {
  let { easinessFactor, interval, repetitions, lastReview } = card;

  if (easinessFactor === undefined) easinessFactor = 2.5;
  if (interval === undefined) interval = 0;
  if (repetitions === undefined) repetitions = 0;
  if (lastReview === undefined) lastReview = new Date();

  // Friction: reduce base easiness if user struggled (looked up > 2 times)
  if (options.friction) {
    easinessFactor = Math.max(1.3, easinessFactor - 0.3);
  }

  easinessFactor = easinessFactor - 0.8 + 0.2 * quality + 0.01 * (1 - quality);
  if (easinessFactor < 1.3) easinessFactor = 1.3;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions++;
    if (repetitions === 1) {
      interval = options.friction ? 1 : 1;
    } else if (repetitions === 2) {
      interval = options.friction ? 3 : 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
  }

  const now = new Date();
  const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    ...card,
    easinessFactor,
    interval,
    repetitions,
    lastReview: now,
    nextReview,
  };
}
