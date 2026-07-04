interface LearningOutcomesBlockProps {
  block: {
    outcomes?: string[];
  };
}

export function LearningOutcomesBlock({ block }: LearningOutcomesBlockProps) {
  if (!block.outcomes || block.outcomes.length === 0) return null;

  return (
    <div className="my-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md">
      <h4 className="font-semibold mb-3 text-green-800 dark:text-green-200">Learning Outcomes</h4>
      <ul className="list-disc list-inside space-y-2">
        {block.outcomes.map((outcome, index) => (
          <li key={index} className="text-muted-foreground">{outcome}</li>
        ))}
      </ul>
    </div>
  );
}
