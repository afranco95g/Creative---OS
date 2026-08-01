import {
  supabase,
} from '../../lib/supabase/client';

export type RegistrationStatus =
  | 'registered'
  | 'attended'
  | 'cancelled';

export interface ExperienceAvailability {
  capacity: number | null;
  registeredCount: number;
  remaining: number | null;
  registrationOpen: boolean;
}

export interface ExperienceRegistrationInput {
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  attendeesCount: number;
}

export interface ExperienceRegistrationResult {
  registrationId: string;
  ticketToken: string;
  ticketCode: string;
  status: RegistrationStatus;
}

export interface ExperienceAttendee {
  registrationId: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  attendeesCount: number;
  status: RegistrationStatus;
  ticketCode: string;
  checkedInAt: string | null;
  createdAt: string;
}

interface ExperienceAvailabilityRow {
  capacity: number | null;
  registered_count: number;
  remaining: number | null;
  registration_open: boolean;
}

interface ExperienceRegistrationResultRow {
  registration_id: string;
  ticket_token: string;
  ticket_code: string;
  registration_status: RegistrationStatus;
}

interface ExperienceAttendeeRow {
  registration_id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  attendees_count: number;
  registration_status: RegistrationStatus;
  ticket_code: string;
  checked_in_at: string | null;
  created_at: string;
}

function getDatabase() {
  return supabase as any;
}

export async function loadExperienceAvailability(
  experienceId: string
): Promise<ExperienceAvailability> {
  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database.rpc(
    'get_experience_registration_availability',
    {
      target_experience_id:
        experienceId,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible consultar los cupos disponibles.'
    );
  }

  const rows =
    (
      data ?? []
    ) as ExperienceAvailabilityRow[];

  const row =
    rows[0];

  if (!row) {
    return {
      capacity: null,
      registeredCount: 0,
      remaining: null,
      registrationOpen: false,
    };
  }

  return {
    capacity:
      row.capacity,

    registeredCount:
      row.registered_count,

    remaining:
      row.remaining,

    registrationOpen:
      Boolean(
        row.registration_open
      ),
  };
}

export async function registerForExperience(
  experienceId: string,
  input: ExperienceRegistrationInput
): Promise<ExperienceRegistrationResult> {
  const attendeeName =
    input.attendeeName.trim();

  const attendeeEmail =
    input.attendeeEmail
      .trim()
      .toLowerCase();

  if (!attendeeName) {
    throw new Error(
      'Escribe tu nombre.'
    );
  }

  if (!attendeeEmail) {
    throw new Error(
      'Escribe tu correo electrónico.'
    );
  }

  if (
    input.attendeesCount < 1 ||
    input.attendeesCount > 10
  ) {
    throw new Error(
      'La cantidad de asistentes debe estar entre 1 y 10.'
    );
  }

  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database.rpc(
    'register_for_experience',
    {
      target_experience_id:
        experienceId,

      target_attendee_name:
        attendeeName,

      target_attendee_email:
        attendeeEmail,

      target_attendee_phone:
        input.attendeePhone.trim() ||
        null,

      target_attendees_count:
        input.attendeesCount,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible completar la inscripción.'
    );
  }

  const rows =
    (
      data ?? []
    ) as ExperienceRegistrationResultRow[];

  const row =
    rows[0];

  if (!row) {
    throw new Error(
      'La inscripción no produjo una entrada válida.'
    );
  }

  return {
    registrationId:
      row.registration_id,

    ticketToken:
      row.ticket_token,

    ticketCode:
      row.ticket_code,

    status:
      row.registration_status,
  };
}

export async function loadExperienceAttendees(
  experienceId: string
): Promise<ExperienceAttendee[]> {
  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database.rpc(
    'list_experience_attendees',
    {
      target_experience_id:
        experienceId,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar los asistentes.'
    );
  }

  const rows =
    (
      data ?? []
    ) as ExperienceAttendeeRow[];

  return rows.map(
    (row) => ({
      registrationId:
        row.registration_id,

      attendeeName:
        row.attendee_name,

      attendeeEmail:
        row.attendee_email,

      attendeePhone:
        row.attendee_phone ?? '',

      attendeesCount:
        row.attendees_count,

      status:
        row.registration_status,

      ticketCode:
        row.ticket_code,

      checkedInAt:
        row.checked_in_at,

      createdAt:
        row.created_at,
    })
  );
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: RegistrationStatus
): Promise<void> {
  const database =
    getDatabase();

  const {
    error,
  } = await database.rpc(
    'update_experience_registration_status',
    {
      target_registration_id:
        registrationId,

      target_status:
        status,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible actualizar la inscripción.'
    );
  }
}