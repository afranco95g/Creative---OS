import { supabase } from '@/lib/supabase/client';
import { z } from 'zod';

export interface UserProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  quizScore: number | null;
  completedAt: string | null;
  createdAt: string;
}

interface UserProgressRow {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  quiz_score: number | null;
  completed_at: string | null;
  created_at: string;
}

const USER_PROGRESS_COLUMNS = 'id, user_id, lesson_id, completed, quiz_score, completed_at, created_at';

function mapUserProgressRow(row: UserProgressRow): UserProgress {
  return {
    id: row.id,
    userId: row.user_id,
    lessonId: row.lesson_id,
    completed: row.completed,
    quizScore: row.quiz_score,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

export interface UpdateProgressInput {
  lessonId: string;
  completed?: boolean;
  quizScore?: number;
}

const updateProgressSchema = z.object({
  lessonId: z.uuid(),
  completed: z.boolean().optional(),
  quizScore: z.number().nonnegative().optional(),
});

export async function updateProgress(
  input: UpdateProgressInput
): Promise<{ progress: UserProgress; passed: boolean | null }> {
  const parsed = updateProgressSchema.parse(input);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Debes iniciar sesión para actualizar tu progreso.');

  const payload: Record<string, unknown> = {
    user_id: user.id,
    lesson_id: parsed.lessonId,
  };

  if (parsed.completed !== undefined) {
    payload.completed = parsed.completed;
    payload.completed_at = parsed.completed ? new Date().toISOString() : null;
  }

  if (parsed.quizScore !== undefined) {
    payload.quiz_score = parsed.quizScore;
  }

  const { data, error } = await supabase
    .from('user_progress')
    .upsert(payload, { onConflict: 'user_id,lesson_id' })
    .select(USER_PROGRESS_COLUMNS)
    .single();

  if (error) throw new Error(error.message || 'No fue posible actualizar el progreso.');

  const progress = mapUserProgressRow(data as unknown as UserProgressRow);

  let passed: boolean | null = null;

  if (parsed.quizScore !== undefined) {
    const { data: quiz, error: quizError } = await supabase
      .from('lesson_quizzes')
      .select('passing_score')
      .eq('lesson_id', parsed.lessonId)
      .maybeSingle();

    if (quizError) throw new Error(quizError.message || 'No fue posible verificar el quiz de la lección.');

    passed = quiz ? parsed.quizScore >= (quiz as unknown as { passing_score: number }).passing_score : null;
  }

  return { progress, passed };
}
