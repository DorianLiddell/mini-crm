import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';
import { useObjectDetails } from '../../hooks/useObjectDetails';

import { Loader } from '../../components/ui/Loader';
import { TaskCard } from '../../components/tasks/TaskCard';
import { TaskForm } from '../../components/tasks/taskForm/TaskForm';

import type { CreateTaskDto } from '../../types/database.types';

import './ObjectDetailsPage.scss';

export function ObjectDetailsPage() {
  const { objectId = '' } = useParams();
  const { user, profile } = useAuth();

  const {
    object,
    tasks,
    performers,
    loading,
    saving,
    error,
    addTask,
  } = useObjectDetails(objectId, profile?.role ?? null);

  const [formOpen, setFormOpen] = useState(false);

  const canManage = profile?.role === 'manager';

  const handleCreateTask = async (dto: CreateTaskDto) => {
    await addTask(dto);
    setFormOpen(false);
  };

  if (loading) {
    return <Loader text="Загрузка объекта..." />;
  }

  if (!object) {
    return (
      <section className="object-details">
        <p className="object-details__error">
          {error ?? 'Объект не найден или у вас нет доступа.'}
        </p>

        <Link to="/objects">Вернуться к объектам</Link>
      </section>
    );
  }

  return (
    <section className="object-details">
      <Link className="object-details__back" to="/objects">
        <ArrowLeft size={17} />
        Все объекты
      </Link>

      <header className="object-details__header">
        <div>
          <h1>{object.name}</h1>
          <p>{object.address}</p>
        </div>

        {canManage && (
          <button
            className="object-details__add-button"
            type="button"
            onClick={() => setFormOpen((value) => !value)}
          >
            <Plus size={18} />
            Новая задача
          </button>
        )}
      </header>

      {error && (
        <p className="object-details__error" role="alert">
          {error}
        </p>
      )}

      {canManage && formOpen && (
        <div className="object-details__form">
          <h2>Создание задачи</h2>

          <TaskForm
            objectId={object.id}
            performers={performers}
            loading={saving}
            onSubmit={handleCreateTask}
            onCancel={() => setFormOpen(false)}
          />
        </div>
      )}

      <div className="object-details__tasks-header">
        <h2>Задачи объекта</h2>
        <span>{tasks.length}</span>
      </div>

      {tasks.length === 0 ? (
        <div className="object-details__empty">
          <h3>Задач пока нет</h3>
          <p>
            {canManage
              ? 'Создайте первую задачу для этого объекта.'
              : 'Для этого объекта пока нет назначенных вам задач.'}
          </p>
        </div>
      ) : (
        <div className="object-details__tasks">
          {tasks.map((task) => {
            const performer = performers.find(
              (item) => item.id === task.assignee_id,
            );

            return (
              <TaskCard
                key={task.id}
                task={task}
                assigneeLabel={
                  task.assignee_id === user?.id
                    ? 'Вы'
                    : performer?.email
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
}