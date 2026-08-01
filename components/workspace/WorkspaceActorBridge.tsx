'use client';

import { useEffect } from 'react';

import type {
  WorkspaceActor,
  WorkspaceRole,
} from '../../types/workspace';

import { workspaceStore } from '../../core/workspaceStore';

interface WorkspaceActorPerson {
  id: string;
  fullName: string;
  slug: string;
  headline: string | null;
  biography: string | null;
  verified: boolean;
  featured: boolean;
  status: string;
}

interface WorkspaceActorSpace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  verified: boolean;
  featured: boolean;
  status: string;
  membershipRole: string;
  membershipStatus: string;
}

interface WorkspaceActorFunder {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  verified: boolean;
  featured: boolean;
  status: string;
  membershipRole: string;
  membershipStatus: string;
}

interface WorkspaceActorBridgeProps {
  person: WorkspaceActorPerson | null;
  spaces: WorkspaceActorSpace[];
  funders: WorkspaceActorFunder[];
}

export function WorkspaceActorBridge({
  person,
  spaces,
  funders,
}: WorkspaceActorBridgeProps) {
  useEffect(() => {
    const actors: WorkspaceActor[] = [];

    if (person) {
      actors.push({
        id: person.id,
        type: 'person',
        name: person.fullName,
        slug: person.slug,
        description:
          person.headline ??
          person.biography ??
          undefined,

        role: 'owner',

        membershipStatus: 'active',

        verified: person.verified,
        featured: person.featured,

        status: normalizeActorStatus(
          person.status
        ),
      });
    }

    spaces.forEach((space) => {
      actors.push({
        id: space.id,
        type: 'space',
        name: space.name,
        slug: space.slug,
        description:
          space.description ??
          undefined,

        role: normalizeWorkspaceRole(
          space.membershipRole
        ),

        membershipStatus:
          space.membershipStatus,

        verified: space.verified,
        featured: space.featured,

        status: normalizeActorStatus(
          space.status
        ),
      });
    });

    funders.forEach((funder) => {
      actors.push({
        id: funder.id,
        type: 'funder',
        name: funder.name,
        slug: funder.slug,
        description:
          funder.description ??
          undefined,

        role: normalizeWorkspaceRole(
          funder.membershipRole
        ),

        membershipStatus:
          funder.membershipStatus,

        verified: funder.verified,
        featured: funder.featured,

        status: normalizeActorStatus(
          funder.status
        ),
      });
    });

    workspaceStore.setAvailableActors(
      actors
    );
  }, [person, spaces, funders]);

  return null;
}

function normalizeWorkspaceRole(
  role: string
): WorkspaceRole {
  switch (role) {
    case 'owner':
      return 'owner';

    case 'administrator':
      return 'administrator';

    case 'editor':
      return 'editor';

    case 'journalist':
      return 'journalist';

    case 'producer':
      return 'producer';

    case 'representative':
      return 'representative';

    case 'volunteer':
      return 'volunteer';

    case 'viewer':
      return 'viewer';

    default:
      return 'member';
  }
}

function normalizeActorStatus(
  status: string
):
  | 'draft'
  | 'review'
  | 'published'
  | 'archived' {
  switch (status) {
    case 'review':
      return 'review';

    case 'published':
      return 'published';

    case 'archived':
      return 'archived';

    default:
      return 'draft';
  }
}