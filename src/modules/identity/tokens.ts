import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface IdentityClaims {
  issuer: string;
  subject: string;
  clientId: string;
  verifiedEmail?: string;
}

export function readIdentityConfig(env: NodeJS.ProcessEnv) {
  const { AUTH_ISSUER, AUTH_JWKS_URL, AUTH_AUDIENCE, AUTH_B2C_CLIENT_IDS, AUTH_B2B_CLIENT_IDS } = env;
  if ([AUTH_ISSUER, AUTH_JWKS_URL, AUTH_AUDIENCE, AUTH_B2C_CLIENT_IDS, AUTH_B2B_CLIENT_IDS]
    .every(value => value === undefined)) return undefined;
  if (!AUTH_ISSUER || !AUTH_JWKS_URL || !AUTH_AUDIENCE || !AUTH_B2C_CLIENT_IDS || !AUTH_B2B_CLIENT_IDS) {
    throw new Error('Configure all AUTH settings.');
  }

  for (const value of [AUTH_ISSUER, AUTH_JWKS_URL]) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
      throw new Error('Identity issuer and JWKS must use HTTPS URLs.');
    }
  }
  const b2c = AUTH_B2C_CLIENT_IDS.split(',').map(id => id.trim());
  const b2b = new Set(AUTH_B2B_CLIENT_IDS.split(',').map(id => id.trim()));
  if (b2b.has('') || b2c.some(id => !id || b2b.has(id))) {
    throw new Error('Configure distinct and non-empty B2C and B2B client IDs.');
  }
  return { issuer: AUTH_ISSUER, jwks: new URL(AUTH_JWKS_URL), audience: AUTH_AUDIENCE, b2b, clients: new Set([...b2c, ...b2b]) };
}

export function createTokenVerifier(config: NonNullable<ReturnType<typeof readIdentityConfig>>) {
  const keys = createRemoteJWKSet(config.jwks, { timeoutDuration: 3000 });
  return async (token: string): Promise<IdentityClaims> => {
    const { payload } = await jwtVerify(token, keys, {
      issuer: config.issuer, audience: config.audience, algorithms: ['RS256'],
      typ: 'at+jwt', requiredClaims: ['iss', 'sub', 'aud', 'exp', 'iat', 'jti', 'client_id'],
      maxTokenAge: '1 hour', clockTolerance: 5,
    });
    const { sub, client_id: clientId, email, email_verified: verified } = payload;
    if (!sub || sub.length > 255 || typeof clientId !== 'string' || !config.clients.has(clientId)) {
      throw new Error('Unsupported client or subject.');
    }
    const verifiedEmail = verified === true && typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+$/.test(email)
      ? email.toLowerCase() : undefined;
    return { issuer: config.issuer, subject: sub, clientId, verifiedEmail };
  };
}
