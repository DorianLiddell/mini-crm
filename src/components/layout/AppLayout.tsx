
import { Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';

import './AppLayout.scss';

export function AppLayout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      // Сессия остаётся активной, если выход завершился ошибкой.
    }
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header__brand">
          Mini CRM
        </div>

        <div className="app-header__user">
          <div>
            <span>{profile?.email}</span>
            <small>
              {profile?.role === 'manager'
                ? 'Постановщик'
                : 'Исполнитель'}
            </small>
          </div>

          <button onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </header>

      <main className="app-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
