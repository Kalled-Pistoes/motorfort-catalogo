import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { parseCatalogSpreadsheet } from './parseCatalogSpreadsheet';
import { publishCatalogAtomically, toPublishPayload } from './importCatalog';
import type { CatalogValidationIssue } from './types';

export const MAX_CATALOG_RPC_PAYLOAD_BYTES = 18 * 1024 * 1024;

export interface CatalogImportResult {
    importId: string;
    filename: string;
    checksum: string;
    rowsReceived: number;
    rowsValid: number;
    rowsPublished: number;
    warnings: CatalogValidationIssue[];
    payloadBytes: number;
    payloadMB: number;
    timings: {
        parseMs: number;
        normalizeMs: number;
        validateMs: number;
        rpcMs: number;
        totalMs: number;
    };
}

export function sha256FromBase64(base64: string): string {
    return createHash('sha256').update(Buffer.from(base64, 'base64')).digest('hex');
}

export function getCatalogPayloadBytes(products: Parameters<typeof toPublishPayload>[0]): number {
    return Buffer.byteLength(JSON.stringify(toPublishPayload(products)), 'utf8');
}

function safeFilename(filename: unknown): string {
    const cleaned = String(filename || 'catalogo.xlsx').replace(/[\u0000-\u001f\\/]/g, '_').trim();
    return (cleaned || 'catalogo.xlsx').slice(0, 255);
}

function safeErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : 'Falha desconhecida na publicação';
    return message.replace(/[\r\n]+/g, ' ').slice(0, 2000);
}

export async function runAtomicCatalogImport(
    supabase: SupabaseClient,
    input: { base64: string; filename?: string },
): Promise<CatalogImportResult> {
    const totalStarted = Date.now();
    const filename = safeFilename(input.filename);
    const checksum = sha256FromBase64(input.base64);
    const parsed = await parseCatalogSpreadsheet(input.base64);
    const errors = parsed.issues.filter(issue => issue.severity === 'error');
    const warnings = parsed.issues.filter(issue => issue.severity === 'warning');

    if (parsed.products.length === 0) throw new Error('Catálogo inválido: nenhum produto válido encontrado');
    if (errors.length > 0) {
        throw new Error(`Catálogo inválido: ${errors.map(issue => `linha ${issue.row}: ${issue.message}`).join('; ')}`);
    }

    const payloadBytes = getCatalogPayloadBytes(parsed.products);
    if (payloadBytes >= MAX_CATALOG_RPC_PAYLOAD_BYTES) {
        const sizeMB = (payloadBytes / 1024 / 1024).toFixed(2);
        throw new Error(`Catálogo validado, mas o payload da publicação possui ${sizeMB} MB e está próximo do limite de 20 MB. Será necessário usar staging em lotes.`);
    }

    const { data: importRecord, error: createError } = await supabase
        .from('catalog_imports')
        .insert({
            filename,
            checksum,
            status: 'validated',
            rows_received: parsed.rowsReceived,
            rows_valid: parsed.products.length,
            rows_invalid: 0,
            warnings,
            started_at: new Date(totalStarted).toISOString(),
        })
        .select('id')
        .single();

    if (createError || !importRecord?.id) {
        throw new Error(`Não foi possível registrar a importação validada: ${createError?.message || 'registro sem id'}`);
    }

    const rpcStarted = Date.now();
    let rowsPublished: number;
    try {
        rowsPublished = await publishCatalogAtomically(supabase, importRecord.id, parsed.products);
    } catch (publishError) {
        const primaryMessage = safeErrorMessage(publishError);
        const { error: statusError } = await supabase
            .from('catalog_imports')
            .update({ status: 'failed', error_message: primaryMessage, finished_at: new Date().toISOString() })
            .eq('id', importRecord.id);
        if (statusError) {
            console.error('[catalog-import] falha secundária ao registrar status failed', {
                importId: importRecord.id,
                message: statusError.message,
            });
        }
        throw new Error(`Não foi possível publicar o catálogo. O catálogo anterior foi preservado. Importação: ${importRecord.id}`);
    }

    const result: CatalogImportResult = {
        importId: importRecord.id,
        filename,
        checksum,
        rowsReceived: parsed.rowsReceived,
        rowsValid: parsed.products.length,
        rowsPublished,
        warnings,
        payloadBytes,
        payloadMB: Number((payloadBytes / 1024 / 1024).toFixed(3)),
        timings: {
            parseMs: parsed.timings.parseMs,
            normalizeMs: parsed.timings.normalizeMs,
            validateMs: parsed.timings.validateMs,
            rpcMs: Date.now() - rpcStarted,
            totalMs: Date.now() - totalStarted,
        },
    };
    console.info('[catalog-import] publicação concluída', result);
    return result;
}
