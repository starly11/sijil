'use client';

import { Button } from '@/components/ui/button';

interface QuizNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  hasAnswered: boolean;
  isLastQuestion: boolean;
  onPrevious: () => void;
  onSubmit: () => void;
  onNext: () => void;
}

export default function QuizNavigation({
  currentQuestion,
  totalQuestions,
  hasAnswered,
  isLastQuestion,
  onPrevious,
  onSubmit,
  onNext,
}: QuizNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentQuestion <= 1}
      >
        Previous
      </Button>

      <div className="text-sm text-muted-foreground">
        Question {currentQuestion} of {totalQuestions}
      </div>

      {!isLastQuestion ? (
        <Button
          onClick={onNext}
          disabled={!hasAnswered}
        >
          Next
        </Button>
      ) : (
        <Button
            variant="primary"
            className="bg-green-600 hover:bg-green-700"
            onClick={onSubmit}
            disabled={!hasAnswered}
          >
          Submit Quiz
        </Button>
      )}
    </div>
  );
}
