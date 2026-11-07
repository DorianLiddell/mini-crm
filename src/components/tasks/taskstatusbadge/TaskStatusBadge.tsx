import type { TaskStatus } from '../../../types/database.types';

import { TASK_STATUS_LABELS } from '../../../utils/taskStatus';

import './Tasks.scss';

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export function TaskStatusBadge({
  status,
}: TaskStatusBadgeProps) {
  return (
    <span className={`task-status task-status--${status}`}>
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}