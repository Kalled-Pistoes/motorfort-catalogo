import type { CatalogProductRow, CatalogValidationIssue } from './types';

export function validateCatalogRows(products: CatalogProductRow[], initial: CatalogValidationIssue[] = []): CatalogValidationIssue[] {
    const issues = [...initial];
    const firstRowByCode = new Map<string, number>();
    products.forEach((product, index) => {
        const row = index + 2;
        const key = product.cod.toLocaleUpperCase('pt-BR');
        const first = firstRowByCode.get(key);
        if (first !== undefined) {
            issues.push({ severity: 'error', row, code: product.cod, field: 'cod', message: `Código duplicado; primeira ocorrência na linha ${first}.` });
        } else {
            firstRowByCode.set(key, row);
        }
    });
    return issues;
}
