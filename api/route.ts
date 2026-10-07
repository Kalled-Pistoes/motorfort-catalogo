import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireSupabaseAdmin } from './_lib/auth';
import { parseCatalogSpreadsheet } from './_lib/catalog/parseCatalogSpreadsheet';
import { runAtomicCatalogImport } from './_lib/catalog/catalogImportService';
import { supabase } from './_lib/supabase';

function getPath(req: VercelRequest): string[] {
    const rawPath = (req.url || '').split('?')[0].replace(/^\/api\/?/, '');
    return rawPath.split('/').filter(Boolean);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const [resource, action] = getPath(req);

    if (resource !== 'sync' || (action && action !== 'preview')) {
        return res.status(404).json({ error: 'Rota não encontrada' });
    }

    const admin = await requireSupabaseAdmin(req, res);
    if (!admin) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { catalogo, catalogoNome } = req.body || {};
    if (!catalogo || typeof catalogo !== 'string') {
        return res.status(400).json({ error: 'Envie a planilha do catálogo em base64' });
    }

    try {
        if (action === 'preview') {
            const parsed = await parseCatalogSpreadsheet(catalogo);
            return res.json({
                sheets: parsed.sheetNames,
                counts: {
                    'Catálogo': parsed.products.length,
                    _catalogo_range_detectado: parsed.detectedHeaderRow,
                    _catalogo_avisos: parsed.issues.filter(issue => issue.severity === 'warning').length,
                    _catalogo_erros: parsed.issues.filter(issue => issue.severity === 'error').length,
                },
                preview: { 'Catálogo': parsed.preview },
                catalogIssues: parsed.issues,
            });
        }

        const result = await runAtomicCatalogImport(supabase, {
            base64: catalogo,
            filename: catalogoNome,
        });
        return res.json({ success: true, ...result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao processar o catálogo';
        return res.status(500).json({ error: message });
    }
}
