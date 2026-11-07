import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';

import { LoginPage } from '../../pages/LoginPage/LoginPage';
import { ObjectsPage } from '../../pages/ObjectsPage/ObjectsPage';
import { ObjectDetailsPage } from '../../pages/ObjectDetailsPage/ObjectDetailsPage';
import { TaskDetailsPage } from '../../pages/TaskDetailsPage/TaskDetailsPage';
import { MyTasksPage } from '../../pages/MyTasksPage/MyTasksPage';

import { AppLayout } from '../../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

function HomeRedirect() {
  const { profile } = useAuth();

  return (
    <Navigate
      to={profile?.role === 'performer' ? '/my-tasks' : '/objects'}
      replace
    />
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeRedirect />} />

          <Route path="/objects" element={<ObjectsPage />} />

          <Route
            path="/objects/:objectId"
            element={<ObjectDetailsPage />}
          />

          <Route
            path="/tasks/:taskId"
            element={<TaskDetailsPage />}
          />

          <Route element={<ProtectedRoute allowedRoles={['performer']} />}>
            <Route path="/my-tasks" element={<MyTasksPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
