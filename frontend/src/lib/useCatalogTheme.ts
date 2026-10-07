import { useState } from 'react';

export function useCatalogTheme() {
    const [dark, setDark] = useState<boolean>(() => {
        const saved = localStorage.getItem('catalogo_theme');
        return saved ? saved === 'dark' : false;
    });

    const toggle = () => setDark(current => {
        const next = !current;
        localStorage.setItem('catalogo_theme', next ? 'dark' : 'light');
        return next;
    });

    return { dark, toggle };
}
