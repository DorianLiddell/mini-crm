
import { useCallback, useEffect, useState } from 'react';

import {
  createObject,
  deleteObject,
  getObjects,
  updateObject,
} from '../services/objects/objectService';

import type {
  ConstructionObject,
  CreateObjectDto,
} from '../types/database.types';

export function useObjects() {
  const [objects, setObjects] = useState<ConstructionObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadObjects = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    setError(null);

    try {
      const data = await getObjects();
      setObjects(data);
    } catch {
      setError('Не удалось загрузить объекты');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchObjects = async () => {
      try {
        const data = await getObjects();

        if (!cancelled) {
          setObjects(data);
        }
      } catch {
        if (!cancelled) {
          setError('Не удалось загрузить объекты');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchObjects();

    return () => {
      cancelled = true;
    };
  }, []);

  const addObject = async (dto: CreateObjectDto) => {
    setSaving(true);
    setError(null);

    try {
      const newObject = await createObject(dto);

      setObjects((current) => [newObject, ...current]);

      return newObject;
    } catch (err) {
      setError('Не удалось создать объект');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const editObject = async (id: string, dto: CreateObjectDto) => {
    setSaving(true);
    setError(null);

    try {
      const updatedObject = await updateObject(id, dto);

      setObjects((current) =>
        current.map((object) =>
          object.id === id ? updatedObject : object,
        ),
      );

      return updatedObject;
    } catch (err) {
      setError('Не удалось обновить объект');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const removeObject = async (id: string) => {
    setDeletingId(id);
    setError(null);

    try {
      await deleteObject(id);

      setObjects((current) =>
        current.filter((object) => object.id !== id),
      );
    } catch (err) {
      setError('Не удалось удалить объект');
      throw err;
    } finally {
      setDeletingId(null);
    }
  };

  return {
    objects,
    loading,
    saving,
    deletingId,
    error,
    loadObjects,
    addObject,
    editObject,
    removeObject,
  };
}
