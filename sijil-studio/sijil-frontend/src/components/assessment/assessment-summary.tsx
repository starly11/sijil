'use client';

import { QuizResult } from '@/types/assessment';
import ScoreDisplay from './score-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AssessmentSummaryProps {
  result: QuizResult;
  onRetake?: () => void;
}

export default function AssessmentSummary({ 
  result, 
  onRetake 
}: AssessmentSummaryProps) {
  const timeTaken = new Date(result.time_taken_seconds * 1000).toISOString().substr(14, 5);

  return (
    <Card className="p-8 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Assessment Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Score</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreDisplay 
                score={result.score}
                totalPoints={result.total_points}
                percentage={result.percentage}
                passed={result.passed}
                showDetails={false}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Time Taken</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">{timeTaken}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">
                  {Object.keys(result.answers).length} answered
                </p>
              </CardContent>
            </Card>

            <Card className={`${
              result.passed 
                ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
            }`}>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-1">
                  {result.passed ? '✓ Passed' : '✗ Needs Improvement'}
                </h3>
                <p className={`text-sm ${
                  result.passed 
                    ? 'text-green-700 dark:text-green-400' 
                    : 'text-red-700 dark:text-red-400'
                }`}>
                  {result.passed 
                    ? 'Congratulations! You have successfully completed this assessment.' 
                    : 'Keep practicing to improve your score.'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {onRetake && (
          <div className="flex gap-4">
            <Button
              onClick={onRetake}
              className="flex-1"
            >
              Retake Assessment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
