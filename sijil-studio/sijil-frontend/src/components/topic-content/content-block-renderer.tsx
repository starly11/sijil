import { ParagraphBlock } from './blocks/paragraph-block';
import { HeadingBlock } from './blocks/heading-block';
import { FigureBlock } from './blocks/figure-block';
import { TableBlock } from './blocks/table-block';
import { FormulaBlock } from './blocks/formula-block';
import { CalloutBlock } from './blocks/callout-block';
import { ExampleBlock } from './blocks/example-block';

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
    case 'text':
    case 'paragraph':
      return <ParagraphBlock block={{ content: block.markdown || block.content?.text || block.content }} />;
    case 'heading':
      return <HeadingBlock block={block} />;
    case 'figure':
      return <FigureBlock block={block} figures={figures} />;
    case 'table':
      return <TableBlock block={block} tables={tables} />;
    case 'formula':
      return <FormulaBlock block={block} />;
    case 'callout':
      return <CalloutBlock block={block} />;
    case 'example':
      return <ExampleBlock block={block} />;
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
