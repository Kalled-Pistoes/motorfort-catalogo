export interface CatalogProductRow {
    cod: string;
    pa: string | null;
    descricao: string | null;
    grupo: string | null;
    montadora: string | null;
    veiculo: string | null;
    ano_aplicacao: string | null;
    motor: string | null;
    sobremedida: string | null;
    qtd_pistoes: number | null;
    diametro_cilindro: number | null;
    ref_metal_leve_sulloy: string | null;
    ref_anel_kalled: string | null;
    espessura_canaletas: string | null;
    anel_kalled: string | null;
    observacao: string | null;
    tipo: string | null;
    combustivel: string | null;
    medida_haste: string | null;
    comprimento_total: string | null;
    image_url: string | null;
    lancamentos: boolean;
    disponivel: boolean;
    updated_at: string;
}

export interface CatalogValidationIssue {
    severity: 'warning' | 'error';
    row: number;
    code?: string;
    field: string;
    message: string;
}
