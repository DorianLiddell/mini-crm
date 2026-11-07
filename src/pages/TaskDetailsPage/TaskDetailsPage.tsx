import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';
import { useTaskDetails } from '../../hooks/useTaskDetails';

import { Loader } from '../../components/ui/Loader';
import { TaskForm } from '../../components/tasks/taskForm/TaskForm';
import { TaskHistory } from '../../components/tasks/TaskHistory';
import { TaskStatusBadge } from '../../components/tasks/taskstatusbadge/TaskStatusBadge';

import { formatUserId, getTaskActions } from '../../utils/taskStatus';

import type { CreateTaskDto } from '../../types/database.types';

import './TaskDetailsPage.scss';

export function TaskDetailsPage() {
  const { taskId = '' } = useParams();
  const navigate = useNavigate();

  const { user, profile } = useAuth();

  const {
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
  } = useTaskDetails(taskId, profile?.role ?? null);

  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const canManage = profile?.role === 'manager';

  const actions =
    task && profile
      ? getTaskActions(
          task.status,
          profile.role,
          task.assignee_id === user?.id,
        )
      : [];

  const performer = task
    ? performers.find((item) => item.id === task.assignee_id)
    : undefined;

  const getUserLabel = (userId: string) => {
    if (userId === user?.id) return 'Вы';

    if (userId === task?.assignee_id && performer) {
      return performer.email;
    }

    return formatUserId(userId);
  };

  const handleEdit = async (dto: CreateTaskDto) => {
    await edit(dto);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!task) return;

    const confirmed = window.confirm(
      `Удалить задачу «${task.title}»?`,
    );

    if (!confirmed) return;

    try {
      await remove();
      navigate(`/objects/${task.object_id}`, { replace: true });
    } catch {
      // Ошибка отображается через состояние хука.
    }
  };

  const handleTransition = async (
    status: (typeof actions)[number]['status'],
    requiresComment: boolean,
  ) => {
    setActionError(null);

    const trimmedComment = comment.trim();

    if (requiresComment && !trimmedComment) {
      setActionError('Укажите причину возврата на доработку');
      return;
    }

    try {
      await changeStatus(
        status,
        requiresComment ? trimmedComment : undefined,
      );

      setComment('');
    } catch {
      setActionError('Не удалось изменить статус задачи');
    }
  };

  if (loading) {
    return <Loader text="Загрузка задачи..." />;
  }

  if (!task) {
    return (
      <section className="task-details">
        <p className="task-details__error">
          {error ?? 'Задача не найдена или у вас нет доступа.'}
        </p>
        <button type="button" onClick={() => navigate(-1)}>
          Назад
        </button>
      </section>
    );
  }

  return (
    <section className="task-details">
      <Link
        className="task-details__back"
        to={`/objects/${task.object_id}`}
      >
        <ArrowLeft size={17} />
        К объекту
      </Link>

      <header className="task-details__header">
        <div>
          <div className="task-details__title-row">
            <h1>{task.title}</h1>
            <TaskStatusBadge status={task.status} />
          </div>

          <p className="task-details__date">
            Создана{' '}
            {new Date(task.created_at).toLocaleDateString('ru-RU')}
          </p>
        </div>

        {canManage && (
          <div className="task-details__management">
            <button
              type="button"
              onClick={() => setEditing((value) => !value)}
              disabled={saving}
            >
              <Pencil size={16} />
              {editing ? 'Отменить' : 'Редактировать'}
            </button>

            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={saving}
            >
              <Trash2 size={16} />
              Удалить
            </button>
          </div>
        )}
      </header>

      {(error || actionError) && (
        <p className="task-details__error" role="alert">
          {actionError ?? error}
        </p>
      )}

      {editing && canManage ? (
        <div className="task-details__form">
          <h2>Редактирование задачи</h2>

          <TaskForm
            key={task.id}
            objectId={task.object_id}
            performers={performers}
            initialValues={{
              title: task.title,
              description: task.description,
              assignee_id: task.assignee_id,
            }}
            loading={saving}
            onSubmit={handleEdit}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <div className="task-details__info">
          <div className="task-details__field">
            <span>Описание</span>
            <p>{task.description || 'Описание не указано'}</p>
          </div>

          <div className="task-details__field">
            <span>Исполнитель</span>
            <p>{getUserLabel(task.assignee_id)}</p>
          </div>

          <div className="task-details__field">
            <span>Автор</span>
            <p>{getUserLabel(task.author_id)}</p>
          </div>

          <div className="task-details__field">
            <span>Объект</span>
            <Link to={`/objects/${task.object_id}`}>
              Открыть объект
            </Link>
          </div>
        </div>
      )}

      {actions.length > 0 && (
        <section className="task-details__actions">
          <h2>Доступные действия</h2>

          {actions.map((action) => (
            <div
              className="task-details__action"
              key={action.status}
            >
              {action.requiresComment && (
                <div className="task-details__comment-field">
                  <label htmlFor="rework-comment">
                    Причина возврата на доработку
                  </label>

                  <textarea
                    id="rework-comment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Укажите, что необходимо исправить"
                    rows={3}
                    disabled={actionLoading !== null}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  void handleTransition(
                    action.status,
                    action.requiresComment,
                  )
                }
                disabled={
                  actionLoading !== null ||
                  (action.requiresComment && !comment.trim())
                }
              >
                {actionLoading === action.status
                  ? 'Обновление...'
                  : action.label}
              </button>
            </div>
          ))}
        </section>
      )}

      <section className="task-details__history">
        <h2>История изменений</h2>

        <TaskHistory
          history={history}
          currentUserId={user?.id ?? ''}
        />
      </section>
    </section>
  );
}