interface FigureBlockProps {
  block: {
    figure_id?: string;
    figure_number?: string;
    caption?: string;
    alt?: string;
    image_path_local?: string;
    url?: string;
  };
  figures?: any[];
}

export function FigureBlock({ block, figures }: FigureBlockProps) {
  let figure = figures?.find((f: any) => f._id === block.figure_id || f.figure_number === block.figure_number);
  if (!figure && figures?.length) {
    figure = figures.find((f: any) => f.caption === block.caption) || figures[0];
  }

  const imgSrc = figure?.image_url || figure?.url || block.url || block.image_path_local;
  const altText = figure?.alt || block.alt || figure?.caption || block.caption || 'Figure';
  const caption = figure?.caption || block.caption;
  const figureNumber = block.figure_number || figure?.figure_number;

  if (!imgSrc && !caption) {
    return null;
  }

  return (
    <figure className="my-8 rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-4 dark:border-sky-800 dark:from-sky-950/40 dark:to-blue-950/30">
      {imgSrc && (
        <img
          src={imgSrc}
          alt={altText}
          loading="lazy"
          className="mx-auto w-full max-w-3xl rounded-lg shadow-sm"
        />
      )}
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {figureNumber ? (
            <span className="font-semibold text-sky-800 dark:text-sky-200">Figure {figureNumber}: </span>
          ) : null}
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
