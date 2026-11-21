import { afterEach, expect, it, vi } from 'vitest';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { createTokenVerifier, readIdentityConfig } from '../../src/modules/identity/tokens.js';

afterEach(() => vi.unstubAllGlobals());

const env = {
  AUTH_ISSUER: 'https://identity.example.test/',
  AUTH_JWKS_URL: 'https://identity.example.test/jwks',
  AUTH_AUDIENCE: 'companion-api',
  AUTH_B2C_CLIENT_IDS: 'attendee-web',
  AUTH_B2B_CLIENT_IDS: 'business-web',
};

it('verifies signed API access tokens and rejects the wrong audience, client and token type', async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);
  vi.stubGlobal('fetch', async () => Response.json({ keys: [{ ...jwk, kid: 'key-1' }] }));
  const verify = createTokenVerifier(readIdentityConfig(env)!);
  async function token(audience = env.AUTH_AUDIENCE, clientId = 'business-web', typ = 'at+jwt') {
    return new SignJWT({ client_id: clientId, email: 'MEMBER@EXAMPLE.TEST', email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'key-1', typ })
      .setSubject('person-1').setIssuer(env.AUTH_ISSUER).setAudience(audience)
      .setIssuedAt().setExpirationTime('5m').setJti('access-1').sign(privateKey);
  }
  expect(await verify(await token())).toMatchObject({
    subject: 'person-1', clientId: 'business-web', verifiedEmail: 'member@example.test',
  });
  await expect(verify(await token('another-api'))).rejects.toThrow();
  await expect(verify(await token(env.AUTH_AUDIENCE, 'unknown'))).rejects.toThrow();
  await expect(verify(await token(env.AUTH_AUDIENCE, 'business-web', 'JWT'))).rejects.toThrow();
});

it('allows an unconfigured deployment and rejects overlapping or insecure setup', () => {
  expect(readIdentityConfig({})).toBeUndefined();
  expect(() => readIdentityConfig({ ...env, AUTH_B2B_CLIENT_IDS: 'attendee-web' })).toThrow();
  expect(() => readIdentityConfig({ ...env, AUTH_JWKS_URL: 'http://identity.example.test/jwks' })).toThrow();
});
