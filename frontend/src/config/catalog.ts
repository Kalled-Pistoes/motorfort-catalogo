export const catalogConfig = {
    brand: {
        name: 'Motorfort',
        shortName: 'Motorfort',
        productLine: 'Catálogo de produtos',
        logo: '/logo.png',
        logoDark: '/logo-motorfort-branco.png',
        // As logos horizontais não são adequadas como favicon definitivo.
        favicon: null,
    },
    colors: {
        primary: '#0B5CA8',
        primaryHover: '#07508F',
        secondary: '#2498CC',
        accent: '#F28C28',
        accentHover: '#D97706',
        success: '#16A34A',
        danger: '#DC2626',
        background: '#101820',
        surface: '#18232E',
        text: '#F4F7FA',
    },
    productImagesBucket: 'motorfort-produtos',
    // Mantido para não invalidar identificações persistidas; não é branding visível.
    visitorIdKey: 'kalled_visitante_id',
    requireVisitorIdentification: false,
} as const;

export const brand = catalogConfig.brand;

export const catalogFeatures = {
    requireVisitorIdentification: catalogConfig.requireVisitorIdentification,
} as const;

export const catalogStorage = {
    visitorIdKey: catalogConfig.visitorIdKey,
    productImagesBucket: catalogConfig.productImagesBucket,
} as const;
