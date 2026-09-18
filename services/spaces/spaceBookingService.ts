import { supabase } from '../../lib/supabase/client';
import { z } from 'zod';

export type BookingRequestStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';
export type BookingPaymentStatus = 'pending' | 'paid';

export interface SpaceBookingRequest {
  id: string;
  roomId: string;
  renterProfileId: string;
  projectId: string | null;
  eventType: string;
  startsAt: string;
  endsAt: string;
  specialRequests: string;
  extraStaffRequested: boolean;
  status: BookingRequestStatus;
  paymentStatus: BookingPaymentStatus;
  createdAt: string;
  updatedAt: string;
}

interface SpaceBookingRequestRow {
  id: string;
  room_id: string;
  renter_profile_id: string;
  project_id: string | null;
  event_type: string;
  starts_at: string;
  ends_at: string;
  special_requests: string;
  extra_staff_requested: boolean;
  status: BookingRequestStatus;
  payment_status: BookingPaymentStatus;
  created_at: string;
  updated_at: string;
}

const BOOKING_REQUEST_COLUMNS =
  'id, room_id, renter_profile_id, project_id, event_type, starts_at, ends_at, special_requests, extra_staff_requested, status, payment_status, created_at, updated_at';

function mapBookingRow(row: SpaceBookingRequestRow): SpaceBookingRequest {
  return {
    id: row.id,
    roomId: row.room_id,
    renterProfileId: row.renter_profile_id,
    projectId: row.project_id,
    eventType: row.event_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    specialRequests: row.special_requests,
    extraStaffRequested: row.extra_staff_requested,
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const createBookingRequestSchema = z.object({
  roomId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  eventType: z.string().trim().min(1, 'Indica el tipo de evento.'),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  specialRequests: z.string().trim().optional(),
  extraStaffRequested: z.boolean().default(false),
  items: z
    .array(
      z.object({
        inventoryItemId: z.string().uuid(),
        quantity: z.number().int().positive().default(1),
      })
    )
    .optional(),
});

export type CreateBookingRequestInput = z.infer<typeof createBookingRequestSchema>;

/**
 * Crea la solicitud y, si se pidieron equipos, sus renglones en
 * space_booking_request_items. Son dos escrituras secuenciales, no una
 * transacción: si la segunda falla, la solicitud queda creada sin
 * equipos asociados — aceptable en Fase 1A (no es una operación
 * financiera, es una solicitud que el responsable del espacio revisa
 * antes de confirmar). Si en el uso real esto genera solicitudes
 * incompletas con frecuencia, la corrección es una función RPC
 * transaccional, no un parche aquí.
 */
export async function createBookingRequest(
  input: CreateBookingRequestInput
): Promise<SpaceBookingRequest> {
  const parsed = createBookingRequestSchema.parse(input);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Debes iniciar sesión para enviar una solicitud de reserva.');
  }

  const { data, error } = await supabase
    .from('space_booking_requests')
    .insert({
      room_id: parsed.roomId,
      renter_profile_id: user.id,
      project_id: parsed.projectId ?? null,
      event_type: parsed.eventType,
      starts_at: parsed.startsAt,
      ends_at: parsed.endsAt,
      special_requests: parsed.specialRequests ?? '',
      extra_staff_requested: parsed.extraStaffRequested,
    })
    .select(BOOKING_REQUEST_COLUMNS)
    .single();

  if (error) throw error;

  const booking = mapBookingRow(data as SpaceBookingRequestRow);

  if (parsed.items && parsed.items.length > 0) {
    const { error: itemsError } = await supabase.from('space_booking_request_items').insert(
      parsed.items.map((item) => ({
        booking_request_id: booking.id,
        inventory_item_id: item.inventoryItemId,
        quantity: item.quantity,
      }))
    );

    if (itemsError) throw itemsError;
  }

  return booking;
}

/** Solicitudes propias del usuario con sesión iniciada. */
export async function listMyBookingRequests(): Promise<SpaceBookingRequest[]> {
  const { data, error } = await supabase
    .from('space_booking_requests')
    .select(BOOKING_REQUEST_COLUMNS)
    .order('starts_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => mapBookingRow(row as SpaceBookingRequestRow));
}

/** Solicitudes de un salón, para quien lo administra (RLS lo exige). */
export async function listBookingRequestsForRoom(roomId: string): Promise<SpaceBookingRequest[]> {
  const { data, error } = await supabase
    .from('space_booking_requests')
    .select(BOOKING_REQUEST_COLUMNS)
    .eq('room_id', roomId)
    .order('starts_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => mapBookingRow(row as SpaceBookingRequestRow));
}

export async function confirmBookingRequest(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from('space_booking_requests')
    .update({ status: 'confirmed' })
    .eq('id', bookingId);

  if (error) throw error;
}

export async function rejectBookingRequest(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from('space_booking_requests')
    .update({ status: 'rejected' })
    .eq('id', bookingId);

  if (error) throw error;
}

export async function cancelOwnBookingRequest(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from('space_booking_requests')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);

  if (error) throw error;
}

/** Marca el pago presencial como recibido. Nunca automático — lo hace una persona. */
export async function markBookingAsPaid(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from('space_booking_requests')
    .update({ payment_status: 'paid' })
    .eq('id', bookingId);

  if (error) throw error;
}

export interface RoomAvailabilityEntry {
  source: 'reserva' | 'bloqueo';
  startsAt: string;
  endsAt: string;
}

/** Disponibilidad pública, sin datos del solicitante (list_room_availability, sin PII). */
export async function listRoomAvailability(
  roomId: string,
  from: string,
  to: string
): Promise<RoomAvailabilityEntry[]> {
  const { data, error } = await supabase.rpc('list_room_availability', {
    target_room_id: roomId,
    requested_from: from,
    requested_to: to,
  });

  if (error) throw error;

  return (data ?? []).map((row: { source: string; starts_at: string; ends_at: string }) => ({
    source: row.source as 'reserva' | 'bloqueo',
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  }));
}

const createBlockedDateSchema = z.object({
  roomId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  reason: z.string().trim().optional(),
});

export async function createBlockedDate(
  input: z.infer<typeof createBlockedDateSchema>
): Promise<void> {
  const parsed = createBlockedDateSchema.parse(input);

  const { error } = await supabase.from('space_room_blocked_dates').insert({
    room_id: parsed.roomId,
    starts_at: parsed.startsAt,
    ends_at: parsed.endsAt,
    reason: parsed.reason ?? '',
  });

  if (error) throw error;
}
