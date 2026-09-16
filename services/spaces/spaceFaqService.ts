import { supabase } from '../../lib/supabase/client';
import { z } from 'zod';

export interface SpaceFaq {
  id: string;
  spaceId: string;
  roomId: string | null;
  question: string;
  answer: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface SpaceFaqRow {
  id: string;
  space_id: string;
  room_id: string | null;
  question: string;
  answer: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const SPACE_FAQ_COLUMNS =
  'id, space_id, room_id, question, answer, display_order, created_at, updated_at';

function mapFaqRow(row: SpaceFaqRow): SpaceFaq {
  return {
    id: row.id,
    spaceId: row.space_id,
    roomId: row.room_id,
    question: row.question,
    answer: row.answer,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** FAQ de un espacio (públicas si el espacio está publicado, por RLS). */
export async function listFaqsForSpace(spaceId: string): Promise<SpaceFaq[]> {
  const { data, error } = await supabase
    .from('space_faqs')
    .select(SPACE_FAQ_COLUMNS)
    .eq('space_id', spaceId)
    .order('display_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => mapFaqRow(row as SpaceFaqRow));
}

const createFaqSchema = z.object({
  spaceId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  question: z.string().trim().min(1, 'La pregunta no puede estar vacía.'),
  answer: z.string().trim().min(1, 'La respuesta no puede estar vacía.'),
  displayOrder: z.number().int().min(0).default(0),
});

export type CreateSpaceFaqInput = z.infer<typeof createFaqSchema>;

export async function createFaq(input: CreateSpaceFaqInput): Promise<SpaceFaq> {
  const parsed = createFaqSchema.parse(input);

  const { data, error } = await supabase
    .from('space_faqs')
    .insert({
      space_id: parsed.spaceId,
      room_id: parsed.roomId ?? null,
      question: parsed.question,
      answer: parsed.answer,
      display_order: parsed.displayOrder,
    })
    .select(SPACE_FAQ_COLUMNS)
    .single();

  if (error) throw error;

  return mapFaqRow(data as SpaceFaqRow);
}

const updateFaqSchema = z.object({
  question: z.string().trim().min(1).optional(),
  answer: z.string().trim().min(1).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export async function updateFaq(
  faqId: string,
  input: z.infer<typeof updateFaqSchema>
): Promise<SpaceFaq> {
  const parsed = updateFaqSchema.parse(input);

  const patch: Record<string, unknown> = {};
  if (parsed.question !== undefined) patch.question = parsed.question;
  if (parsed.answer !== undefined) patch.answer = parsed.answer;
  if (parsed.displayOrder !== undefined) patch.display_order = parsed.displayOrder;

  const { data, error } = await supabase
    .from('space_faqs')
    .update(patch)
    .eq('id', faqId)
    .select(SPACE_FAQ_COLUMNS)
    .single();

  if (error) throw error;

  return mapFaqRow(data as SpaceFaqRow);
}

export async function deleteFaq(faqId: string): Promise<void> {
  const { error } = await supabase.from('space_faqs').delete().eq('id', faqId);

  if (error) throw error;
}
