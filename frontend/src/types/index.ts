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

export interface AdminUser {
  id: string;
  username: string;
  display_name: string;
  last_login_at?: string;
}

export interface BackupEntry {
  filename: string;
  size: number;
  created_at: string;
  type: 'auto' | 'manual' | 'pre-restore';
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: string;
  details_json: string | null;
  ip_address: string | null;
  created_at: string;
  username?: string;
  display_name?: string;
}

export interface AnalyticsFilters {
  date_from: string;
  date_to: string;
  course_years: string;
  departments: string;
  exclude_suspicious: boolean;
}

export interface QuestionSummaryItem {
  question_id: string;
  question_text: string;
  question_type: 'scale_1_5' | 'choice';
  category: string;
  choices?: string[];
  distribution: Record<string, number>;
  distribution_pct: Record<string, number>;
  mean?: number;
  count: number;
}

export interface CategoryStats {
  academic_mean: number;
  sleep_mean: number;
  emotional_mean: number;
  social_mean: number;
  total_mean: number;
  count: number;
  distribution: {
    low: number; mild: number; moderate: number; high: number; critical: number;
  };
}

export interface CrossAnalysisRow {
  group_value: string | number;
  academic_mean: number;
  sleep_mean: number;
  emotional_mean: number;
  social_mean: number;
  total_mean: number;
  count: number;
}

export interface TimelinePoint {
  date: string;
  count: number;
  mean_total: number;
  mean_academic: number;
  mean_sleep: number;
  mean_emotional: number;
  mean_social: number;
}

export interface DemographicsData {
  by_course: Array<{ label: string | number; count: number }>;
  by_department: Array<{ label: string; count: number }>;
  by_date: Array<{ label: string; count: number }>;
}

export interface AdminResponse {
  id: string;
  survey_id: string;
  created_at: string;
  course_year: number;
  department: string;
  score_academic: number;
  score_sleep: number;
  score_emotional: number;
  score_social: number;
  score_total: number;
  ip_hash?: string;
  fingerprint?: string;
  is_suspicious?: number;
  completion_time_seconds?: number;
}

export interface ResponseDetail {
  response: AdminResponse;
  answers: Array<{
    id: string;
    response_id: string;
    question_id: string;
    answer_value: string;
    normalized_score: number;
    question_text: string;
    question_type: string;
    category: string;
    scale_label_low?: string;
    scale_label_high?: string;
    choices_json?: string;
  }>;
}
