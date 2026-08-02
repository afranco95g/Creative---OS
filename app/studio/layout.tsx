import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { WorkspaceActorBridge } from '@/components/workspace/WorkspaceActorBridge';
import { createClient } from '@/lib/supabase/server';

interface StudioLayoutProps {
  children: ReactNode;
}

export default async function StudioLayout({ children }: StudioLayoutProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/studio');
  }

  const [personResult, spaceMembershipResult, funderMembershipResult] =
    await Promise.all([
      supabase
        .from('people')
        .select('id, full_name, slug, headline, biography, verified, featured, status')
        .eq('profile_id', user.id)
        .maybeSingle(),
      supabase
        .from('space_memberships')
        .select('space_id, role, status')
        .eq('profile_id', user.id)
        .eq('status', 'active'),
      supabase
        .from('funder_memberships')
        .select('funder_id, role, status')
        .eq('profile_id', user.id)
        .eq('status', 'active'),
    ]);

  const spaceMemberships = spaceMembershipResult.data ?? [];
  const funderMemberships = funderMembershipResult.data ?? [];
  const spaceIds = spaceMemberships.map((membership) => membership.space_id);
  const funderIds = funderMemberships.map((membership) => membership.funder_id);

  const [spacesResult, fundersResult] = await Promise.all([
    spaceIds.length
      ? supabase
          .from('spaces')
          .select('id, name, slug, description, verified, featured, status')
          .in('id', spaceIds)
      : Promise.resolve({ data: [], error: null }),
    funderIds.length
      ? supabase
          .from('funders')
          .select('id, name, slug, description, verified, featured, status')
          .in('id', funderIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const spaceMembershipById = new Map(
    spaceMemberships.map((membership) => [membership.space_id, membership])
  );
  const funderMembershipById = new Map(
    funderMemberships.map((membership) => [membership.funder_id, membership])
  );
  const person = personResult.data
    ? {
        id: personResult.data.id,
        fullName: personResult.data.full_name,
        slug: personResult.data.slug,
        headline: personResult.data.headline,
        biography: personResult.data.biography,
        verified: Boolean(personResult.data.verified),
        featured: Boolean(personResult.data.featured),
        status: personResult.data.status,
      }
    : null;
  const spaces = (spacesResult.data ?? []).map((space) => {
    const membership = spaceMembershipById.get(space.id)!;
    return {
      ...space,
      verified: Boolean(space.verified),
      featured: Boolean(space.featured),
      membershipRole: membership.role,
      membershipStatus: membership.status,
    };
  });
  const funders = (fundersResult.data ?? []).map((funder) => {
    const membership = funderMembershipById.get(funder.id)!;
    return {
      ...funder,
      verified: Boolean(funder.verified),
      featured: Boolean(funder.featured),
      membershipRole: membership.role,
      membershipStatus: membership.status,
    };
  });

  return (
    <>
      <WorkspaceActorBridge person={person} spaces={spaces} funders={funders} />
      {children}
    </>
  );
}
