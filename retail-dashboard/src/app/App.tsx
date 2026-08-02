import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './AppLayout';
import LoginPage from '@/pages/LoginPage';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import OverviewPage from '@/pages/overview/OverviewPage';

function RequireAuth({ children }: { children: React.ReactElement }) {
  const user = useSelector((s: RootState) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}