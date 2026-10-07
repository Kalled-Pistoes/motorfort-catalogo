import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCatalogTheme } from '../lib/useCatalogTheme';
import BrandLogo from './BrandLogo';

export default function LoginPage() {
    const { login, user, loading: sessionLoading } = useAuth();
    const navigate = useNavigate();
    const { dark } = useCatalogTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!sessionLoading && user) navigate('/sync', { replace: true });
    }, [navigate, sessionLoading, user]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email.trim(), password);
            navigate('/sync', { replace: true });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${dark ? 'bg-pbi-bg' : 'bg-slate-100'}`}>
            {/* Subtle red glow */}
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-500/8 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[30%] h-[30%] bg-brand-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-sm mx-4">
                {/* Back to catalog */}
                <button
                    onClick={() => navigate('/')}
                    className={`flex items-center gap-1.5 text-xs mb-8 transition-colors ${dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Voltar ao Catálogo
                </button>

                {/* Logo oficial Motorfort. */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <BrandLogo dark={dark} className="h-16 sm:h-20 max-w-[290px] sm:max-w-[340px]" />
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-slate-600'}`}>Área administrativa do catálogo</p>
                </div>

                {/* Card */}
                <div className={`border rounded-2xl p-6 ${dark ? 'bg-pbi-card border-[#334150]' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <h2 className={`text-lg font-semibold mb-6 ${dark ? 'text-[#f0f0f0]' : 'text-slate-900'}`}>Acesso à importação</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${dark ? 'text-[#a0a0a8]' : 'text-slate-600'}`}>
                                E-mail
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@empresa.com"
                                    autoComplete="email"
                                    autoFocus
                                    required
                                    className={`w-full border-2 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brand-500 transition-all ${dark ? 'bg-[#18181b] border-[#444] text-[#f0f0f0] placeholder-[#555]' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${dark ? 'text-[#a0a0a8]' : 'text-slate-600'}`}>
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                    className={`w-full border-2 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:border-brand-500 transition-all ${dark ? 'bg-[#18181b] border-[#444] text-[#f0f0f0] placeholder-[#555]' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#aaa] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-danger-500 text-xs bg-danger-500/10 border border-danger-500/25 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mt-2"
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
