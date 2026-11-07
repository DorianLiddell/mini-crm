import type { TaskStatusHistory } from '../../types/database.types';

import {
  formatUserId,
  TASK_STATUS_LABELS,
} from '../../utils/taskStatus';

interface TaskHistoryProps {
  history: TaskStatusHistory[];
  currentUserId: string;
}

export function TaskHistory({
  history,
  currentUserId,
}: TaskHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="task-history__empty">
        История изменений пока пуста.
      </div>
    );
  }

  return (
    <div className="task-history">
      {history.map((item) => {
        const changedBy =
          item.changed_by === currentUserId
            ? 'Вы'
            : formatUserId(item.changed_by);

        const date = new Date(item.created_at).toLocaleString(
          'ru-RU',
          {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          },
        );

        return (
          <article className="task-history__item" key={item.id}>
            <div className="task-history__header">
              <strong>{changedBy}</strong>
              <time dateTime={item.created_at}>{date}</time>
            </div>

            <p>
              {item.from_status
                ? TASK_STATUS_LABELS[item.from_status]
                : 'Создание'}
              {' → '}
              <strong>{TASK_STATUS_LABELS[item.to_status]}</strong>
            </p>

            {item.comment && (
              <p className="task-history__comment">
                Комментарий: {item.comment}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}