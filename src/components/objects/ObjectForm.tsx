import { useState, type FormEvent } from 'react';

import type { CreateObjectDto } from '../../types/database.types';

interface ObjectFormProps {
  initialValues?: CreateObjectDto;
  loading?: boolean;
  onSubmit: (data: CreateObjectDto) => Promise<void>;
  onCancel: () => void;
}

export function ObjectForm({
  initialValues,
  loading = false,
  onSubmit,
  onCancel,
}: ObjectFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [address, setAddress] = useState(
    initialValues?.address ?? '',
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError(null);

    const dto = {
      name: name.trim(),
      address: address.trim(),
    };

    if (!dto.name || !dto.address) {
      setError('Заполните все поля');
      return;
    }

    try {
      await onSubmit(dto);
    } catch {
      setError('Не удалось сохранить объект. Попробуйте ещё раз.');
    }
  };

  return (
    <form className="object-form" onSubmit={handleSubmit}>
      <div className="object-form__field">
        <label htmlFor="object-name">
          Название объекта
        </label>

        <input
          id="object-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Например, Жилой комплекс"
          maxLength={150}
          required
          disabled={loading}
        />
      </div>

      <div className="object-form__field">
        <label htmlFor="object-address">
          Адрес
        </label>

        <input
          id="object-address"
          type="text"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Введите адрес объекта"
          maxLength={255}
          required
          disabled={loading}
        />
      </div>

      {error && (
        <p className="object-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="object-form__actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
        >
          Отмена
        </button>

        <button type="submit" disabled={loading}>
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
}