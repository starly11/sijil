'use client';

import { useEffect, useState, useCallback } from 'react';
import { QuizResult } from '@/types/assessment';

const STORAGE_KEY_PREFIX = 'sijil_assessment_progress_';

interface AssessmentProgress {
  assessmentId: string;
  completedAt: number;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
}

export function useAssessmentProgress() {
  const [progress, setProgress] = useState<Record<string, AssessmentProgress>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('sijil_assessment_progress');
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load assessment progress:', error);
    }
  }, []);

  const saveProgress = useCallback((result: QuizResult) => {
    if (typeof window === 'undefined') return;

    const newProgress: AssessmentProgress = {
      assessmentId: result.assessment_id,
      completedAt: result.completed_at,
      score: result.score,
      totalPoints: result.total_points,
      percentage: result.percentage,
      passed: result.passed,
    };

    setProgress(prev => {
      const updated = {
        ...prev,
        [result.assessment_id]: newProgress,
      };

      try {
        localStorage.setItem('sijil_assessment_progress', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save assessment progress:', error);
      }

      return updated;
    });
  }, []);

  const getProgress = useCallback((assessmentId: string): AssessmentProgress | undefined => {
    return progress[assessmentId];
  }, [progress]);

  const getAllProgress = useCallback((): Record<string, AssessmentProgress> => {
    return progress;
  }, [progress]);

  const getBestScore = useCallback((assessmentId: string): number | undefined => {
    const prog = progress[assessmentId];
    return prog?.percentage;
  }, [progress]);

  const hasCompleted = useCallback((assessmentId: string): boolean => {
    return !!progress[assessmentId];
  }, [progress]);

  const hasPassed = useCallback((assessmentId: string): boolean => {
    const prog = progress[assessmentId];
    return prog?.passed ?? false;
  }, [progress]);

  const clearProgress = useCallback((assessmentId?: string) => {
    if (typeof window === 'undefined') return;

    if (assessmentId) {
      setProgress(prev => {
        const { [assessmentId]: removed, ...rest } = prev;
        try {
          localStorage.setItem('sijil_assessment_progress', JSON.stringify(rest));
        } catch (error) {
          console.error('Failed to clear assessment progress:', error);
        }
        return rest;
      });
    } else {
      setProgress({});
      try {
        localStorage.removeItem('sijil_assessment_progress');
      } catch (error) {
        console.error('Failed to clear all assessment progress:', error);
      }
    }
  }, []);

  return {
    progress,
    saveProgress,
    getProgress,
    getAllProgress,
    getBestScore,
    hasCompleted,
    hasPassed,
    clearProgress,
  };
}
