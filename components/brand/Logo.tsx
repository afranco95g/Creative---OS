'use client';

import Image from 'next/image';

import { useEffect, useState } from 'react';

interface LogoProps {
  /**
   * Alto en px al que se renderiza el logo (el ancho se ajusta solo: la
   * figura es más alta que ancha, no un ícono cuadrado). Por debajo de 100
   * debería usarse la variante reducida — ver nota en el componente.
   */
  size?: number;
  /** Fuerza la variante de "fondo rojo" (hero, cortes de sección) sin depender del tema. */
  onRedSurface?: boolean;
  className?: string;
}

/**
 * NOTA: public/brand/culebreo-figura.png y culebreo-figura-halo.png son el
 * arte real (recortado al contenido con margen). Falta culebreo-reducido.png
 * — el isotipo simplificado (sombrero + cabeza) que pide el doc de identidad
 * para usos bajo 100px, que un simple resize del trazo completo no resuelve
 * (queda ilegible por debajo de ~100px). Mientras no exista ese archivo,
 * usamos el arte completo escalado por CSS también a tamaños chicos — no es
 * la solución final, pero evita una imagen rota en el header. En cuanto
 * culebreo-reducido.png exista en public/brand/, restaurar la rama de abajo.
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

  // TODO: cuando exista public/brand/culebreo-reducido.png, restaurar:
  // if (size < 100) {
  //   return (
  //     <Image src="/brand/culebreo-reducido.png" alt="El Culebreo" width={128} height={128}
  //       style={{ width: size, height: size }} className={className} priority />
  //   );
  // }

  const useHalo = onRedSurface || theme === 'dark';

  // Dimensiones reales del PNG recortado — deben coincidir con el archivo
  // en public/brand/ o el navegador fuerza el aspect-ratio equivocado
  // (el atributo width/height gana sobre el tamaño natural de la imagen).
  const intrinsic = useHalo ? { width: 403, height: 858 } : { width: 276, height: 734 };

  return (
    <Image
      src={useHalo ? '/brand/culebreo-figura-halo.png' : '/brand/culebreo-figura.png'}
      alt="El Culebreo"
      width={intrinsic.width}
      height={intrinsic.height}
      style={{ height: size, width: 'auto' }}
      className={className}
      priority
    />
  );
}
