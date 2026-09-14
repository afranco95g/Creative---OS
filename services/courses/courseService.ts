import { supabase } from '@/lib/supabase/client';
import { z } from 'zod';

export type CourseStatus = 'draft' | 'published' | 'archived';

export interface Course {
  id: string;
  ownerActorId: string;
  title: string;
  description: string | null;
  status: CourseStatus;
  price: number;
  paymentStructure: string | null;
  certificationEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CourseRow {
  id: string;
  owner_actor_id: string;
  title: string;
  description: string | null;
  status: CourseStatus;
  price: number;
  payment_structure: string | null;
  certification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

const COURSE_COLUMNS =
  'id, owner_actor_id, title, description, status, price, payment_structure, certification_enabled, created_at, updated_at';

function mapCourseRow(row: CourseRow): Course {
  return {
    id: row.id,
    ownerActorId: row.owner_actor_id,
    title: row.title,
    description: row.description,
    status: row.status,
    price: Number(row.price),
    paymentStructure: row.payment_structure,
    certificationEnabled: row.certification_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateCourseInput {
  ownerActorId: string;
  title: string;
  description?: string | null;
  price?: number;
  paymentStructure?: string | null;
  certificationEnabled?: boolean;
}

const createCourseSchema = z.object({
  ownerActorId: z.uuid(),
  title: z.string().min(1, 'El título del curso es obligatorio.'),
  description: z.string().nullable().optional(),
  price: z.number().nonnegative().optional(),
  paymentStructure: z.string().nullable().optional(),
  certificationEnabled: z.boolean().optional(),
});

export async function createCourse(input: CreateCourseInput): Promise<Course> {
  const parsed = createCourseSchema.parse(input);

  const { data, error } = await supabase
    .from('courses')
    .insert({
      owner_actor_id: parsed.ownerActorId,
      title: parsed.title,
      description: parsed.description ?? null,
      price: parsed.price ?? 0,
      payment_structure: parsed.paymentStructure ?? null,
      certification_enabled: parsed.certificationEnabled ?? false,
    })
    .select(COURSE_COLUMNS)
    .single();

  if (error) throw new Error(error.message || 'No fue posible crear el curso.');

  return mapCourseRow(data as unknown as CourseRow);
}

const listCoursesFilterSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  ownerActorId: z.uuid().optional(),
});

export async function listCourses(filter?: { status?: CourseStatus; ownerActorId?: string }): Promise<Course[]> {
  const parsed = listCoursesFilterSchema.parse(filter ?? {});

  let query = supabase.from('courses').select(COURSE_COLUMNS);

  if (parsed.status) query = query.eq('status', parsed.status);
  if (parsed.ownerActorId) query = query.eq('owner_actor_id', parsed.ownerActorId);

  const { data, error } = await query;

  if (error) throw new Error(error.message || 'No fue posible cargar los cursos.');

  return ((data ?? []) as unknown as CourseRow[]).map(mapCourseRow);
}

const getCourseByIdSchema = z.object({ id: z.uuid() });

export async function getCourseById(id: string): Promise<Course | null> {
  const parsed = getCourseByIdSchema.parse({ id });

  const { data, error } = await supabase
    .from('courses')
    .select(COURSE_COLUMNS)
    .eq('id', parsed.id)
    .maybeSingle();

  if (error) throw new Error(error.message || 'No fue posible cargar el curso.');

  return data ? mapCourseRow(data as unknown as CourseRow) : null;
}
