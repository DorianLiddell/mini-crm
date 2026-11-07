import { NavLink, Outlet, useNavigate } from 'react-router-dom';

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
      // При ошибке выхода пользователь остаётся в приложении.
    }
  };

  const roleLabel =
    profile?.role === 'manager' ? 'Постановщик' : 'Исполнитель';

  return (
    <div className="app-layout">
      <header className="app-header">
        <NavLink className="app-header__brand" to="/">
          Mini CRM
        </NavLink>

        <nav className="app-header__nav">
          <NavLink
            to="/objects"
            className={({ isActive }) =>
              isActive ? 'app-header__link active' : 'app-header__link'
            }
          >
            Объекты
          </NavLink>

          {profile?.role === 'performer' && (
            <NavLink
              to="/my-tasks"
              className={({ isActive }) =>
                isActive ? 'app-header__link active' : 'app-header__link'
              }
            >
              Мои задачи
            </NavLink>
          )}
        </nav>

        <div className="app-header__user">
          <div className="app-header__user-info">
            <span>{profile?.email}</span>
            <small>{roleLabel}</small>
          </div>

          <button type="button" onClick={() => void handleLogout()}>
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
