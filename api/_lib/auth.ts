import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface SupabaseAdminUser {
    id: string;
    email?: string;
    app_metadata: Record<string, unknown>;
}

type GetUser = (accessToken: string) => Promise<{
    data: { user: SupabaseAdminUser | null };
    error: unknown;
}>;

const getSupabaseUser: GetUser = async accessToken => {
    const { supabase } = await import('./supabase');
    const { data, error } = await supabase.auth.getUser(accessToken);
    return { data: { user: data.user as SupabaseAdminUser | null }, error };
};

export type SupabaseAdminDecision =
    | { status: 200; user: SupabaseAdminUser }
    | { status: 401 | 403; error: string };

export async function authorizeSupabaseAdmin(
    authorization: string | undefined,
    getUser: GetUser = getSupabaseUser,
): Promise<SupabaseAdminDecision> {
    if (!authorization?.startsWith('Bearer ') || !authorization.slice(7).trim()) {
        return { status: 401, error: 'Token de acesso necessário' };
    }

    const { data, error } = await getUser(authorization.slice(7).trim());
    if (error || !data.user) {
        return { status: 401, error: 'Sessão inválida ou expirada' };
    }

    if (data.user.app_metadata?.role !== 'admin') {
        return { status: 403, error: 'Acesso restrito ao administrador' };
    }

    return { status: 200, user: data.user };
}

export async function requireSupabaseAdmin(
    req: VercelRequest,
    res: VercelResponse,
): Promise<SupabaseAdminUser | null> {
    const decision = await authorizeSupabaseAdmin(req.headers.authorization);
    if (decision.status !== 200) {
        res.status(decision.status).json({ error: decision.error });
        return null;
    }
    return decision.user;
}
