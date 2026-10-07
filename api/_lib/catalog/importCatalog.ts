import type { SupabaseClient } from '@supabase/supabase-js';
import type { CatalogProductRow } from './types';

export type CatalogPublishPayload = Omit<CatalogProductRow, 'updated_at'>;

export function toPublishPayload(products: CatalogProductRow[]): CatalogPublishPayload[] {
    return products.map(({ updated_at: _updatedAt, ...product }) => ({ ...product }));
}

/**
 * Publica um dataset já normalizado e validado pela RPC transacional Motorfort.
 * Ainda não é usada pelo endpoint ativo; a troca ocorrerá na Etapa 2B.2.
 */
export async function publishCatalogAtomically(
    supabase: SupabaseClient,
    importId: string,
    products: CatalogProductRow[],
): Promise<number> {
    if (!importId) throw new Error('Publicação atômica requer importId');
    if (products.length === 0) throw new Error('Publicação atômica requer ao menos um produto');

    const { data, error } = await supabase.rpc('publish_catalog_import', {
        p_import_id: importId,
        p_dataset: toPublishPayload(products),
    });

    if (error) {
        throw new Error(`Falha na publicação atômica do catálogo: ${error.message}`);
    }

    const rowsPublished = typeof data === 'number' ? data : Number(data);
    if (!Number.isInteger(rowsPublished) || rowsPublished !== products.length) {
        throw new Error(`RPC publicou uma contagem inesperada: esperado ${products.length}, recebido ${String(data)}`);
    }
    return rowsPublished;
}
