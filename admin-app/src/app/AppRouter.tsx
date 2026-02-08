import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminHomePage } from '../pages/AdminHomePage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AdminHomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
