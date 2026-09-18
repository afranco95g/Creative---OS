'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MusicBusinessCoursePlatform } from './MusicBusinessCoursePlatform';
import { MusicBusinessTeaser } from './MusicBusinessTeaser';

type AccessState = 'checking' | 'granted' | 'denied';

/**
 * Decide qué ve cada visitante de /cursos/music-business:
 * - Cualquiera (con sesión o sin ella) ve la vitrina pública (precio,
 *   programa, cómo inscribirse) -- MusicBusinessTeaser.
 * - Solo una cuenta con membresía activa en el funder de Imagine Company
 *   (funder_memberships, cualquier rol) ve el contenido completo del curso
 *   -- MusicBusinessCoursePlatform.
 *
 * El curso vale $2.500.000 COP y todavía no existe una pasarela de pago
 * real en el producto ("Ticketing con pago real todavía no existe" es
 * decisión de producto ya registrada) -- por eso hoy el acceso es
 * exclusivamente para el equipo de Imagine (quien crea y mantiene el
 * contenido), no para compradores. Cuando exista un mecanismo real de
 * compra, esta función es el único lugar que hay que tocar para sumar
 * "o tiene una compra activa" a la condición de acceso.
 */
function useMusicBusinessAccess(): AccessState {
  const [access, setAccess] = useState<AccessState>('checking');

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setAccess('denied');
        return;
      }

      const { data: funder } = await supabase
        .from('funders')
        .select('id')
        .eq('public_email', 'imaginecompanysas@gmail.com')
        .maybeSingle();

      if (!funder) {
        if (!cancelled) setAccess('denied');
        return;
      }

      const { data: membership } = await supabase
        .from('funder_memberships')
        .select('id')
        .eq('funder_id', funder.id)
        .eq('profile_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!cancelled) {
        setAccess(membership ? 'granted' : 'denied');
      }
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, []);

  return access;
}

export function MusicBusinessAccessGate() {
  const access = useMusicBusinessAccess();

  if (access === 'checking') {
    return (
      <div className="py-16 text-center text-sm text-texto-largo">
        Cargando…
      </div>
    );
  }

  if (access === 'granted') {
    return <MusicBusinessCoursePlatform />;
  }

  return <MusicBusinessTeaser />;
}
