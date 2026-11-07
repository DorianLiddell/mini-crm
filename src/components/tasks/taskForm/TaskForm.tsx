import { useState, type FormEvent } from 'react';

import type { CreateTaskDto } from '../../../types/database.types';
import type { PerformerOption } from '../../../services/tasks/taskService';

import './TaskForm.scss';

type TaskFormValues = Pick<
  CreateTaskDto,
  'title' | 'description' | 'assignee_id'
>;

interface TaskFormProps {
  objectId: string;
  performers: PerformerOption[];
  initialValues?: TaskFormValues;
  loading?: boolean;
  onSubmit: (dto: CreateTaskDto) => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({
  objectId,
  performers,
  initialValues,
  loading = false,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState(
    initialValues?.title ?? '',
  );
  const [description, setDescription] = useState(
    initialValues?.description ?? '',
  );
  const [assigneeId, setAssigneeId] = useState(
    initialValues?.assignee_id ?? '',
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError(null);

    const dto: CreateTaskDto = {
      title: title.trim(),
      description: description.trim(),
      object_id: objectId,
      assignee_id: assigneeId,
    };

    if (!dto.title || !dto.description || !dto.assignee_id) {
      setError('Заполните все поля');
      return;
    }

    try {
      await onSubmit(dto);
    } catch {
      setError('Не удалось сохранить задачу');
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="task-form__field">
        <label htmlFor="task-title">Название задачи</label>

        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Например, Подготовить стены"
          maxLength={150}
          required
          disabled={loading}
        />
      </div>

      <div className="task-form__field">
        <label htmlFor="task-description">Описание</label>

        <textarea
          id="task-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Опишите, что необходимо сделать"
          rows={4}
          maxLength={3000}
          required
          disabled={loading}
        />
      </div>

      <div className="task-form__field">
        <label htmlFor="task-assignee">Исполнитель</label>

        <select
          id="task-assignee"
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
          required
          disabled={loading}
        >
          <option value="">Выберите исполнителя</option>

          {performers.map((performer) => (
            <option key={performer.id} value={performer.id}>
              {performer.email}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="task-form__error" role="alert">
          {error}
        </p>
      )}

      {performers.length === 0 && (
        <p className="task-form__hint">
          Нет доступных исполнителей. Проверьте пользователей и
          права чтения профилей в Supabase.
        </p>
      )}

      <div className="task-form__actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
        >
          Отмена
        </button>

        <button
          type="submit"
          disabled={loading || performers.length === 0}
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
}