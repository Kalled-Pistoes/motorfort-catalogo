import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen bg-pbi-bg text-slate-400 flex items-center justify-center">Carregando sessão...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return <Outlet />;
}
