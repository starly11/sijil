import Link from 'next/link';

interface RelatedTopic {
  target_entity: string;
  resolved_url: string;
  relationship_type?: string;
  context?: string;
}

interface RelatedTopicsBlockProps {
  related_topics?: RelatedTopic[];
}

const relationshipTypeLabels: Record<string, string> = {
  'prerequisite': 'Prerequisite',
  'related_concept': 'Related Concept',
  'advanced_topic': 'Advanced Topic',
  'example_application': 'Example Application',
  'historical_context': 'Historical Context',
  'scientific_law': 'Scientific Law',
  'mathematical_foundation': 'Mathematical Foundation',
  'real_world_connection': 'Real-World Connection',
};

function getRelationshipLabel(type?: string): string {
  if (!type) return 'Related Topics';
  const normalized = type.toLowerCase().replace(/[-_]/g, '_');
  return relationshipTypeLabels[normalized] || type.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function RelatedTopicsBlock({ related_topics }: RelatedTopicsBlockProps) {
  if (!related_topics || related_topics.length === 0) {
    return null;
  }

  // Group by relationship_type
  const grouped = related_topics.reduce((acc, topic) => {
    const type = topic.relationship_type || 'general';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(topic);
    return acc;
  }, {} as Record<string, RelatedTopic[]>);

  const groupKeys = Object.keys(grouped);

  return (
    <div className="my-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
        Related Topics
      </h3>
      
      {groupKeys.map((type) => (
        <div key={type} className="mb-6 last:mb-0">
          {groupKeys.length > 1 && (
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">
              {getRelationshipLabel(type)}
            </h4>
          )}
          <ul className="space-y-2">
            {grouped[type].map((topic, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-slate-400 mt-1.5">•</span>
                <Link
                  href={`/topics${topic.resolved_url}`}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
                >
                  {topic.target_entity}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
