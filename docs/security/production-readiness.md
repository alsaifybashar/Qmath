# Production security readiness

The application now enforces strict request schemas, Auth.js-only identity,
Argon2id credential hashing, stateless-session revocation, course-scoped RBAC,
server-authoritative grading, distributed rate limiting, structured security
events, CSP/security headers, safe mathematical expression evaluation, a
durable Turso/libSQL data layer, and private Vercel Blob exam storage.

## Required deployment configuration

- `AUTH_SECRET`: random secret of at least 32 characters; rotate through the
  platform secret manager, never through source control.
- `AUDIT_HMAC_KEY`: separate random key used only to pseudonymize identifiers in
  security events.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: required in
  production. Authentication, grading, AI, and administration fail closed when
  the distributed limiter is unavailable.
- `AUTH_TRUST_HOST=true` only when the reverse proxy overwrites `Host` and all
  forwarded headers. Vercel is detected explicitly.
- `TRUST_PROXY_IP_HEADER=true` only when the proxy overwrites `X-Real-IP`.
- `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`: remote durable libSQL storage;
  preview and production must use separate databases.
- `BLOB_READ_WRITE_TOKEN`: a private Vercel Blob store. PDF uploads go directly
  from the browser using constrained, short-lived tokens and are verified by
  MIME type, size, namespace, and magic bytes before the URL is persisted.

Run `npm run security:readiness` with the production environment loaded. A
non-zero result is a deployment stop.

## SIEM contract

Security events are one-line JSON records with `@timestamp`, `schema_version`,
`event.category`, `event.action`, `event.outcome`, severity, pseudonymous actor,
resource and source identifiers, request correlation, and deployment version.
The log collector must route stdout JSON to the SIEM without reformatting.

Alert at minimum on:

- repeated `authentication/login` failures or rate-limit denials;
- authorization denials across multiple course resources;
- `rate_limit` store failures (critical because protected operations fail
  closed);
- admin role, user, API-key, or course-assignment changes;
- session-version mismatches and anomalous access volume.

Passwords, reset tokens, cookies, raw IP addresses, email addresses, student
answers, API keys, and exception stacks must never be included in security
events. Retention and access must follow the institution's privacy policy.

## Mandatory release gate

1. `npm run security:static`
2. `npx tsc --noEmit`
3. `npm test`
4. `npm run build`
5. `npm audit --omit=dev` (zero findings; the current production dependency
   graph is zero across all severities)
6. Apply `npm run db:migrate:production` to each remote database and verify a
   tested backup/restore procedure. Existing local development databases still
   use `npm run db:migrate:security`.
7. Execute authenticated BOLA/RBAC tests for student, professor, and admin,
   CSRF tests, login throttling tests, and an OWASP ZAP baseline scan against a
   production-like environment.

## Explicit production blockers

- Password-reset delivery is not yet connected to a transactional email or
  institutional identity provider. Do not advertise reset email delivery until
  a single-use, hashed, expiring token flow is implemented and tested.
- MFA/passkeys are not implemented. Require institutional OIDC/SAML MFA or add
  WebAuthn before granting production administrator access.
- `next-auth` remains a beta dependency. Pin and review every upgrade, or move
  to a stable supported identity-provider integration before final approval.

Use OWASP ASVS 5.0 Level 2 as the acceptance baseline, with Level 3 controls
for administrator functions and academic-record integrity. Map dynamic testing
to the OWASP Web Security Testing Guide and API Security Top 10.
