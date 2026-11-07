import { useCallback, useEffect, useState } from 'react';

import {
  deleteTask as deleteTaskRequest,
  getPerformers,
  getTaskById,
  getTaskHistory,
  transitionTask as transitionTaskRequest,
  updateTask as updateTaskRequest,
  type PerformerOption,
} from '../services/tasks/taskService';

import type {
  CreateTaskDto,
  Task,
  TaskStatus,
  TaskStatusHistory,
  UserRole,
} from '../types/database.types';

export function useTaskDetails(
  taskId: string,
  role: UserRole | null,
) {
  const [task, setTask] = useState<Task | null>(null);
  const [history, setHistory] = useState<TaskStatusHistory[]>([]);
  const [performers, setPerformers] = useState<PerformerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] =
    useState<TaskStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [taskData, historyData, performersData] =
      await Promise.all([
        getTaskById(taskId),
        getTaskHistory(taskId),
        role === 'manager'
          ? getPerformers()
          : Promise.resolve([]),
      ]);

    return {
      task: taskData,
      history: historyData,
      performers: performersData,
    };
  }, [taskId, role]);

  const applyData = (
    data: Awaited<ReturnType<typeof fetchData>>,
  ) => {
    setTask(data.task);
    setHistory(data.history);
    setPerformers(data.performers);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchData();
      applyData(data);
    } catch {
      setError('Не удалось загрузить задачу');
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const refresh = async () => {
    const data = await fetchData();
    applyData(data);
  };

  useEffect(() => {
    void load();
  }, [load]);

  const edit = async (dto: CreateTaskDto) => {
    setSaving(true);
    setError(null);

    try {
      await updateTaskRequest(taskId, dto);
      await refresh();
    } catch (err) {
      setError('Не удалось обновить задачу');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (
    status: TaskStatus,
    comment?: string,
  ) => {
    setActionLoading(status);
    setError(null);

    try {
      await transitionTaskRequest(taskId, status, comment);
      await refresh();
    } catch (err) {
      setError('Не удалось изменить статус задачи');
      throw err;
    } finally {
      setActionLoading(null);
    }
  };

  const remove = async () => {
    setSaving(true);
    setError(null);

    try {
      await deleteTaskRequest(taskId);
    } catch (err) {
      setError('Не удалось удалить задачу');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    task,
    history,
    performers,
    loading,
    saving,
    actionLoading,
    error,
    edit,
    changeStatus,
    remove,
    reload: load,
  };
}