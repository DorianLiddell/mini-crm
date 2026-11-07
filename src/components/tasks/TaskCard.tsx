import { Link } from 'react-router-dom';
import { CalendarDays, UserRound } from 'lucide-react';

import type { Task } from '../../types/database.types';

import { TaskStatusBadge } from './taskstatusbadge/TaskStatusBadge';

interface TaskCardProps {
  task: Task;
  objectName?: string;
  assigneeLabel?: string;
}

export function TaskCard({
  task,
  objectName,
  assigneeLabel,
}: TaskCardProps) {
  const createdAt = new Date(task.created_at).toLocaleDateString(
    'ru-RU',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  );

  return (
    <article className="task-card">
      <div className="task-card__main">
        <Link
          className="task-card__title"
          to={`/tasks/${task.id}`}
        >
          {task.title}
        </Link>

        {task.description && (
          <p className="task-card__description">
            {task.description}
          </p>
        )}

        {objectName && (
          <p className="task-card__meta">
            Объект: {objectName}
          </p>
        )}
      </div>

      <div className="task-card__footer">
        <TaskStatusBadge status={task.status} />

        <span className="task-card__meta">
          <UserRound size={15} />
          {assigneeLabel ?? task.assignee_id.slice(0, 8)}
        </span>

        <span className="task-card__meta">
          <CalendarDays size={15} />
          {createdAt}
        </span>
      </div>
    </article>
  );
}