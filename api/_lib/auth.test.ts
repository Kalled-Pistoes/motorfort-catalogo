import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeSupabaseAdmin } from './auth';

test('sync sem token recebe 401', async () => {
    const result = await authorizeSupabaseAdmin(undefined);
    assert.equal(result.status, 401);
});

test('token válido sem role admin recebe 403', async () => {
    const result = await authorizeSupabaseAdmin('Bearer valid-user', async () => ({
        data: { user: { id: 'user-id', app_metadata: { role: 'user' } } },
        error: null,
    }));
    assert.equal(result.status, 403);
});

test('token válido com app_metadata.role admin é permitido', async () => {
    const result = await authorizeSupabaseAdmin('Bearer valid-admin', async () => ({
        data: { user: { id: 'admin-id', app_metadata: { role: 'admin' } } },
        error: null,
    }));
    assert.equal(result.status, 200);
});
