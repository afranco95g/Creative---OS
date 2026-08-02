import { redirect } from 'next/navigation';

import {
  MyEcosystemDashboard,
} from '../../components/MyEcosystemDashboard';

import type {
  MyEcosystemFunder,
  MyEcosystemPerson,
  MyEcosystemProfile,
  MyEcosystemSpace,
} from '../../components/MyEcosystemDashboard';

import {
  createClient,
} from '../../lib/supabase/server';

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  onboarding_path: string | null;
  onboarding_status: string | null;
  is_active: boolean | null;
}

interface PersonRow {
  id: string;
  profile_id: string | null;
  full_name: string;
  slug: string;
  headline: string | null;
  biography: string | null;
  avatar_url: string | null;
  city: string | null;
  department: string | null;
  country: string | null;
  roles: string[] | null;
  skills: string[] | null;
  interests: string[] | null;
  website_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  public_email: string | null;
  verified: boolean | null;
  featured: boolean | null;
  status: string;
}

interface SpaceMembershipRow {
  space_id: string;
  role: string;
  status: string;
}

interface FunderMembershipRow {
  funder_id: string;
  role: string;
  status: string;
}

interface SpaceRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  department: string | null;
  country: string | null;
  capacity: number | null;
  space_types: string[] | null;
  offers: string[] | null;
  needs: string[] | null;
  verified: boolean | null;
  featured: boolean | null;
  status: string;
}

interface FunderRow {
  id: string;
  name: string;
  slug: string;
  funder_type: string;
  description: string | null;
  city: string | null;
  country: string | null;
  interests: string[] | null;
  support_modes: string[] | null;
  verified: boolean | null;
  featured: boolean | null;
  status: string;
}

export default async function MyEcosystemPage() {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      '/login?redirect=/mi-ecosistema'
    );
  }

  const warnings: string[] = [];

  /*
   * Estas consultas deben escribirse como strings
   * literales. No uses arrays con .join(',') porque
   * el analizador de tipos de Supabase pierde la
   * estructura de las columnas.
   */
  const [
    profileResult,
    personResult,
    spaceMembershipResult,
    funderMembershipResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, email, full_name, role, onboarding_path, onboarding_status, is_active'
      )
      .eq('id', user.id)
      .maybeSingle(),

    supabase
      .from('people')
      .select(
        'id, profile_id, full_name, slug, headline, biography, avatar_url, city, department, country, roles, skills, interests, website_url, instagram_url, youtube_url, linkedin_url, public_email, verified, featured, status'
      )
      .eq('profile_id', user.id)
      .maybeSingle(),

    supabase
      .from('space_memberships')
      .select(
        'space_id, role, status'
      )
      .eq('profile_id', user.id),

    supabase
      .from('funder_memberships')
      .select(
        'funder_id, role, status'
      )
      .eq('profile_id', user.id),
  ]);

  if (profileResult.error) {
    console.error(
      'Error loading profile:',
      profileResult.error
    );

    warnings.push(
      'No se pudo cargar completamente el perfil de acceso.'
    );
  }

  if (personResult.error) {
    console.error(
      'Error loading person:',
      personResult.error
    );

    warnings.push(
      'No se pudo cargar completamente la ficha personal.'
    );
  }

  if (
    spaceMembershipResult.error
  ) {
    console.error(
      'Error loading space memberships:',
      spaceMembershipResult.error
    );

    warnings.push(
      'No se pudieron consultar todos los espacios asociados.'
    );
  }

  if (
    funderMembershipResult.error
  ) {
    console.error(
      'Error loading funder memberships:',
      funderMembershipResult.error
    );

    warnings.push(
      'No se pudieron consultar todas las organizaciones asociadas.'
    );
  }

  const profileData =
    profileResult.data as
      | ProfileRow
      | null;

  const profile:
    MyEcosystemProfile = {
      id: user.id,

      email:
        profileData?.email ??
        user.email ??
        '',

      fullName:
        profileData?.full_name ??
        user.user_metadata
          ?.full_name ??
        user.email
          ?.split('@')[0] ??
        'Persona del ecosistema',

      role:
        profileData?.role ??
        'member',

      onboardingPath:
        profileData
          ?.onboarding_path ??
        'person',

      onboardingStatus:
        profileData
          ?.onboarding_status ??
        'in_progress',

      isActive:
        profileData?.is_active ??
        true,
    };

  const personData =
    personResult.data as
      | PersonRow
      | null;

  const person:
    MyEcosystemPerson | null =
    personData
      ? {
          id:
            personData.id,

          fullName:
            personData.full_name,

          slug:
            personData.slug,

          headline:
            personData.headline,

          biography:
            personData.biography,

          avatarUrl:
            personData.avatar_url,

          city:
            personData.city,

          department:
            personData.department,

          country:
            personData.country,

          roles:
            Array.isArray(
              personData.roles
            )
              ? personData.roles
              : [],

          skills:
            Array.isArray(
              personData.skills
            )
              ? personData.skills
              : [],

          interests:
            Array.isArray(
              personData.interests
            )
              ? personData.interests
              : [],

          websiteUrl: personData.website_url,
          instagramUrl: personData.instagram_url,
          youtubeUrl: personData.youtube_url,
          linkedinUrl: personData.linkedin_url,
          publicEmail: personData.public_email,

          verified:
            Boolean(
              personData.verified
            ),

          featured:
            Boolean(
              personData.featured
            ),

          status:
            personData.status,
        }
      : null;

  const spaceMemberships =
    (
      spaceMembershipResult.data ??
      []
    ) as SpaceMembershipRow[];

  const funderMemberships =
    (
      funderMembershipResult.data ??
      []
    ) as FunderMembershipRow[];

  const spaceIds =
    spaceMemberships.map(
      (membership) =>
        membership.space_id
    );

  const funderIds =
    funderMemberships.map(
      (membership) =>
        membership.funder_id
    );

  let spaces:
    MyEcosystemSpace[] = [];

  let funders:
    MyEcosystemFunder[] = [];

  if (spaceIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from('spaces')
      .select(
        'id, name, slug, description, city, department, country, capacity, space_types, offers, needs, verified, featured, status'
      )
      .in('id', spaceIds)
      .order(
        'created_at',
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        'Error loading spaces:',
        error
      );

      warnings.push(
        'No fue posible cargar la información completa de tus espacios.'
      );
    }

    const spaceRows =
      (
        data ?? []
      ) as SpaceRow[];

    spaces =
      spaceRows.map(
        (space) => {
          const membership =
            spaceMemberships.find(
              (
                currentMembership
              ) =>
                currentMembership.space_id ===
                space.id
            );

          return {
            id:
              space.id,

            name:
              space.name,

            slug:
              space.slug,

            description:
              space.description,

            city:
              space.city,

            department:
              space.department,

            country:
              space.country,

            capacity:
              space.capacity,

            spaceTypes:
              Array.isArray(
                space.space_types
              )
                ? space.space_types
                : [],

            offers:
              Array.isArray(
                space.offers
              )
                ? space.offers
                : [],

            needs:
              Array.isArray(
                space.needs
              )
                ? space.needs
                : [],

            verified:
              Boolean(
                space.verified
              ),

            featured:
              Boolean(
                space.featured
              ),

            status:
              space.status,

            membershipRole:
              membership?.role ??
              'member',

            membershipStatus:
              membership?.status ??
              'active',
          };
        }
      );
  }

  if (funderIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from('funders')
      .select(
        'id, name, slug, funder_type, description, city, country, interests, support_modes, verified, featured, status'
      )
      .in('id', funderIds)
      .order(
        'created_at',
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        'Error loading funders:',
        error
      );

      warnings.push(
        'No fue posible cargar la información completa de tus organizaciones.'
      );
    }

    const funderRows =
      (
        data ?? []
      ) as FunderRow[];

    funders =
      funderRows.map(
        (funder) => {
          const membership =
            funderMemberships.find(
              (
                currentMembership
              ) =>
                currentMembership.funder_id ===
                funder.id
            );

          return {
            id:
              funder.id,

            name:
              funder.name,

            slug:
              funder.slug,

            funderType:
              funder.funder_type,

            description:
              funder.description,

            city:
              funder.city,

            country:
              funder.country,

            interests:
              Array.isArray(
                funder.interests
              )
                ? funder.interests
                : [],

            supportModes:
              Array.isArray(
                funder.support_modes
              )
                ? funder.support_modes
                : [],

            verified:
              Boolean(
                funder.verified
              ),

            featured:
              Boolean(
                funder.featured
              ),

            status:
              funder.status,

            membershipRole:
              membership?.role ??
              'member',

            membershipStatus:
              membership?.status ??
              'active',
          };
        }
      );
  }

  return (
    <MyEcosystemDashboard
      profile={profile}
      person={person}
      spaces={spaces}
      funders={funders}
      warnings={warnings}
    />
  );
}
