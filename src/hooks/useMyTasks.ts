import { useCallback, useEffect, useRef, useState } from 'react';

import { getMyTasks } from '../services/tasks/taskService';
import { getObjects } from '../services/objects/objectService';

import type { Task } from '../types/database.types';

export interface MyTask extends Task {
  objectName: string;
}

interface MyTasksState {
  userId: string;
  tasks: MyTask[];
  loading: boolean;
  error: string | null;
}

export function useMyTasks(userId: string) {
  const [state, setState] = useState<MyTasksState>(() => ({
    userId,
    tasks: [],
    loading: Boolean(userId),
    error: null,
  }));

  const requestId = useRef(0);

  const fetchTasks = useCallback(async (): Promise<MyTask[]> => {
    const [taskRows, objects] = await Promise.all([
      getMyTasks(userId),
      getObjects(),
    ]);

    const objectNames = new Map(
      objects.map((object) => [object.id, object.name]),
    );

    return taskRows.map((task) => ({
      ...task,
      objectName:
        objectNames.get(task.object_id) ?? 'Объект недоступен',
    }));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const currentRequestId = ++requestId.current;

    const load = async () => {
      try {
        const tasks = await fetchTasks();

        if (requestId.current !== currentRequestId) return;

        setState({
          userId,
          tasks,
          loading: false,
          error: null,
        });
      } catch {
        if (requestId.current !== currentRequestId) return;

        setState({
          userId,
          tasks: [],
          loading: false,
          error: 'Не удалось загрузить ваши задачи',
        });
      }
    };

    void load();

    return () => {
      if (requestId.current === currentRequestId) {
        requestId.current += 1;
      }
    };
  }, [userId, fetchTasks]);

  const reload = useCallback(async () => {
    if (!userId) return;

    const currentRequestId = ++requestId.current;

    setState((previous) => ({
      userId,
      tasks: previous.userId === userId ? previous.tasks : [],
      loading: true,
      error: null,
    }));

    try {
      const tasks = await fetchTasks();

      if (requestId.current !== currentRequestId) return;

      setState({
        userId,
        tasks,
        loading: false,
        error: null,
      });
    } catch {
      if (requestId.current !== currentRequestId) return;

      setState((previous) => ({
        userId,
        tasks: previous.userId === userId ? previous.tasks : [],
        loading: false,
        error: 'Не удалось загрузить ваши задачи',
      }));
    }
  }, [userId, fetchTasks]);

  const isCurrentUser = state.userId === userId;

  return {
    tasks: isCurrentUser ? state.tasks : [],
    loading: userId ? !isCurrentUser || state.loading : false,
    error: isCurrentUser ? state.error : null,
    reload,
  };
}