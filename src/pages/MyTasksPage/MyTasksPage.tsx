import { useAuth } from '../../hooks/useAuth';
import { useMyTasks } from '../../hooks/useMyTasks';

import { Loader } from '../../components/ui/Loader';
import { TaskCard } from '../../components/tasks/TaskCard';

import './MyTasksPage.scss';

export function MyTasksPage() {
  const { user } = useAuth();

  const {
    tasks,
    loading,
    error,
    reload,
  } = useMyTasks(user?.id ?? '');

  if (loading) {
    return <Loader text="Загрузка задач..." />;
  }

  return (
    <section className="my-tasks-page">
      <header className="my-tasks-page__header">
        <div>
          <h1>Мои задачи</h1>
          <p>Задачи, назначенные вам</p>
        </div>

        <button type="button" onClick={() => void reload()}>
          Обновить
        </button>
      </header>

      {error && (
        <p className="my-tasks-page__error" role="alert">
          {error}
        </p>
      )}

      {tasks.length === 0 ? (
        <div className="my-tasks-page__empty">
          <h2>У вас пока нет задач</h2>
          <p>Когда постановщик назначит вам задачу, она появится здесь.</p>
        </div>
      ) : (
        <div className="my-tasks-page__list">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              objectName={task.objectName}
              assigneeLabel="Вы"
            />
          ))}
        </div>
      )}
    </section>
  );
}
