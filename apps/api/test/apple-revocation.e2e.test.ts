/** Adaptateur réel de la révocation Apple, sans réseau : forme des requêtes et du JWT `client_secret` (ES256). */
import { generateKeyPairSync, verify } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env';
import { APPLE_ID_ORIGIN, AppleIdTokenClient, type AppleTransport } from '../src/integrations/auth/apple-revocation';
import { FakeClock, START } from './helpers';

const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const cfg = { keyP8: pem.replace(/\n/g, '\\n'), keyId: 'KEY1234567', teamId: 'TEAM123456', clientId: 'app.blowy' };

const decode = (part: string): Record<string, unknown> => JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>;

describe('révocation Sign in with Apple (adaptateur réel, transport imité)', () => {
  it('échange le code puis révoque le jeton, avec un client_secret ES256 conforme', async () => {
    const calls: { url: string; form: Record<string, string> }[] = [];
    const transport: AppleTransport = async (url, form) => {
      calls.push({ url, form });
      return url.endsWith('/auth/token') ? { status: 200, body: JSON.stringify({ access_token: 'a', refresh_token: 'r-123', id_token: 'i' }) } : { status: 200, body: '' };
    };
    const client = new AppleIdTokenClient(cfg, new FakeClock(START), transport);
    const grant = await client.exchange('code-abc');
    expect(grant).toEqual({ refreshToken: 'r-123', clientId: 'app.blowy' });
    await client.revoke(grant);

    expect(calls.map((c) => c.url)).toEqual([`${APPLE_ID_ORIGIN}/auth/token`, `${APPLE_ID_ORIGIN}/auth/revoke`]);
    expect(calls[0]?.form).toMatchObject({ client_id: 'app.blowy', code: 'code-abc', grant_type: 'authorization_code' });
    expect(calls[0]?.form).not.toHaveProperty('redirect_uri');
    expect(calls[1]?.form).toMatchObject({ client_id: 'app.blowy', token: 'r-123', token_type_hint: 'refresh_token' });

    const [head = '', claims = '', sig = ''] = (calls[1]?.form.client_secret ?? '').split('.');
    expect(decode(head)).toEqual({ alg: 'ES256', kid: 'KEY1234567' });
    const iat = Math.floor(START.getTime() / 1000);
    expect(decode(claims)).toEqual({ iss: 'TEAM123456', iat, exp: iat + 300, aud: 'https://appleid.apple.com', sub: 'app.blowy' });
    expect(verify('sha256', Buffer.from(`${head}.${claims}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(sig, 'base64url'))).toBe(true);
  });

  it('un refus d’Apple lève une erreur sans le jeton ni le secret', async () => {
    const transport: AppleTransport = async () => ({ status: 400, body: JSON.stringify({ error: 'invalid_grant' }) });
    const client = new AppleIdTokenClient(cfg, new FakeClock(START), transport);
    await expect(client.exchange('code-expired')).rejects.toThrow(/400, invalid_grant/);
    const err = await client.revoke({ refreshToken: 'secret-refresh', clientId: 'app.blowy' }).catch((e: unknown) => e);
    expect(String(err)).not.toContain('secret-refresh');
  });

  it('configuration : les trois variables vont ensemble ; sans elles, désactivée (Supabase) ou imitée (mémoire)', () => {
    const base = { BLOWY_ENV: 'local', BLOWY_ADAPTERS: 'memory', CORS_ORIGINS: '' };
    expect(loadEnv(base).appleSignIn).toEqual({ provider: 'memory', apple: null });
    expect(() => loadEnv({ ...base, APPLE_SIGNIN_KEY_ID: 'KEY1234567' })).toThrow(/vont ensemble/);
    const on = loadEnv({ ...base, APPLE_SIGNIN_KEY_P8: cfg.keyP8, APPLE_SIGNIN_KEY_ID: cfg.keyId, APPLE_SIGNIN_TEAM_ID: cfg.teamId });
    expect(on.appleSignIn).toMatchObject({ provider: 'apple', apple: { clientId: 'app.blowy', keyId: 'KEY1234567', teamId: 'TEAM123456' } });
    const supabase = loadEnv({ ...base, BLOWY_ADAPTERS: 'supabase', SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k' });
    expect(supabase.appleSignIn.provider).toBe('off');
  });
});
