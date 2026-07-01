export interface Assessment {
  id: string;
  topic_id: string;
  title: string;
  description?: string;
  questions: Question[];
  passing_score: number;
  time_limit_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  assessment_id: string;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'multiple_select';
  options: Option[];
  correct_answer_ids: string[];
  explanation?: string;
  points: number;
  order: number;
}

export interface Option {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order: number;
}

export interface QuizState {
  current_question_index: number;
  selected_answers: Record<string, string[]>;
  answered_questions: Set<string>;
  is_complete: boolean;
  score: number;
  total_points: number;
  start_time: number;
  end_time?: number;
}

export interface QuizResult {
  assessment_id: string;
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, string[]>;
  correct_answers: Record<string, string[]>;
  time_taken_seconds: number;
  completed_at: number;
}

export interface PracticeModeSettings {
  show_feedback_immediately: boolean;
  allow_retry: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
}
