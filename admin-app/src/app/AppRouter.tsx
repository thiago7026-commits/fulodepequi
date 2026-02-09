import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { LoginPage } from "../pages/LoginPage";
import { AdminHomePage } from "../pages/AdminHomePage";
import { ProtectedRoute } from "../components/ProtectedRoute";

/**
 * Router do PAINEL ADMIN
 * Baseado em /admin/ (GitHub Pages)
 */
export function AppRouter() {
  return (
    <BrowserRouter basename="/admin/">
      <Routes>
        {/* Login */}
        <Route path="/" element={<LoginPage />} />

        {/* Dashboard / Home do Admin (protegido) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminHomePage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
