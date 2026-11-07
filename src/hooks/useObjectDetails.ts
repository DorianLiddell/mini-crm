import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createTask as createTaskRequest,
  deleteTask as deleteTaskRequest,
  getPerformers,
  getTasksByObjectId,
  updateTask as updateTaskRequest,
  type PerformerOption,
} from '../services/tasks/taskService';

import { getObjectById } from '../services/objects/objectService';

import type {
  ConstructionObject,
  CreateTaskDto,
  Task,
  UserRole,
} from '../types/database.types';

interface ObjectDetailsState {
  key: string;
  object: ConstructionObject | null;
  tasks: Task[];
  performers: PerformerOption[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export function useObjectDetails(
  objectId: string,
  role: UserRole | null,
) {
  const requestId = useRef(0);

  const requestKey = `${objectId}:${role ?? 'unknown'}`;

  const [state, setState] = useState<ObjectDetailsState>({
    key: '',
    object: null,
    tasks: [],
    performers: [],
    loading: true,
    saving: false,
    error: null,
  });

  const loadData = useCallback(async () => {
    if (!objectId) {
      throw new Error('Не указан идентификатор объекта');
    }

    const performersRequest: Promise<PerformerOption[]> =
      role === 'manager'
        ? getPerformers()
        : Promise.resolve([]);

    const [objectData, tasksData, performersData] =
      await Promise.all([
        getObjectById(objectId),
        getTasksByObjectId(objectId),
        performersRequest,
      ]);

    return {
      object: objectData,
      tasks: tasksData,
      performers: performersData,
    };
  }, [objectId, role]);

  useEffect(() => {
    let active = true;
    const currentRequestId = ++requestId.current;

    const load = async () => {
      try {
        const data = await loadData();

        if (!active || requestId.current !== currentRequestId) {
          return;
        }

        setState({
          key: requestKey,
          ...data,
          loading: false,
          saving: false,
          error: null,
        });
      } catch {
        if (!active || requestId.current !== currentRequestId) {
          return;
        }

        setState({
          key: requestKey,
          object: null,
          tasks: [],
          performers: [],
          loading: false,
          saving: false,
          error: 'Не удалось загрузить объект и его задачи',
        });
      }
    };

    void load();

    return () => {
      active = false;

      if (requestId.current === currentRequestId) {
        requestId.current += 1;
      }
    };
  }, [loadData, requestKey]);

  const reload = useCallback(async () => {
    const currentRequestId = ++requestId.current;

    setState((previous) => ({
      key: requestKey,
      object: previous.key === requestKey ? previous.object : null,
      tasks: previous.key === requestKey ? previous.tasks : [],
      performers:
        previous.key === requestKey ? previous.performers : [],
      loading: true,
      saving: false,
      error: null,
    }));

    try {
      const data = await loadData();

      if (requestId.current !== currentRequestId) {
        return;
      }

      setState({
        key: requestKey,
        ...data,
        loading: false,
        saving: false,
        error: null,
      });
    } catch {
      if (requestId.current !== currentRequestId) {
        return;
      }

      setState((previous) => ({
        key: requestKey,
        object: previous.key === requestKey ? previous.object : null,
        tasks: previous.key === requestKey ? previous.tasks : [],
        performers:
          previous.key === requestKey ? previous.performers : [],
        loading: false,
        saving: false,
        error: 'Не удалось загрузить объект и его задачи',
      }));
    }
  }, [loadData, requestKey]);

  const addTask = async (dto: CreateTaskDto) => {
    setState((previous) => ({
      ...previous,
      saving: true,
      error: null,
    }));

    try {
      const task = await createTaskRequest({
        ...dto,
        object_id: objectId,
      });

      setState((previous) => {
        if (previous.key !== requestKey) return previous;

        return {
          ...previous,
          tasks: [task, ...previous.tasks],
        };
      });

      return task;
    } catch (err) {
      setState((previous) => ({
        ...previous,
        error: 'Не удалось создать задачу',
      }));

      throw err;
    } finally {
      setState((previous) => ({
        ...previous,
        saving: false,
      }));
    }
  };

  const editTask = async (
    taskId: string,
    dto: CreateTaskDto,
  ) => {
    setState((previous) => ({
      ...previous,
      saving: true,
      error: null,
    }));

    try {
      const updatedTask = await updateTaskRequest(taskId, {
        ...dto,
        object_id: objectId,
      });

      setState((previous) => {
        if (previous.key !== requestKey) return previous;

        return {
          ...previous,
          tasks: previous.tasks.map((task) =>
            task.id === taskId ? updatedTask : task,
          ),
        };
      });

      return updatedTask;
    } catch (err) {
      setState((previous) => ({
        ...previous,
        error: 'Не удалось обновить задачу',
      }));

      throw err;
    } finally {
      setState((previous) => ({
        ...previous,
        saving: false,
      }));
    }
  };

  const removeTask = async (taskId: string) => {
    setState((previous) => ({
      ...previous,
      saving: true,
      error: null,
    }));

    try {
      await deleteTaskRequest(taskId);

      setState((previous) => {
        if (previous.key !== requestKey) return previous;

        return {
          ...previous,
          tasks: previous.tasks.filter(
            (task) => task.id !== taskId,
          ),
        };
      });
    } catch (err) {
      setState((previous) => ({
        ...previous,
        error: 'Не удалось удалить задачу',
      }));

      throw err;
    } finally {
      setState((previous) => ({
        ...previous,
        saving: false,
      }));
    }
  };

  const isCurrentObject = state.key === requestKey;

  return {
    object: isCurrentObject ? state.object : null,
    tasks: isCurrentObject ? state.tasks : [],
    performers: isCurrentObject ? state.performers : [],
    loading: !isCurrentObject || state.loading,
    saving: isCurrentObject && state.saving,
    error: isCurrentObject ? state.error : null,
    reload,
    addTask,
    editTask,
    removeTask,
  };
}