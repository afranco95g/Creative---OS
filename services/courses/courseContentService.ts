import { supabase } from '@/lib/supabase/client';
import { z } from 'zod';

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  position: number;
  createdAt: string;
}

interface CourseModuleRow {
  id: string;
  course_id: string;
  title: string;
  position: number;
  created_at: string;
}

const COURSE_MODULE_COLUMNS = 'id, course_id, title, position, created_at';

function mapCourseModuleRow(row: CourseModuleRow): CourseModule {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    position: row.position,
    createdAt: row.created_at,
  };
}

export interface AddModuleInput {
  courseId: string;
  title: string;
}

const addModuleSchema = z.object({
  courseId: z.uuid(),
  title: z.string().min(1, 'El título del módulo es obligatorio.'),
});

export async function addModule(input: AddModuleInput): Promise<CourseModule> {
  const parsed = addModuleSchema.parse(input);

  const { data: lastModule, error: lastModuleError } = await supabase
    .from('course_modules')
    .select('position')
    .eq('course_id', parsed.courseId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastModuleError) throw new Error(lastModuleError.message || 'No fue posible calcular el orden del módulo.');

  const nextPosition = lastModule ? (lastModule as unknown as { position: number }).position + 1 : 0;

  const { data, error } = await supabase
    .from('course_modules')
    .insert({
      course_id: parsed.courseId,
      title: parsed.title,
      position: nextPosition,
    })
    .select(COURSE_MODULE_COLUMNS)
    .single();

  if (error) throw new Error(error.message || 'No fue posible agregar el módulo.');

  return mapCourseModuleRow(data as unknown as CourseModuleRow);
}

export type CourseLessonContentType = 'video' | 'quiz' | 'document' | 'step_by_step';

export interface CourseLesson {
  id: string;
  moduleId: string;
  title: string;
  contentType: CourseLessonContentType;
  contentBody: string;
  videoPath: string | null;
  position: number;
  createdAt: string;
}

interface CourseLessonRow {
  id: string;
  module_id: string;
  title: string;
  content_type: CourseLessonContentType;
  content_body: string;
  video_path: string | null;
  position: number;
  created_at: string;
}

const COURSE_LESSON_COLUMNS = 'id, module_id, title, content_type, content_body, video_path, position, created_at';

function mapCourseLessonRow(row: CourseLessonRow): CourseLesson {
  return {
    id: row.id,
    moduleId: row.module_id,
    title: row.title,
    contentType: row.content_type,
    contentBody: row.content_body,
    videoPath: row.video_path,
    position: row.position,
    createdAt: row.created_at,
  };
}

export interface AddLessonInput {
  moduleId: string;
  title: string;
  contentType: CourseLessonContentType;
  contentBody: string;
  videoPath?: string | null;
}

const addLessonSchema = z.object({
  moduleId: z.uuid(),
  title: z.string().min(1, 'El título de la lección es obligatorio.'),
  contentType: z.enum(['video', 'quiz', 'document', 'step_by_step']),
  contentBody: z.string(),
  videoPath: z.string().nullable().optional(),
});

export async function addLesson(input: AddLessonInput): Promise<CourseLesson> {
  const parsed = addLessonSchema.parse(input);

  const { data: lastLesson, error: lastLessonError } = await supabase
    .from('course_lessons')
    .select('position')
    .eq('module_id', parsed.moduleId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastLessonError) throw new Error(lastLessonError.message || 'No fue posible calcular el orden de la lección.');

  const nextPosition = lastLesson ? (lastLesson as unknown as { position: number }).position + 1 : 0;

  const { data, error } = await supabase
    .from('course_lessons')
    .insert({
      module_id: parsed.moduleId,
      title: parsed.title,
      content_type: parsed.contentType,
      content_body: parsed.contentBody,
      video_path: parsed.videoPath ?? null,
      position: nextPosition,
    })
    .select(COURSE_LESSON_COLUMNS)
    .single();

  if (error) throw new Error(error.message || 'No fue posible agregar la lección.');

  return mapCourseLessonRow(data as unknown as CourseLessonRow);
}
