interface EditorialCardProps {
  category: string;
  title: string;
  description: string;
}

export function EditorialCard({
  category,
  title,
  description,
}: EditorialCardProps) {
  return (
    <article className="group overflow-hidden rounded-[28px] border border-white/10 bg-[#0A0A0A] transition duration-300 hover:-translate-y-1 hover:border-[#D9FF00]/40">

      <div className="aspect-[16/10] bg-gradient-to-br from-[#2B2B2B] to-[#111111] flex items-center justify-center text-[#666]">
        Imagen
      </div>

      <div className="p-7">

        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#D9FF00]">
          {category}
        </p>

        <h3 className="mt-4 text-2xl font-semibold leading-snug">
          {title}
        </h3>

        <p className="mt-4 leading-relaxed text-[#8A8A8A]">
          {description}
        </p>

        <div className="mt-8 text-sm font-semibold text-white group-hover:text-[#D9FF00]">
          Leer más →
        </div>

      </div>

    </article>
  );
}