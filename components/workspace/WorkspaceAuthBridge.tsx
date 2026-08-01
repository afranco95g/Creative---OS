'use client';

import {
  type ReactNode,
  useEffect,
} from 'react';

import type {
  User,
} from '@supabase/supabase-js';

import {
  supabase,
} from '../../lib/supabase/client';

import {
  workspaceStore,
} from '../../core/workspaceStore';

interface WorkspaceAuthBridgeProps {
  children: ReactNode;
}

interface ProfileResult {
  full_name: string | null;
  email: string | null;
}

export function WorkspaceAuthBridge({
  children,
}: WorkspaceAuthBridgeProps) {
  useEffect(() => {
    let isMounted = true;

    async function connectUser(
      user: User
    ) {
      const {
        data: profileData,
        error: profileError,
      } =
        await supabase
          .from('profiles')
          .select(
            'full_name, email'
          )
          .eq(
            'id',
            user.id
          )
          .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (profileError) {
        console.warn(
          'No fue posible cargar el perfil para el workspace:',
          profileError.message
        );
      }

      const profile =
        profileData as
          | ProfileResult
          | null;

      const metadataName =
        typeof user.user_metadata
          ?.account_name ===
          'string'
          ? user.user_metadata
              .account_name
          : typeof user
              .user_metadata
              ?.full_name ===
              'string'
            ? user.user_metadata
                .full_name
            : typeof user
                .user_metadata
                ?.name ===
                'string'
              ? user.user_metadata
                  .name
              : '';

      const email =
        profile?.email ||
        user.email ||
        '';

      const name =
        profile?.full_name ||
        metadataName ||
        email.split('@')[0] ||
        'Cuenta de Cultura Esta';

      workspaceStore
        .connectAuthenticatedUser({
          id: user.id,
          name,
          email,
        });
    }

    async function initializeWorkspace() {
      const {
        data: {
          user,
        },
        error,
      } =
        await supabase.auth
          .getUser();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.warn(
          'No fue posible identificar la sesión para el workspace:',
          error.message
        );

        workspaceStore
          .disconnectAuthenticatedUser();

        return;
      }

      if (!user) {
        workspaceStore
          .disconnectAuthenticatedUser();

        return;
      }

      await connectUser(user);
    }

    void initializeWorkspace();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth
        .onAuthStateChange(
          (
            event,
            session
          ) => {
            if (
              event ===
                'SIGNED_OUT' ||
              !session?.user
            ) {
              workspaceStore
                .disconnectAuthenticatedUser();

              return;
            }

            void connectUser(
              session.user
            );
          }
        );

    return () => {
      isMounted = false;

      subscription.unsubscribe();
    };
  }, []);

  return children;
}