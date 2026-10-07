import { useState } from 'react';
import { ArrowLeft, Eye, FileSpreadsheet, LogOut, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCatalogTheme } from '../lib/useCatalogTheme';
import BrandLogo from './BrandLogo';

interface CatalogIssue {
    severity: 'warning' | 'error';
    row: number;
    code?: string;
    field: string;
    message: string;
}

interface PreviewResult {
    counts: Record<string, number>;
    preview: Record<string, Record<string, unknown>[]>;
    catalogIssues?: CatalogIssue[];
}

interface SyncResult {
    success: boolean;
    importId: string;
    filename: string;
    checksum: string;
    rowsReceived: number;
    rowsValid: number;
    rowsPublished: number;
    warnings: CatalogIssue[];
    payloadMB: number;
}

const API_BASE = import.meta.env.VITE_API_URL || window.location.origin;

function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function SyncPage() {
    const navigate = useNavigate();
    const { token, logout } = useAuth();
    const { dark } = useCatalogTheme();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [result, setResult] = useState<SyncResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function post<T>(path: string): Promise<T> {
        if (!file) throw new Error('Selecione a planilha do catálogo.');
        const response = await fetch(`${API_BASE}/api/${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ catalogo: await toBase64(file), catalogoNome: file.name }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Falha ao processar a planilha.');
        return data;
    }

    async function run(action: 'preview' | 'import') {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            if (action === 'preview') setPreview(await post<PreviewResult>('sync/preview'));
            else setResult(await post<SyncResult>('sync'));
        } catch (caught: unknown) {
            setError(caught instanceof Error ? caught.message : 'Erro inesperado.');
        } finally {
            setLoading(false);
        }
    }

    const issues = preview?.catalogIssues ?? [];
    const hasErrors = issues.some(issue => issue.severity === 'error');

    return (
        <main className={`min-h-screen px-4 py-8 ${dark ? 'bg-pbi-bg text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
            <div className="max-w-5xl mx-auto">
                <header className="flex items-center justify-between gap-4 mb-8">
                    <div>
                        <button onClick={() => navigate('/')} className={`inline-flex items-center gap-2 text-sm mb-3 ${dark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'}`}>
                            <ArrowLeft className="w-4 h-4" /> Voltar ao catálogo
                        </button>
                        <BrandLogo dark={dark} className="mb-4 h-10 sm:h-12 max-w-[220px] sm:max-w-[280px]" />
                        <h1 className="text-2xl font-black">Importação do catálogo</h1>
                        <p className={`text-sm mt-1 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Administração e publicação do catálogo.</p>
                    </div>
                    <button onClick={async () => { await logout(); navigate('/login', { replace: true }); }} className={`inline-flex items-center gap-2 text-sm ${dark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'}`}>
                        <LogOut className="w-4 h-4" /> Sair
                    </button>
                </header>

                <section className={`rounded-2xl border p-6 ${dark ? 'border-[#334150] bg-pbi-card' : 'border-slate-200 bg-white shadow-lg'}`}>
                    <label className="block text-sm font-bold mb-2" htmlFor="catalog-file">Planilha do catálogo</label>
                    <label htmlFor="catalog-file" className={`flex items-center gap-3 rounded-xl border-2 border-dashed p-5 cursor-pointer transition-colors ${dark ? 'border-slate-600 hover:border-brand-400' : 'border-slate-400 hover:border-brand-500'}`}>
                        <FileSpreadsheet className="w-8 h-8 text-brand-400" />
                        <span className={`text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{file?.name ?? 'Selecionar arquivo .xlsx ou .xls'}</span>
                    </label>
                    <input id="catalog-file" className="hidden" type="file" accept=".xlsx,.xls" onChange={event => {
                        setFile(event.target.files?.[0] ?? null);
                        setPreview(null); setResult(null); setError(null);
                    }} />

                    <div className="flex flex-wrap gap-3 mt-5">
                        <button disabled={!file || loading} onClick={() => run('preview')} className="inline-flex items-center gap-2 rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm font-bold text-white transition-colors disabled:opacity-40">
                            <Eye className="w-4 h-4" /> Validar e visualizar
                        </button>
                        <button disabled={!file || loading || hasErrors} onClick={() => run('import')} className="inline-flex items-center gap-2 rounded-lg bg-accent-500 hover:bg-accent-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
                            <Upload className="w-4 h-4" /> Substituir catálogo
                        </button>
                    </div>

                    {loading && <p className="mt-4 text-sm text-slate-400">Processando...</p>}
                    {error && <p className="mt-4 rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-500">{error}</p>}
                    {result && (
                        <div className="mt-4 rounded-lg border border-success-500/30 bg-success-500/10 p-3 text-sm text-success-500">
                            <p className="font-bold">Importação concluída com sucesso.</p>
                            <p>{result.rowsPublished.toLocaleString('pt-BR')} produtos publicados.</p>
                            {result.warnings.length > 0 && <p className="mt-1 text-accent-500">{result.warnings.length} aviso(s) registrado(s).</p>}
                        </div>
                    )}
                </section>

                {preview && (
                    <section className={`mt-6 rounded-2xl border p-6 ${dark ? 'border-[#334150] bg-pbi-card' : 'border-slate-200 bg-white shadow-lg'}`}>
                        <h2 className="font-bold">Pré-visualização ({preview.counts['Catálogo'] ?? 0} produtos)</h2>
                        {issues.length > 0 && (
                            <div className="mt-4 max-h-52 overflow-auto space-y-2">
                                {issues.map((issue, index) => (
                                    <p key={`${issue.row}-${issue.field}-${index}`} className={`text-xs rounded p-2 ${issue.severity === 'error' ? 'bg-danger-500/10 text-danger-500' : 'bg-accent-500/10 text-accent-500'}`}>
                                        Linha {issue.row}{issue.code ? ` · ${issue.code}` : ''}: {issue.message}
                                    </p>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-xs">
                                <tbody>
                                    {(preview.preview['Catálogo'] ?? []).map((row, index) => (
                                        <tr key={index} className="border-t border-[#333]">
                                            {Object.values(row).slice(0, 8).map((value, cell) => <td key={cell} className="p-2 whitespace-nowrap">{String(value ?? '')}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
