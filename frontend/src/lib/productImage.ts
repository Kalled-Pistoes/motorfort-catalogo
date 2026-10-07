import { catalogStorage } from '../config/catalog';
import { supabaseUrl, type CatalogoProduto } from './supabase';

export function getProductImageUrl(product: CatalogoProduto): string {
    if (product.image_url) return product.image_url;
    if (!supabaseUrl) return '';
    const code = product.cod.startsWith('P') && !product.cod.includes(' ')
        ? `P ${product.cod.substring(1)}`
        : product.cod;
    return `${supabaseUrl}/storage/v1/object/public/${catalogStorage.productImagesBucket}/${encodeURIComponent(code)}.png`;
}
