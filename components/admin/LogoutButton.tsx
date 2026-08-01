'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { supabase } from '../../lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleLogout() {
    setIsLoading(true);
    setErrorMessage('');

    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage('No fue posible cerrar la sesión.');
      setIsLoading(false);
      return;
    }

    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Cerrando sesión...' : 'Cerrar sesión'}
      </button>

      {errorMessage ? (
        <p className="text-xs text-red-300">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}