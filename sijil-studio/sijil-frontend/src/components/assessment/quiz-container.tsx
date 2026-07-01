'use client';

import { useState } from 'react';
import { Question } from '@/types/assessment';
import { useQuiz } from '@/hooks/use-quiz';
import MCQBlock from './mcq-block';
import ProgressBar from './progress-bar';
import QuizNavigation from './quiz-navigation';
import PracticeModeToggle from './practice-mode-toggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuizContainerProps {
  questions: Question[];
  title: string;
  description?: string;
  passingScore?: number;
}

export default function QuizContainer({ 
  questions, 
  title, 
  description,
  passingScore = 70 
}: QuizContainerProps) {
  const [practiceMode, setPracticeMode] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);

  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    selectedAnswers,
    answeredQuestions,
    isComplete,
    score,
    totalPoints,
    progress,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    resetQuiz,
    getQuestionStatus,
    getResult,
  } = useQuiz({
    questions,
    practiceMode,
    settings: {
      show_feedback_immediately: practiceMode,
      allow_retry: practiceMode,
      shuffle_questions: !practiceMode,
      shuffle_options: !practiceMode,
    },
  });

  const handleSubmitAnswer = () => {
    const result = submitAnswer();
    if (result && practiceMode) {
      setShowFeedback(true);
    }
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    nextQuestion();
  };

  if (isComplete) {
    const result = getResult();
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-8">
          <CardHeader>
            <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {result && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${
                    result.passed ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.percentage.toFixed(0)}%
                  </div>
                  <p className="text-muted-foreground mt-2">
                    {result.score} out of {result.total_points} points
                  </p>
                </div>

                <div className={`p-4 rounded-md border ${
                  result.passed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className={`font-semibold ${
                    result.passed ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.passed 
                      ? '✓ Congratulations! You passed the quiz.' 
                      : '✗ Keep practicing! You can retake this quiz.'}
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={resetQuiz}
                    className="flex-1"
                  >
                    Retake Quiz
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="p-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <PracticeModeToggle
            practiceMode={practiceMode}
            onToggle={setPracticeMode}
          />
        </CardHeader>
        <CardContent>
          <ProgressBar 
            current={currentIndex + 1} 
            total={totalQuestions} 
            percentage={progress} 
          />
        </CardContent>
      </Card>

      {currentQuestion && (
        <MCQBlock
          question={currentQuestion}
          selectedAnswers={selectedAnswers[currentQuestion.id] || []}
          onSelectAnswer={(answers) => selectAnswer(currentQuestion.id, answers)}
          showFeedback={practiceMode && showFeedback}
          isCorrect={getQuestionStatus(currentQuestion.id) === 'correct'}
          disabled={!practiceMode && answeredQuestions.has(currentQuestion.id)}
        />
      )}

      <QuizNavigation
        currentQuestion={currentIndex + 1}
        totalQuestions={totalQuestions}
        hasAnswered={!!selectedAnswers[currentQuestion?.id || '']}
        isLastQuestion={currentIndex >= totalQuestions - 1}
        onPrevious={previousQuestion}
        onSubmit={handleSubmitAnswer}
        onNext={handleNextQuestion}
      />
    </div>
  );
}
