import assert from 'node:assert/strict';
import test from 'node:test';
import XLSX from 'xlsx';
import { runAtomicCatalogImport, sha256FromBase64 } from './catalogImportService';

function spreadsheet(rows: Record<string, unknown>[]): string {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Catalogo');
    return XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
}

function supabaseMock(rpcError?: string) {
    const calls: any[] = [];
    const client = {
        from(table: string) {
            return {
                insert(value: any) {
                    calls.push(['insert', table, value]);
                    return { select: () => ({ single: async () => ({ data: { id: 'import-1' }, error: null }) }) };
                },
                update(value: any) {
                    calls.push(['update', table, value]);
                    return { eq: async () => ({ error: null }) };
                },
            };
        },
        async rpc(name: string, args: any) {
            calls.push(['rpc', name, args]);
            return rpcError
                ? { data: null, error: { message: rpcError } }
                : { data: args.p_dataset.length, error: null };
        },
    };
    return { client: client as any, calls };
}

test('mesmos bytes produzem o mesmo SHA-256', () => {
    const base64 = Buffer.from('arquivo xlsx estável').toString('base64');
    assert.equal(sha256FromBase64(base64), sha256FromBase64(base64));
    assert.equal(sha256FromBase64(base64).length, 64);
});

test('fluxo válido cria importação, preserva disponibilidade e publica por RPC', async () => {
    const { client, calls } = supabaseMock();
    const result = await runAtomicCatalogImport(client, {
        base64: spreadsheet([
            { COD: 'P 1', DISPONIBILIDADE: 'sim' },
            { COD: 'P 2', DISPONIBILIDADE: 'não' },
        ]),
        filename: 'catalogo.xlsx',
    });
    assert.equal(result.rowsPublished, 2);
    const rpc = calls.find(call => call[0] === 'rpc');
    assert.deepEqual(rpc[2].p_dataset.map((row: any) => row.disponivel), [true, false]);
});

test('falha da RPC marca catalog_imports como failed', async () => {
    const { client, calls } = supabaseMock('erro controlado');
    await assert.rejects(() => runAtomicCatalogImport(client, {
        base64: spreadsheet([{ COD: 'P 1', DISPONIBILIDADE: 'sim' }]),
        filename: 'catalogo.xlsx',
    }), /catálogo anterior foi preservado/);
    assert.ok(calls.some(call => call[0] === 'update' && call[2].status === 'failed'));
});

test('duplicidade falha antes de criar catalog_imports ou chamar RPC', async () => {
    const { client, calls } = supabaseMock();
    await assert.rejects(() => runAtomicCatalogImport(client, {
        base64: spreadsheet([
            { COD: 'P 1', DISPONIBILIDADE: 'sim' },
            { COD: 'p 1', DISPONIBILIDADE: 'não' },
        ]),
    }), /duplicado/);
    assert.equal(calls.length, 0);
});
