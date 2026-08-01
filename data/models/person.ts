export type PersonRole =
  | 'artist'
  | 'journalist'
  | 'photographer'
  | 'videographer'
  | 'designer'
  | 'producer'
  | 'manager'
  | 'educator'
  | 'volunteer'
  | 'organization_member';

export interface Person {

  id: string;

  fullName: string;

  slug: string;

  headline: string;

  biography: string;

  avatar: string;

  city: string;

  country: string;

  website?: string;

  instagram?: string;

  youtube?: string;

  linkedin?: string;

  email?: string;

  roles: PersonRole[];

  skills: string[];

  interests: string[];

  verified: boolean;

  featured: boolean;

  createdAt: string;

  updatedAt: string;

}