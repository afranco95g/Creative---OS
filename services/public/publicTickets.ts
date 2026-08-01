import {
  createClient,
} from '../../lib/supabase/server';

export interface PublicExperienceTicket {
  registrationId: string;
  status:
    | 'registered'
    | 'attended'
    | 'cancelled';

  ticketCode: string;

  attendeeName: string;
  attendeeEmail: string;
  attendeesCount: number;

  experienceId: string;
  experienceTitle: string;
  experienceSlug: string;

  startsAt: string;
  endsAt: string | null;

  venueName: string | null;
  city: string | null;
  address: string | null;

  checkedInAt: string | null;
}

interface PublicExperienceTicketRow {
  registration_id: string;
  registration_status:
    | 'registered'
    | 'attended'
    | 'cancelled';

  ticket_code: string;

  attendee_name: string;
  attendee_email: string;
  attendees_count: number;

  experience_id: string;
  experience_title: string;
  experience_slug: string;

  starts_at: string;
  ends_at: string | null;

  venue_name: string | null;
  city: string | null;
  address: string | null;

  checked_in_at: string | null;
}

export async function getPublicExperienceTicket(
  token: string
): Promise<PublicExperienceTicket | null> {
  if (!isUuid(token)) {
    return null;
  }

  const supabase =
    await createClient();

  const database =
    supabase as any;

  const {
    data,
    error,
  } = await database.rpc(
    'get_public_experience_ticket',
    {
      target_ticket_token:
        token,
    }
  );

  if (error) {
    console.error(
      'Error loading public ticket:',
      error
    );

    throw new Error(
      'No fue posible cargar la entrada.'
    );
  }

  const rows =
    (
      data ?? []
    ) as PublicExperienceTicketRow[];

  const row =
    rows[0];

  if (!row) {
    return null;
  }

  return {
    registrationId:
      row.registration_id,

    status:
      row.registration_status,

    ticketCode:
      row.ticket_code,

    attendeeName:
      row.attendee_name,

    attendeeEmail:
      row.attendee_email,

    attendeesCount:
      row.attendees_count,

    experienceId:
      row.experience_id,

    experienceTitle:
      row.experience_title,

    experienceSlug:
      row.experience_slug,

    startsAt:
      row.starts_at,

    endsAt:
      row.ends_at,

    venueName:
      row.venue_name,

    city:
      row.city,

    address:
      row.address,

    checkedInAt:
      row.checked_in_at,
  };
}

function isUuid(
  value: string
): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}