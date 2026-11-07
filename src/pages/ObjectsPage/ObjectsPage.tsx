import { useState } from 'react';
import { Plus } from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';
import { useObjects } from '../../hooks/useObjects';

import { ObjectCard } from '../../components/objects/ObjectCard';
import { ObjectForm } from '../../components/objects/ObjectForm';
import { Loader } from '../../components/ui/Loader';

import type {
  ConstructionObject,
  CreateObjectDto,
} from '../../types/database.types';

import './ObjectsPage.scss';

export function ObjectsPage() {
  const { profile } = useAuth();

  const {
    objects,
    loading,
    saving,
    deletingId,
    error,
    addObject,
    editObject,
    removeObject,
  } = useObjects();

  const [formOpen, setFormOpen] = useState(false);
  const [editingObject, setEditingObject] =
    useState<ConstructionObject | null>(null);

  const canManage = profile?.role === 'manager';

  const handleCreate = () => {
    setEditingObject(null);
    setFormOpen(true);
  };

  const handleEdit = (object: ConstructionObject) => {
    setEditingObject(object);
    setFormOpen(true);
  };

  const handleCancel = () => {
    setFormOpen(false);
    setEditingObject(null);
  };

  const handleSubmit = async (dto: CreateObjectDto) => {
    if (!canManage) return;

    if (editingObject) {
      await editObject(editingObject.id, dto);
    } else {
      await addObject(dto);
    }

    handleCancel();
  };

  const handleDelete = async (id: string) => {
    try {
      await removeObject(id);
    } catch {
      // Ошибка уже сохранена в useObjects.
    }
  };

  if (loading) {
    return <Loader text="Загрузка объектов..." />;
  }

  return (
    <section className="objects-page">
      <header className="objects-page__header">
        <div>
          <h1>Объекты</h1>
          <p>
            {canManage
              ? 'Управление строительными объектами'
              : 'Объекты с назначенными вам задачами'}
          </p>
        </div>

        {canManage && (
          <button
            className="objects-page__add-button"
            type="button"
            onClick={handleCreate}
          >
            <Plus size={18} />
            Добавить объект
          </button>
        )}
      </header>

      {error && (
        <p className="objects-page__error" role="alert">
          {error}
        </p>
      )}

      {canManage && formOpen && (
        <div className="objects-page__form">
          <h2>
            {editingObject
              ? 'Редактирование объекта'
              : 'Новый объект'}
          </h2>

          <ObjectForm
            key={editingObject?.id ?? 'new'}
            initialValues={
              editingObject
                ? {
                    name: editingObject.name,
                    address: editingObject.address,
                  }
                : undefined
            }
            loading={saving}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}

      {objects.length === 0 ? (
        <div className="objects-page__empty">
          <h2>
            {canManage
              ? 'Объектов пока нет'
              : 'Нет доступных объектов'}
          </h2>

          <p>
            {canManage
              ? 'Добавьте первый объект, чтобы начать работу.'
              : 'Здесь появятся объекты, в которых у вас есть задачи.'}
          </p>
        </div>
      ) : (
        <div className="objects-page__list">
          {objects.map((object) => (
            <ObjectCard
              key={object.id}
              object={object}
              canManage={canManage}
              deleting={deletingId === object.id}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
