'use client';

import { useState, useCallback, useMemo } from 'react';
import { Question, QuizState, QuizResult, PracticeModeSettings } from '@/types/assessment';

interface UseQuizOptions {
  questions: Question[];
  practiceMode?: boolean;
  settings?: PracticeModeSettings;
}

export function useQuiz({ questions, practiceMode = false, settings }: UseQuizOptions) {
  const [quizState, setQuizState] = useState<QuizState>({
    current_question_index: 0,
    selected_answers: {},
    answered_questions: new Set(),
    is_complete: false,
    score: 0,
    total_points: questions.reduce((sum, q) => sum + q.points, 0),
    start_time: Date.now(),
  });

  const shuffledQuestions = useMemo(() => {
    if (!settings?.shuffle_questions) return questions;
    return [...questions].sort(() => Math.random() - 0.5);
  }, [questions, settings?.shuffle_questions]);

  const currentQuestion = shuffledQuestions[quizState.current_question_index];

  const selectAnswer = useCallback((questionId: string, optionIds: string[]) => {
    setQuizState(prev => ({
      ...prev,
      selected_answers: {
        ...prev.selected_answers,
        [questionId]: optionIds,
      },
    }));
  }, []);

  const submitAnswer = useCallback(() => {
    if (!currentQuestion) return;

    const selectedOptionIds = quizState.selected_answers[currentQuestion.id] || [];
    const correctOptionIds = currentQuestion.correct_answer_ids;
    
    const isCorrect = 
      selectedOptionIds.length === correctOptionIds.length &&
      selectedOptionIds.every(id => correctOptionIds.includes(id));

    const pointsEarned = isCorrect ? currentQuestion.points : 0;

    setQuizState(prev => ({
      ...prev,
      answered_questions: new Set(prev.answered_questions).add(currentQuestion.id),
      score: prev.score + pointsEarned,
    }));

    return { isCorrect, explanation: currentQuestion.explanation };
  }, [currentQuestion, quizState.selected_answers]);

  const nextQuestion = useCallback(() => {
    setQuizState(prev => {
      if (prev.current_question_index >= shuffledQuestions.length - 1) {
        return {
          ...prev,
          is_complete: true,
          end_time: Date.now(),
        };
      }
      return {
        ...prev,
        current_question_index: prev.current_question_index + 1,
      };
    });
  }, [shuffledQuestions.length]);

  const previousQuestion = useCallback(() => {
    setQuizState(prev => ({
      ...prev,
      current_question_index: Math.max(0, prev.current_question_index - 1),
    }));
  }, []);

  const goToQuestion = useCallback((index: number) => {
    setQuizState(prev => ({
      ...prev,
      current_question_index: Math.max(0, Math.min(index, shuffledQuestions.length - 1)),
    }));
  }, [shuffledQuestions.length]);

  const resetQuiz = useCallback(() => {
    setQuizState({
      current_question_index: 0,
      selected_answers: {},
      answered_questions: new Set(),
      is_complete: false,
      score: 0,
      total_points: questions.reduce((sum, q) => sum + q.points, 0),
      start_time: Date.now(),
    });
  }, [questions]);

  const getQuestionStatus = useCallback((questionId: string) => {
    if (!quizState.answered_questions.has(questionId)) return 'unanswered';
    
    const question = questions.find(q => q.id === questionId);
    if (!question) return 'unknown';
    
    const selectedAnswers = quizState.selected_answers[questionId] || [];
    const isCorrect = 
      selectedAnswers.length === question.correct_answer_ids.length &&
      selectedAnswers.every(id => question.correct_answer_ids.includes(id));
    
    return isCorrect ? 'correct' : 'incorrect';
  }, [quizState.answered_questions, quizState.selected_answers, questions]);

  const getResult = useCallback((): QuizResult | null => {
    if (!quizState.is_complete) return null;

    const timeTaken = ((quizState.end_time || Date.now()) - quizState.start_time) / 1000;
    const percentage = (quizState.score / quizState.total_points) * 100;

    return {
      assessment_id: questions[0]?.id || '',
      score: quizState.score,
      total_points: quizState.total_points,
      percentage,
      passed: percentage >= 70,
      answers: quizState.selected_answers,
      correct_answers: questions.reduce((acc, q) => {
        acc[q.id] = q.correct_answer_ids;
        return acc;
      }, {} as Record<string, string[]>),
      time_taken_seconds: timeTaken,
      completed_at: quizState.end_time || Date.now(),
    };
  }, [quizState, questions]);

  const progress = useMemo(() => {
    return ((quizState.current_question_index + 1) / shuffledQuestions.length) * 100;
  }, [quizState.current_question_index, shuffledQuestions.length]);

  return {
    questions: shuffledQuestions,
    currentQuestion,
    currentIndex: quizState.current_question_index,
    totalQuestions: shuffledQuestions.length,
    selectedAnswers: quizState.selected_answers,
    answeredQuestions: quizState.answered_questions,
    isComplete: quizState.is_complete,
    score: quizState.score,
    totalPoints: quizState.total_points,
    progress,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    resetQuiz,
    getQuestionStatus,
    getResult,
  };
}
