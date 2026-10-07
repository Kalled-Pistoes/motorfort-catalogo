import type { CatalogProductRow, CatalogValidationIssue } from './types';

export const DEFAULT_AVAILABILITY = true;

export function normalizeHeader(value: unknown): string {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function getColumn(row: Record<string, unknown>, ...names: string[]): unknown {
    const normalizedNames = names.map(normalizeHeader);
    for (const key of Object.keys(row)) {
        if (normalizedNames.includes(normalizeHeader(key))) return row[key];
    }
    return null;
}

function cleanText(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    return String(value).trim().replace(/\r?\n/g, ' / ') || null;
}

function cleanNumber(value: unknown): number | null {
    const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'));
    return Number.isNaN(parsed) ? null : parsed;
}

function titleCase(value: unknown): string | null {
    const text = cleanText(value);
    return text ? text.toLowerCase().replace(/(?:^|\s|\/|-)\S/g, char => char.toUpperCase()) : null;
}

export function parseAvailability(value: unknown): boolean | null {
    if (typeof value === 'boolean') return value;
    const normalized = normalizeHeader(value);
    if (['disponivel', 'sim', '1', 'true'].includes(normalized)) return true;
    if (['sem estoque', 'nao', '0', 'false'].includes(normalized)) return false;
    return null;
}

export function normalizeCatalogRow(
    raw: Record<string, unknown>,
    rowNumber: number,
): { product: CatalogProductRow | null; issues: CatalogValidationIssue[] } {
    const cod = String(getColumn(raw, 'CÓD', 'COD', 'Cód', 'Cod', 'Código', 'CÓDIGO', 'codigo') ?? '').trim();
    if (!cod) {
        return {
            product: null,
            issues: [{ severity: 'error', row: rowNumber, field: 'cod', message: 'Código obrigatório ausente.' }],
        };
    }

    const issues: CatalogValidationIssue[] = [];
    const availabilityRaw = getColumn(raw, 'DISPONIBILIDADE', 'disponibilidade');
    const parsedAvailability = parseAvailability(availabilityRaw);
    if (parsedAvailability === null) {
        issues.push({
            severity: 'warning', row: rowNumber, code: cod, field: 'disponibilidade',
            message: availabilityRaw === null || availabilityRaw === undefined || availabilityRaw === ''
                ? `Campo ausente; fallback explícito aplicado (${DEFAULT_AVAILABILITY}).`
                : `Valor inválido "${String(availabilityRaw)}"; fallback explícito aplicado (${DEFAULT_AVAILABILITY}).`,
        });
    }

    const launch = cleanText(getColumn(raw, 'LANÇAMENTOS', 'LANÇAMENTO', 'Lancamentos', 'Lancamento'));
    const quantity = cleanNumber(getColumn(raw, 'QUANTIDADE DE PISTÕES', 'QUANTIDADE DE PISTOES', 'Qtd Pistões', 'Qtd Pistoes', 'qtd_pistoes'));
    return {
        product: {
            cod,
            pa: cleanText(getColumn(raw, 'PA')),
            descricao: cleanText(getColumn(raw, 'DESCRIÇÃO', 'DESCRICAO', 'Descricao', 'descricao')),
            grupo: cleanText(getColumn(raw, 'GRUPO', 'Grupo', 'grupo')),
            montadora: titleCase(getColumn(raw, 'MONTADORA', 'Montadora', 'montadora')),
            veiculo: cleanText(getColumn(raw, 'VEICULO', 'VEÍCULO', 'Veículo', 'veiculo')),
            ano_aplicacao: cleanText(getColumn(raw, 'ANO DE APLICAÇÃO', 'ANO DE APLICACAO', 'Ano de Aplicação', 'ano_aplicacao')),
            motor: cleanText(getColumn(raw, 'MOTOR', 'Motor', 'motor')),
            sobremedida: cleanText(getColumn(raw, 'SOBREMEDIDA', 'Sobremedida', 'sobremedida')),
            qtd_pistoes: quantity === null ? null : Math.round(quantity),
            diametro_cilindro: cleanNumber(getColumn(raw, 'DIAMETRO DO CILINDRO', 'DIÂMETRO DO CILINDRO', 'diametro_cilindro')),
            ref_metal_leve_sulloy: cleanText(getColumn(raw, 'CÓD REF METAL LEVE / SULOY', 'CÓD REF METAL LEVE / SULLOY', 'COD REF METAL LEVE / SULOY', 'ref_metal_leve_sulloy')),
            ref_anel_kalled: cleanText(getColumn(raw, 'REF ANEL KALLED', 'ref_anel_kalled')),
            espessura_canaletas: cleanText(getColumn(raw, 'ESPESSURA DAS CANALETAS', 'ESPESSURA CANALETAS', 'ESPESSURA DE CANALETAS', 'espessura_canaletas')),
            anel_kalled: cleanText(getColumn(raw, 'ANEL KALLED', 'anel_kalled')),
            observacao: cleanText(getColumn(raw, 'OBSERVAÇÃO', 'OBSERVACAO', 'Observacao', 'obs', 'OBS')),
            tipo: cleanText(getColumn(raw, 'TIPO', 'Tipo', 'tipo')),
            combustivel: cleanText(getColumn(raw, 'COMBUSTÍVEL', 'COMBUSTIVEL', 'Combustivel', 'combustivel')),
            medida_haste: cleanText(getColumn(raw, 'MEDIDA DA HASTE', 'MEDIDA HASTE', 'medida_haste')),
            comprimento_total: cleanText(getColumn(raw, 'COMPRIMENTO TOTAL', 'comprimento_total')),
            image_url: cleanText(getColumn(raw, 'URL DA IMAGEM', 'IMAGE URL', 'image_url')),
            lancamentos: launch ? ['lancamento', 'sim', 'yes', 's', 'true', '1', 'novo', 'new', 'launch'].includes(normalizeHeader(launch)) : false,
            disponivel: parsedAvailability ?? DEFAULT_AVAILABILITY,
            updated_at: new Date().toISOString(),
        },
        issues,
    };
}
