export interface Survey {
  id: string;
  title: string;
  description: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  response_count?: number;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  order_index: number;
  category: 'academic' | 'sleep' | 'emotional' | 'social';
  question_text: string;
  question_type: 'scale_1_5' | 'choice';
  scale_label_low: string | null;
  scale_label_high: string | null;
  choices_json: string | null;
  is_inverted: number;
  scoring_map_json: string | null;
}

export interface SurveyAnswer {
  question_id: string;
  value: string;
}

export interface SurveyMeta {
  course_year: number;
  department: string;
  semester_period: string;
}

export interface SubmitPayload extends SurveyMeta {
  survey_id: string;
  answers: SurveyAnswer[];
}

export interface BurnoutScores {
  academic: number;
  sleep: number;
  emotional: number;
  social: number;
  total: number;
}

export interface SurveyResult {
  id: string;
  survey_id: string;
  created_at: string;
  course_year: number;
  department: string;
  semester_period: string;
  score_academic: number;
  score_sleep: number;
  score_emotional: number;
  score_social: number;
  score_total: number;
}

export interface StatsResponse {
  total: number;
  average: number;
  mostAffectedDepartment: string | null;
  distribution: {
    low: number;
    mild: number;
    moderate: number;
    high: number;
    critical: number;
  };
  byDepartment: Array<{ department: string; avg_total: number; count: number }>;
  byCourse: Array<{ course_year: number; avg_total: number; count: number }>;
  byPeriod: Array<{ semester_period: string; avg_total: number; count: number }>;
  categories: { academic: number; sleep: number; emotional: number; social: number };
}

export interface HeatmapRow {
  department: string;
  academic: number;
  sleep: number;
  emotional: number;
  social: number;
  total: number;
  count: number;
}
