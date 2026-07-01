interface FigureBlockProps {
  block: {
    figure_id?: string;
    caption?: string;
    image_path_local?: string;
  };
  figures?: any[];
}

export function FigureBlock({ block, figures }: FigureBlockProps) {
  // Try to find figure by figure_id first, then by caption match, or just use first figure
  let figure = figures?.find((f: any) => f._id === block.figure_id);
  if (!figure && figures?.length) {
    figure = figures.find((f: any) => f.caption === block.caption) || figures[0];
  }

  // If no figure found but we have block data, use that
  if (!figure && !block.caption && !block.image_path_local) {
    return null;
  }

  const imgSrc = figure?.image_url || figure?.url || block.image_path_local;

  return (
    <figure className="my-8">
      {imgSrc && (
        <img
          src={imgSrc}
          alt={figure?.caption || block.caption || ''}
          className="w-full max-w-3xl mx-auto rounded-lg"
        />
      )}
      {(figure?.caption || block.caption) && (
        <figcaption className="text-center text-sm text-muted-foreground mt-2">
          {figure?.caption || block.caption}
        </figcaption>
      )}
    </figure>
  );
}
