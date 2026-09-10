'use client';

import Image from 'next/image';

import { useEffect, useState } from 'react';

interface LogoProps {
  /** Alto en px al que se renderiza el logo. Por debajo de 100 se usa la variante reducida. */
  size?: number;
  /** Fuerza la variante de "fondo rojo" (hero, cortes de sección) sin depender del tema. */
  onRedSurface?: boolean;
  className?: string;
}

/**
 * NOTA DE ENTREGA: public/brand/culebreo-figura.png, culebreo-figura-halo.png y
 * culebreo-reducido.png son PLACEHOLDERS generados para no romper el build
 * (un trazo serpenteante genérico) — no son el arte de marca final. Reemplazar
 * los 3 archivos por el arte real del Culebreo antes de publicar.
 */
export function Logo({ size = 40, onRedSurface = false, className }: LogoProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'dark' : 'light');

    const observer = new MutationObserver(() => {
      const next = document.documentElement.getAttribute('data-theme');
      setTheme(next === 'dark' ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  if (size < 100) {
    return (
      <Image
        src="/brand/culebreo-reducido.png"
        alt="El Culebreo"
        width={128}
        height={128}
        style={{ width: size, height: size }}
        className={className}
        priority
      />
    );
  }

  const useHalo = onRedSurface || theme === 'dark';

  return (
    <Image
      src={useHalo ? '/brand/culebreo-figura-halo.png' : '/brand/culebreo-figura.png'}
      alt="El Culebreo"
      width={512}
      height={512}
      style={{ width: size, height: size }}
      className={className}
      priority
    />
  );
}
