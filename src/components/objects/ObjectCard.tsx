import { Link } from 'react-router-dom';
import { MapPin, Pencil, Trash2 } from 'lucide-react';

import type { ConstructionObject } from '../../types/database.types';

interface ObjectCardProps {
  object: ConstructionObject;
  canManage: boolean;
  deleting: boolean;
  onEdit: (object: ConstructionObject) => void;
  onDelete: (id: string) => void;
}

export function ObjectCard({
  object,
  canManage,
  deleting,
  onEdit,
  onDelete,
}: ObjectCardProps) {
  const handleDelete = () => {
    const confirmed = window.confirm(
      `Удалить объект «${object.name}»?`,
    );

    if (confirmed) {
      onDelete(object.id);
    }
  };

  return (
    <article className="object-card">
      <div className="object-card__content">
        <Link
          className="object-card__title"
          to={`/objects/${object.id}`}
        >
          {object.name}
        </Link>

        <p className="object-card__address">
          <MapPin size={16} />
          <span>{object.address}</span>
        </p>
      </div>

      {canManage && (
        <div className="object-card__actions">
          <button
            type="button"
            aria-label="Редактировать объект"
            onClick={() => onEdit(object)}
          >
            <Pencil size={17} />
          </button>

          <button
            type="button"
            aria-label="Удалить объект"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 size={17} />
          </button>
        </div>
      )}
    </article>
  );
}