const failures = [];

function requireSecret(name, minimumLength = 32) {
    const value = process.env[name];
    if (!value || value.length < minimumLength) {
        failures.push(`${name} must be configured with at least ${minimumLength} characters`);
    }
}

requireSecret('AUTH_SECRET');
requireSecret('AUDIT_HMAC_KEY');

const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
if (!redisUrl || !redisToken) {
    failures.push(
        'UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN is required for fail-closed distributed rate limiting',
    );
}
for (const name of ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN']) {
    if (!process.env[name]) failures.push(`${name} is required for durable production data storage`);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) failures.push('BLOB_READ_WRITE_TOKEN is required for private exam PDF storage');

const databaseUrl = process.env.TURSO_DATABASE_URL ?? '';
if (databaseUrl.startsWith('file:')) {
    failures.push('file: SQLite is not an approved durable multi-instance production database');
}

const hasManagedAi = Boolean(
    process.env.ANTHROPIC_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.AI_GATEWAY_API_KEY ||
    process.env.VERCEL_OIDC_TOKEN,
);
if (!hasManagedAi) {
    failures.push('A managed AI credential or Vercel OIDC token is required; localhost Ollama is not production-capable on Vercel');
}

if (!process.env.VERCEL && process.env.AUTH_TRUST_HOST !== 'true') {
    failures.push('AUTH_TRUST_HOST must be explicitly enabled behind a trusted reverse proxy');
}

if (failures.length > 0) {
    console.error(`Production security readiness failed:\n- ${failures.join('\n- ')}`);
    process.exitCode = 1;
} else {
    console.log('Production security environment checks passed.');
}
