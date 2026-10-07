import XLSX from 'xlsx';
import JSZip from 'jszip';
import { normalizeCatalogRow, normalizeHeader } from './normalizeCatalogRow';
import { validateCatalogRows } from './validateCatalogRows';
import type { CatalogProductRow, CatalogValidationIssue } from './types';

async function readWorkbook(base64: string): Promise<XLSX.WorkBook> {
    const raw = Buffer.from(base64, 'base64');
    try { return XLSX.read(new Uint8Array(raw), { type: 'array' }); } catch {}
    try {
        const archive = await JSZip.loadAsync(raw);
        const clean = new JSZip();
        await Promise.all(Object.keys(archive.files).map(async name => {
            const file = archive.files[name];
            if (file.dir) clean.folder(name);
            else clean.file(name, await file.async('uint8array'), { compression: 'DEFLATE' });
        }));
        return XLSX.read(await clean.generateAsync({ type: 'uint8array' }), { type: 'array' });
    } catch (error: any) {
        throw new Error(`Não foi possível ler o catálogo Excel (${raw.length} bytes): ${error.message}. Salve uma nova cópia no Excel e tente novamente.`);
    }
}

export interface ParsedCatalog {
    products: CatalogProductRow[];
    issues: CatalogValidationIssue[];
    preview: Record<string, unknown>[];
    detectedHeaderRow: number;
    sheetNames: string[];
    rowsReceived: number;
    timings: { parseMs: number; normalizeMs: number; validateMs: number };
}

export async function parseCatalogSpreadsheet(base64: string): Promise<ParsedCatalog> {
    const parseStarted = Date.now();
    const workbook = await readWorkbook(base64);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new Error('A planilha de catálogo não possui abas.');

    const readRange = (range: number) => XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { range, raw: false, defval: null });
    const hasCode = (rows: Record<string, unknown>[]) => rows.length > 0 && Object.keys(rows[0]).some(key => ['cod', 'codigo'].includes(normalizeHeader(key)));
    let detectedHeaderRow = 0;
    let rows = readRange(0);
    if (!hasCode(rows)) { detectedHeaderRow = 1; rows = readRange(1); }
    if (!hasCode(rows)) { detectedHeaderRow = 2; rows = readRange(2); }
    if (!hasCode(rows)) throw new Error('Coluna CÓD/CÓDIGO não encontrada nas três primeiras linhas.');

    const parseMs = Date.now() - parseStarted;
    const normalizeStarted = Date.now();
    const products: CatalogProductRow[] = [];
    const normalizationIssues: CatalogValidationIssue[] = [];
    rows.forEach((row, index) => {
        const result = normalizeCatalogRow(row, index + detectedHeaderRow + 2);
        if (result.product) products.push(result.product);
        normalizationIssues.push(...result.issues);
    });
    const normalizeMs = Date.now() - normalizeStarted;
    const validateStarted = Date.now();
    const issues = validateCatalogRows(products, normalizationIssues);
    const validateMs = Date.now() - validateStarted;
    return {
        products,
        issues,
        preview: rows.slice(0, 5),
        detectedHeaderRow,
        sheetNames: workbook.SheetNames,
        rowsReceived: rows.length,
        timings: { parseMs, normalizeMs, validateMs },
    };
}
