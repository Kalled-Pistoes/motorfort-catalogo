import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCatalogRow, normalizeHeader, parseAvailability } from './normalizeCatalogRow';
import { validateCatalogRows } from './validateCatalogRows';

test('normaliza cabeçalhos com acentos e caixa', () => {
    assert.equal(normalizeHeader('  DISPONIBILIDADE  '), 'disponibilidade');
    assert.equal(normalizeHeader('CÓDIGO'), 'codigo');
});

test('normaliza os valores booleanos de disponibilidade', () => {
    for (const value of ['disponível', 'disponivel', 'sim', '1', 'true']) assert.equal(parseAvailability(value), true);
    for (const value of ['sem estoque', 'não', 'nao', '0', 'false']) assert.equal(parseAvailability(value), false);
    assert.equal(parseAvailability('talvez'), null);
});

test('descarta linha sem código', () => {
    assert.equal(normalizeCatalogRow({ DESCRIÇÃO: 'Sem código' }, 2).product, null);
});

test('registra warning e fallback quando disponibilidade não existe', () => {
    const result = normalizeCatalogRow({ CÓD: 'P 2000' }, 2);
    assert.equal(result.product?.disponivel, true);
    assert.equal(result.issues[0]?.severity, 'warning');
});

test('detecta código duplicado', () => {
    const first = normalizeCatalogRow({ CÓD: 'P 2000', DISPONIBILIDADE: 'sim' }, 2).product!;
    const second = normalizeCatalogRow({ CÓD: 'p 2000', DISPONIBILIDADE: 'não' }, 3).product!;
    const issues = validateCatalogRows([first, second]);
    assert.equal(issues.filter(issue => issue.severity === 'error').length, 1);
});
