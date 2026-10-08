import { catalogStorage } from '../config/catalog';
import { supabaseUrl, type CatalogoProduto } from './supabase';

export function extractProductNumericCode(code?: string | null): string {
    if (!code) return '';
    return String(code).replace(/\D/g, '');
}

export function getProductImageUrl(product: CatalogoProduto): string {
    if (product.image_url) return product.image_url;
    if (!supabaseUrl) return '';
    const numericCode = extractProductNumericCode(product.cod);
    if (!numericCode) return '';
    const filename = `P ${numericCode}.png`;
    return `${supabaseUrl}/storage/v1/object/public/${catalogStorage.productImagesBucket}/${encodeURIComponent(filename)}`;
}
