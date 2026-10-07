import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import Catalogo from './components/Catalogo';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import SyncPage from './components/SyncPage';
import { AuthProvider } from './contexts/AuthContext';

function AdminContext() {
  return <AuthProvider><Outlet /></AuthProvider>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* O catálogo público não inicializa a área administrativa. */}
        <Route index element={<Catalogo />} />

        {/* Administração mínima protegida por sessão do Supabase Auth. */}
        <Route element={<AdminContext />}>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/sync" element={<SyncPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
