# Vercel production deployment

Qmath is configured for Vercel Functions, a remote Turso/libSQL database, private Vercel Blob exam storage, and Upstash Redis rate limiting. A local SQLite database and `uploads/` are development-only and must never be used in production.

## 1. Provision isolated services

Create separate Production and Preview resources. Never point preview deployments at student production data.

- Create a Turso database in an EU region close to the Vercel Function region. Generate a least-privilege database token.
- Create a **private** Vercel Blob store and connect it to the Vercel project.
- Create an Upstash Redis database in the same region. Qmath accepts both the
  direct Upstash `UPSTASH_REDIS_REST_*` names and Vercel Marketplace's
  `KV_REST_API_*` names.
- Configure a managed AI provider. On Vercel, Qmath routes the Anthropic SDK
  through Vercel AI Gateway using the automatically injected, short-lived
  `VERCEL_OIDC_TOKEN`. Direct `ANTHROPIC_API_KEY` credentials remain supported
  for local or BYOK deployments.

## 2. Configure Vercel environment variables

Copy the names from `.env.vercel.example` into Vercel Project Settings > Environment Variables. Scope every value explicitly to Production or Preview. Generate `AUTH_SECRET` and `AUDIT_HMAC_KEY` independently for each environment and store them only in Vercel.

Do not configure `AUTH_TRUST_HOST` on Vercel. Auth.js trusts Vercel's platform host signal. Do not set `DATABASE_URL=file:...`, `UPLOAD_DIR`, or a localhost Ollama/SymPy URL in production.

## 3. Initialize and deploy

The Vercel build runs, in order:

1. `npm run security:readiness`
2. `npm run db:migrate:production`
3. `npm run build`

The production migration stream is isolated in `db/production-migrations/`; do not substitute the legacy `db/migrations/` directory. Deploy previews with their own Turso credentials so their migration build cannot modify production.

Connect the Git repository to Vercel or deploy with `vercel --prod`. The project uses Node.js 22 and `npm ci` as declared in `package.json` and `vercel.json`.

## 4. Release verification

- Confirm `GET /api/health` returns `{"status":"ok"}` over HTTPS.
- Register and authenticate a non-production test student; verify the session cookie is `__Host-qmath_session`, `Secure`, `HttpOnly`, and `SameSite=Lax`.
- Verify a student receives 403 for admin APIs and cannot retrieve an exam they are not authorized to view.
- As an admin, upload a PDF larger than 4.5 MB and confirm the browser uploads directly to private Blob storage.
- Replace and delete a test exam; confirm obsolete Blob objects are removed.
- Trigger login and API rate limits and confirm Upstash counters and structured security events are present.
- Confirm Vercel logs do not contain credentials, raw email addresses, PDF contents, prompts, or Blob tokens.

## 5. Operational controls

- Protect the production branch and require `npm test`, `npm run lint`, `npm run security:static`, and `npm run build` in CI.
- Require Vercel deployment protection for previews containing realistic data.
- Rotate database, Blob, Redis, AI, auth, and audit secrets on a documented schedule and immediately after suspected exposure.
- Enable Vercel log drains to the SIEM and alert on authentication failures, rate-limit store failures, admin mutations, role changes, and health-check failures.
- Back up Turso and test restoration quarterly. Retention and deletion must follow the institution's student-record policy and GDPR obligations.
