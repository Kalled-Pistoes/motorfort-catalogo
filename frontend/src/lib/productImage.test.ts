import { describe, expect, it, vi } from 'vitest';

vi.mock('./supabase', () => ({
    supabaseUrl: 'https://motorfort.example.supabase.co',
}));

import { extractProductNumericCode, getProductImageUrl } from './productImage';
import type { CatalogoProduto } from './supabase';

function product(cod: string, imageUrl: string | null = null): CatalogoProduto {
    return { cod, image_url: imageUrl } as CatalogoProduto;
}

describe('extractProductNumericCode', () => {
    it.each([
        ['MFP1234', '1234'],
        ['MFP 1234', '1234'],
        ['MFP-1234', '1234'],
        ['ABC1234XYZ', '1234'],
        ['MFP001234', '001234'],
        ['', ''],
        ['SEM-NUMERO', ''],
        [null, ''],
        [undefined, ''],
    ])('normaliza %s para %s', (input, expected) => {
        expect(extractProductNumericCode(input)).toBe(expected);
    });
});

describe('getProductImageUrl', () => {
    it('monta o nome real do bucket com espaço, zeros preservados e extensão png', () => {
        expect(getProductImageUrl(product('MFP001234'))).toBe(
            'https://motorfort.example.supabase.co/storage/v1/object/public/motorfort-produtos/P%20001234.png',
        );
    });

    it('não gera URL quando o código não contém números', () => {
        expect(getProductImageUrl(product('SEM-NUMERO'))).toBe('');
    });

    it('mantém image_url explícita como prioridade', () => {
        expect(getProductImageUrl(product('MFP1234', 'https://cdn.example/produto.webp'))).toBe(
            'https://cdn.example/produto.webp',
        );
    });
});
