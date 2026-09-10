interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-6 border-b border-borde pb-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-texto-principal">
            {eyebrow}
          </p>
        )}

        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          {title}
        </h1>

        {description && (
          <p className="mt-4 text-lg leading-relaxed text-texto-largo">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </header>
  );
}