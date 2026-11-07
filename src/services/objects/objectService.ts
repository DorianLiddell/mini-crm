import { supabase } from '../supabase/client';

import type {
  ConstructionObject,
  CreateObjectDto,
} from '../../types/database.types';

export async function getObjects(): Promise<ConstructionObject[]> {
  const { data, error } = await supabase
    .from('objects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data as ConstructionObject[];
}

export async function getObjectById(
  id: string,
): Promise<ConstructionObject> {
  const { data, error } = await supabase
    .from('objects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  return data as ConstructionObject;
}

export async function createObject(
  dto: CreateObjectDto,
): Promise<ConstructionObject> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    throw new Error('Пользователь не авторизован');
  }

  const { data, error } = await supabase
    .from('objects')
    .insert({
      ...dto,
      created_by: user.id,
    })
    .select('*')
    .single();

  if (error) throw error;

  return data as ConstructionObject;
}

export async function updateObject(
  id: string,
  dto: CreateObjectDto,
): Promise<ConstructionObject> {
  const { data, error } = await supabase
    .from('objects')
    .update(dto)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;

  return data as ConstructionObject;
}

export async function deleteObject(id: string): Promise<void> {
  const { error } = await supabase
    .from('objects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}