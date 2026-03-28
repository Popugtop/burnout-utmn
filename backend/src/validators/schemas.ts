import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(128),
});

export const changePasswordSchema = z.object({
  old_password: z.string().min(1),
  new_password: z.string().min(8).max(128),
});

export const submitSurveySchema = z.object({
  survey_id: z.string().uuid(),
  course_year: z.number().int().min(1).max(5),
  department: z.string().min(1).max(200),
  answers: z.array(z.object({
    question_id: z.string().uuid(),
    value: z.string().min(1).max(100),
  })).min(1),
  fingerprint: z.string().max(200).optional(),
  completion_time_seconds: z.number().int().min(0).optional(),
  honeypot: z.string().max(0).optional(), // must be empty
});

export const createSurveySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

export const questionSchema = z.object({
  category: z.enum(['academic', 'sleep', 'emotional', 'social']),
  question_text: z.string().min(1).max(500),
  question_type: z.enum(['scale_1_5', 'choice']),
  scale_label_low: z.string().max(100).optional().nullable(),
  scale_label_high: z.string().max(100).optional().nullable(),
  choices_json: z.string().optional().nullable(),
  is_inverted: z.number().int().min(0).max(1).optional(),
  scoring_map_json: z.string().optional().nullable(),
  order_index: z.number().int().min(0).optional(),
});
