
import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';

import { LoginPage } from '../../pages/LoginPage/LoginPage';
import { ObjectsPage } from '../../pages/ObjectsPage/ObjectsPage';
import { MyTasksPage } from '../../pages/MyTasksPage/MyTasksPage';

import { AppLayout } from '../../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRouter() {
  const { profile } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={
              profile?.role === 'manager'
                ? <ObjectsPage />
                : <Navigate to="/my-tasks" replace />
            }
          />

          <Route
            element={
              <ProtectedRoute allowedRoles={['manager']} />
            }
          >
            <Route
              path="/objects"
              element={<ObjectsPage />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute allowedRoles={['performer']} />
            }
          >
            <Route
              path="/my-tasks"
              element={<MyTasksPage />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
