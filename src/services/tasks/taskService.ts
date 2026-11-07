import { supabase } from '../supabase/client';

import type {
  CreateTaskDto,
  Profile,
  Task,
  TaskStatus,
  TaskStatusHistory,
} from '../../types/database.types';

export type PerformerOption = Pick<Profile, 'id' | 'email'>;

export async function getTasksByObjectId(
  objectId: string,
): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('object_id', objectId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data as Task[];
}

export async function getMyTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('assignee_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data as Task[];
}

export async function getTaskById(taskId: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) throw error;

  return data as Task;
}

export async function getTaskHistory(
  taskId: string,
): Promise<TaskStatusHistory[]> {
  const { data, error } = await supabase
    .from('task_status_history')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data as TaskStatusHistory[];
}

export async function getPerformers(): Promise<PerformerOption[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('role', 'performer')
    .order('email', { ascending: true });

  if (error) throw error;

  return data as PerformerOption[];
}

export async function createTask(
  dto: CreateTaskDto,
): Promise<Task> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    throw new Error('Пользователь не авторизован');
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...dto,
      author_id: user.id,
      status: 'new',
    })
    .select('*')
    .single();

  if (error) throw error;

  return data as Task;
}

export async function updateTask(
  taskId: string,
  dto: CreateTaskDto,
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      title: dto.title,
      description: dto.description,
      object_id: dto.object_id,
      assignee_id: dto.assignee_id,
    })
    .eq('id', taskId)
    .select('*')
    .single();

  if (error) throw error;

  return data as Task;
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

export async function transitionTask(
  taskId: string,
  status: TaskStatus,
  comment?: string,
): Promise<void> {
  const { error } = await supabase.rpc('transition_task', {
    p_task_id: taskId,
    p_new_status: status,
    p_comment: comment?.trim() || null,
  });

  if (error) throw error;
}