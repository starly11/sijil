interface FaqItem {
  _id?: string;
  question?: string;
  answer?: string;
  schema_type?: string;
}

interface FaqSectionProps {
  faq: FaqItem[];
  title?: string;
}

export function FaqSection({ faq, title = 'Frequently Asked Questions' }: FaqSectionProps) {
  if (!faq.length) return null;

  return (
    <section className="my-10 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 dark:border-emerald-800 dark:from-emerald-950/40 dark:to-teal-950/30">
      <h2 className="mb-4 text-xl font-semibold text-emerald-900 dark:text-emerald-100">{title}</h2>
      <div className="space-y-3">
        {faq.map((item, idx) => (
          <details
            key={item._id || `faq-${idx}`}
            className="group rounded-lg border border-emerald-200 bg-white p-4 dark:border-emerald-800 dark:bg-emerald-950/30"
          >
            <summary className="cursor-pointer list-none font-medium text-foreground marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="text-emerald-700 dark:text-emerald-300">Q.</span>{' '}
              {item.question}
            </summary>
            <p className="mt-3 border-t border-emerald-100 pt-3 text-muted-foreground dark:border-emerald-900">
              <span className="font-medium text-emerald-700 dark:text-emerald-300">A.</span>{' '}
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
