interface Question {
  id: string;
  question_type: string;
  is_inverted: number;
  scoring_map_json: string | null;
}

export function normalizeScore(question: Question, value: string): number {
  if (question.question_type === 'scale_1_5') {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 5) return 0;
    let score = (num - 1) * 25;
    if (question.is_inverted) score = 100 - score;
    return score;
  }

  if (question.question_type === 'choice' && question.scoring_map_json) {
    const map = JSON.parse(question.scoring_map_json) as Record<string, number>;
    const score = map[value];
    if (score === undefined) return 0;
    return question.is_inverted ? 100 - score : score;
  }

  return 0;
}

export function computeCategoryScores(
  answers: Array<{ category: string; normalized_score: number }>
): { academic: number; sleep: number; emotional: number; social: number; total: number } {
  const byCategory: Record<string, number[]> = {
    academic: [], sleep: [], emotional: [], social: []
  };

  for (const a of answers) {
    const cat = a.category;
    if (cat in byCategory) byCategory[cat].push(a.normalized_score);
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

  const academic = avg(byCategory.academic);
  const sleep = avg(byCategory.sleep);
  const emotional = avg(byCategory.emotional);
  const social = avg(byCategory.social);
  const total = avg([academic, sleep, emotional, social]);

  return { academic, sleep, emotional, social, total };
}
