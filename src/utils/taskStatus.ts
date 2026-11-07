import type {
  TaskStatus,
  UserRole,
} from '../types/database.types';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  review: 'На проверке',
  accepted: 'Принята',
  rework: 'На доработке',
};

export interface TaskAction {
  status: TaskStatus;
  label: string;
  requiresComment: boolean;
}

export function getTaskActions(
  status: TaskStatus,
  role: UserRole,
  isAssignee: boolean,
): TaskAction[] {
  if (role === 'manager') {
    if (status !== 'review') return [];

    return [
      {
        status: 'accepted',
        label: 'Принять задачу',
        requiresComment: false,
      },
      {
        status: 'rework',
        label: 'Вернуть на доработку',
        requiresComment: true,
      },
    ];
  }

  if (role === 'performer' && isAssignee) {
    if (status === 'new' || status === 'rework') {
      return [
        {
          status: 'in_progress',
          label: 'Взять в работу',
          requiresComment: false,
        },
      ];
    }

    if (status === 'in_progress') {
      return [
        {
          status: 'review',
          label: 'Отправить на проверку',
          requiresComment: false,
        },
      ];
    }
  }

  return [];
}

export function formatUserId(userId: string): string {
  return userId.slice(0, 8);
}