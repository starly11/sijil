import Link from 'next/link';

export default function DocumentNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">404</h2>
      <p className="mt-4 text-base text-muted-foreground max-w-md">
        The document you requested does not exist or has been removed from the registry.
      </p>
      <div className="mt-8">
        <Link href="/" className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
          Return to Dashboard Root
        </Link>
      </div>
    </div>
  );
}
