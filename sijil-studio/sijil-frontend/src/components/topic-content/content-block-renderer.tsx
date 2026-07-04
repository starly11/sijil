import { ParagraphBlock } from './blocks/paragraph-block';
import { HeadingBlock } from './blocks/heading-block';
import { FigureBlock } from './blocks/figure-block';
import { TableBlock } from './blocks/table-block';
import { FormulaBlock } from './blocks/formula-block';
import { CalloutBlock } from './blocks/callout-block';
import { ExampleBlock } from './blocks/example-block';
import { ListBlock } from './blocks/list-block';
import { DefinitionBlock } from './blocks/definition-block';
import { LearningOutcomesBlock } from './blocks/learning-outcomes-block';
import { ComparisonViewBlock } from './blocks/comparison-view-block';
import { QuranVerseBlock } from './blocks/quran-verse-block';
import { QuranReferenceBlock } from './blocks/quran-reference-block';
import { ActivityBlock } from './blocks/activity-block';
import { EquationBlock } from './blocks/equation-block';
import { NumericalBlock } from './blocks/numerical-block';
import { MCQBlock } from './blocks/mcq-block';

interface ContentBlockRendererProps {
  block: any;
  figures?: any[];
  tables?: any[];
}

export function ContentBlockRenderer({
  block,
  figures,
  tables,
}: ContentBlockRendererProps) {
  switch (block.type) {
    case 'paragraph':
      return <ParagraphBlock block={block} />;
    case 'heading':
      return <HeadingBlock block={block} />;
    case 'figure':
      return <FigureBlock block={block} figures={figures} />;
    case 'table':
      return <TableBlock block={block} />;
    case 'formula':
      return <FormulaBlock block={block} />;
    case 'callout':
      return <CalloutBlock block={block} />;
    case 'mcq':
      return <MCQBlock block={block} />;
    case 'example':
      return <ExampleBlock block={block} />;
    case 'list':
      return <ListBlock block={block} />;
    case 'definition':
      return <DefinitionBlock block={block} />;
    case 'learning_outcomes':
      return <LearningOutcomesBlock block={block} />;
    case 'comparison_view':
      return <ComparisonViewBlock block={block} />;
    case 'quran_verse':
      return <QuranVerseBlock block={block} />;
    case 'quran_reference':
      return <QuranReferenceBlock block={block} />;
    case 'activity':
      return <ActivityBlock block={block} />;
    case 'equation':
      return <EquationBlock block={block} />;
    case 'numerical':
      return <NumericalBlock block={block} />;
    default:
      return (
        <div className="p-4 border rounded">
          <p className="text-muted-foreground">
            Unknown block type: {block.type}
          </p>
        </div>
      );
  }
}
