# Deployment & Operations Guide

## Prerequisites

### Node.js
- **Minimum:** 18.17.0
- **Recommended:** 20.x LTS or 22.x
- **Check:** `node --version`

### PostgreSQL (Production)
- **Minimum:** 14.x
- **Recommended:** 15.x or 16.x
- **Production setup:** High-availability cluster (primary + replicas)
- **Check:** `psql --version`

**Note:** Development uses SQLite (`better-sqlite3`), but production requires PostgreSQL for horizontal scaling.

### Redis (Production)
- **Minimum:** 6.x
- **Recommended:** 7.x
- **Managed:** Upstash Redis (if cloud-hosted)
- **Standalone:** Self-hosted Redis cluster for on-premises

**Note:** Development uses in-memory rate limiting; production uses Redis for shared state.

### SymPy Sidecar (For CAS Grading Tier 2)
- **Docker:** `sympy-sidecar:latest` (internal image)
- **Port:** 8001 (default, configurable via `SYMPY_SIDECAR_URL`)
- **Timeout:** 4 seconds per request

**Note:** Tier 1 (math.js) works without sidecar; Tier 2 is optional.

## Environment Variables

Create a `.env.local` file (never commit to git):

```bash
# ============================================================================
# DATABASE
# ============================================================================

# SQLite (development only)
DATABASE_URL="file:./qmath.db"

# PostgreSQL (production)
# DATABASE_URL="postgresql://user:password@host:5432/qmath"
# DATABASE_URL_REPLICA="postgresql://user:password@read-replica-host:5432/qmath"

# ============================================================================
# AUTHENTICATION
# ============================================================================

JWT_SECRET="your-random-secret-key-min-32-chars"  # Min 32 chars for security
NEXTAUTH_URL="http://localhost:3000"  # Dev: localhost, Prod: your domain
NEXTAUTH_SECRET="another-random-secret-min-32-chars"

# ============================================================================
# RATE LIMITING & CACHING (PRODUCTION ONLY)
# ============================================================================

# Optional: For production, use Upstash Redis
# UPSTASH_REDIS_REST_URL="https://YOUR_REGION.upstash.io"
# UPSTASH_REDIS_REST_TOKEN="YOUR_TOKEN"

# OR self-hosted Redis:
# REDIS_URL="redis://localhost:6379"

# ============================================================================
# CAS GRADING
# ============================================================================

# Location of SymPy sidecar (Tier 2 CAS grader)
SYMPY_SIDECAR_URL="http://localhost:8001"

# ============================================================================
# LOGGING & MONITORING
# ============================================================================

LOG_LEVEL="info"  # debug, info, warn, error
SENTRY_DSN="https://your-sentry-dsn@sentry.io/PROJECT_ID"  # Optional

# ============================================================================
# FEATURE FLAGS
# ============================================================================

ENABLE_FADING_STEPS="true"
ENABLE_CAS_GRADING="true"
```

## Database Migration Steps

### Step 1: Install Drizzle CLI

```bash
npm install -D drizzle-kit
```

### Step 2: Generate Migrations (if schema changed)

```bash
npm run db:generate
```

This creates a new migration file in `db/migrations/` based on schema changes in `db/schema.ts`.

### Step 3: Push Migrations to Database

```bash
npm run db:push
```

For production, **dry-run first:**

```bash
npm run db:push -- --dry-run
```

Review the SQL before applying.

### Step 4: Verify Schema (Optional)

```bash
npm run db:studio
```

Opens a GUI to inspect database schema and data.

### Initial Setup (New Database)

```bash
# Install dependencies
npm install

# Push schema
npm run db:push

# (Optional) Seed with test data
npm run db:seed
npm run db:seed:admin
npm run db:seed:exams
```

## Building for Production

```bash
# Install production dependencies
npm install --production

# Build Next.js
npm run build

# Start server
npm run start
```

**Output:**
- Compiled app: `.next/` directory
- Server runs on port 3000 (configurable via PORT env)

## Production Checklist

### Pre-Deployment

- [ ] **Secrets Management**
  - [ ] `JWT_SECRET` set and >= 32 characters
  - [ ] `NEXTAUTH_SECRET` set and >= 32 characters
  - [ ] `DATABASE_URL` points to production PostgreSQL
  - [ ] Secrets stored in environment, never in `.env` files
  - [ ] Never log sensitive data

- [ ] **Database**
  - [ ] PostgreSQL instance running and accessible
  - [ ] Migrations applied (`npm run db:push`)
  - [ ] Backups enabled (automated daily snapshots)
  - [ ] Read replicas deployed (for scaling)
  - [ ] Connection pooling configured (PgBouncer or app-level)

- [ ] **Rate Limiting**
  - [ ] Redis instance running (if horizontal scaling)
  - [ ] `UPSTASH_REDIS_REST_URL` and token configured
  - [ ] Rate limit: 20 requests per 60 seconds per user
  - [ ] Monitor Redis memory (should be <100MB for 5000 users)

- [ ] **CAS Grading**
  - [ ] SymPy sidecar Docker container ready (if needed)
  - [ ] `SYMPY_SIDECAR_URL` points to sidecar
  - [ ] Timeout: 4 seconds max
  - [ ] Health check: `GET /health` should return 200

- [ ] **Performance**
  - [ ] API p95 latency target: <150ms (development) or <250ms (production)
  - [ ] Database p95 query time: <50ms
  - [ ] CAS grading Tier 1 p95: <100ms
  - [ ] SymPy timeout rate: <0.1%

- [ ] **Logging & Monitoring**
  - [ ] Sentry/APM configured for error tracking
  - [ ] Structured logging enabled (JSON format)
  - [ ] Alarms set for:
    - API error rate > 1%
    - p95 latency > 300ms
    - Database connection pool > 80%
    - Rate limit spike (possible attack)
    - SymPy timeout > 1%

- [ ] **Security**
  - [ ] HTTPS enforced (all endpoints)
  - [ ] CORS configured (only allowed origins)
  - [ ] Input validation on all endpoints
  - [ ] Rate limiting enforced
  - [ ] No secrets in logs

### Post-Deployment

- [ ] **Smoke Tests**
  - [ ] Health check endpoint responds
  - [ ] Can create an account
  - [ ] Can submit an answer to a fading step question
  - [ ] Mastery updates correctly
  - [ ] Fading logic triggers at expected thresholds

- [ ] **Monitoring Dashboard**
  - [ ] API response times visible
  - [ ] Error rates tracked
  - [ ] Database connection pool status
  - [ ] Redis memory usage
  - [ ] SymPy sidecar health

## Scaling Guidance

### 100 Students (Single Instance)

**Setup:**
- 1x Next.js instance
- SQLite or single PostgreSQL instance
- In-memory rate limiting
- No caching layer needed

**Monitoring:**
```bash
# Check app memory
ps aux | grep node
# Should be < 500MB

# Check DB connections
sqlite3 qmath.db
# SQLite automatically manages
```

### 1000 Students (Multi-Instance)

**Setup:**
- 2–4 Next.js instances behind load balancer
- PostgreSQL with 1 read replica
- Redis for rate limiting (managed service like Upstash)
- SymPy sidecar scaled to 2–3 instances

**Environment:**
```bash
# Production PostgreSQL
DATABASE_URL="postgresql://prod_user:password@prod-db.example.com:5432/qmath"
DATABASE_URL_REPLICA="postgresql://prod_user:password@prod-read-replica.example.com:5432/qmath"

# Redis for rate limiting
UPSTASH_REDIS_REST_URL="https://us1-fine-badger-12345.upstash.io"
UPSTASH_REDIS_REST_TOKEN="YOUR_TOKEN"
```

**Monitoring:**
```bash
# Database connection pool
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
# Should be < 50 (4 instances * 10 connections per instance)

# Redis memory
redis-cli INFO memory
# Should be < 50MB for 1000 students

# API latency
curl -w "Response time: %{time_total}s\n" https://app.example.com/api/check-step
# Should be < 250ms p95
```

**Database Indexing:**
```sql
-- Ensure these indices exist
CREATE INDEX idx_user_mastery_user_topic
  ON user_mastery(user_id, topic_id);

CREATE INDEX idx_question_steps_question_id
  ON question_steps(question_id);

CREATE INDEX idx_attempt_logs_user_id
  ON attempt_logs(user_id);
```

### 5000 Students (Distributed)

**Setup:**
- 8–16 Next.js instances (2 per region)
- PostgreSQL primary + 2 read replicas per region
- Redis cluster (3+ nodes, managed service)
- SymPy auto-scaling group (5–10 instances)
- CDN for static assets

**Environment:**
```bash
# Multi-region PostgreSQL
# Write: primary in us-east
DATABASE_URL="postgresql://prod:pass@us-east-db.example.com:5432/qmath"

# Reads: replica in same region
DATABASE_URL_REPLICA="postgresql://prod:pass@us-east-read-replica.example.com:5432/qmath"

# Redis cluster (Upstash or self-hosted)
UPSTASH_REDIS_REST_URL="https://us-east.redis.example.com"
UPSTASH_REDIS_REST_TOKEN="TOKEN"

# SymPy load balanced
SYMPY_SIDECAR_URL="http://sympy-lb.internal:8001"
```

**Connection Pooling:**
```typescript
// app/db/drizzle.ts
import { drizzle } from 'drizzle-orm/pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,           // Max connections per instance
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool);
```

**Monitoring Targets:**
- API p95 latency: <300ms
- Database p95 query: <100ms
- Error rate: <0.5%
- Rate limit accuracy: 99.99%

## Monitoring Checklist

### Key Metrics to Track

```
API Endpoint: /api/check-step
├── Request Rate (requests/sec)
├── Response Time (p50, p95, p99)
├── Error Rate (4xx, 5xx)
└── Specific Errors
    ├── 429 (rate limit hit)
    ├── 400 (invalid input)
    └── 500 (internal error)

Database Queries
├── Connection Pool Usage
├── Query Latency (p95)
├── Slow Query Log (> 1 second)
└── Deadlocks

CAS Grading
├── Tier 1 Success Rate (should be > 95%)
├── Tier 2 Latency (avg, p95)
├── Tier 2 Timeout Rate (should be < 0.1%)
└── SymPy Sidecar Health

Rate Limiting (Redis)
├── Memory Usage
├── Hit/Miss Ratio
├── Latency (should be < 5ms)
└── Cluster Node Status

Mastery Updates
├── Update Frequency
├── BKT Computation Time
└── Cache Hit Rate (if caching)
```

### Alert Thresholds

| Alert | Threshold | Action |
|-------|-----------|--------|
| API p95 latency | >300ms | Check database, SymPy |
| Error rate spike | >1% | Page on-call, check logs |
| Rate limit spike | >10x baseline | Possible brute-force attack |
| Database pool exhausted | >80% | Increase pool or kill long queries |
| Redis down | N/A | Fall back to in-memory (graceful degrade) |
| SymPy timeout rate | >1% | Scale up sidecar instances |
| Disk space (database) | <20% remaining | Trigger backup/archival |

## Logging Best Practices

### Application Logs

```typescript
// lib/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

// In API handler
logger.info({
  event: 'check_step_submitted',
  userId,
  stepId,
  studentInput: '***', // Never log student answers
  mastery: newMastery,
  isCorrect,
  durationMs,
});
```

### Never Log

- Student answers or correct answers
- JWT tokens
- API keys or secrets
- Passwords
- Personal identifying information (PII)

### Structured Logging Example

```json
{
  "level": "info",
  "timestamp": "2026-03-27T12:34:56Z",
  "event": "check_step_success",
  "userId": "user-123",
  "topicId": "topic-456",
  "mastery": 0.45,
  "phase": 2,
  "isCorrect": true,
  "durationMs": 87,
  "sympy_checked": false,
  "rateLimit_remaining": 15
}
```

## Deployment Examples

### Docker (Recommended for Production)

**Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

**Build & Run:**
```bash
docker build -t qmath:latest .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  qmath:latest
```

### Kubernetes

**Deployment manifest:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qmath
spec:
  replicas: 4
  selector:
    matchLabels:
      app: qmath
  template:
    metadata:
      labels:
        app: qmath
    spec:
      containers:
      - name: qmath
        image: qmath:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: url
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Cloud Platform (Vercel / Netlify)

**For Vercel (Next.js native):**

```bash
npm install -g vercel
vercel --prod --env-file=.env.production
```

**Environment variables in Vercel dashboard:**
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXTAUTH_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Troubleshooting

### Issue: API responses slow (p95 > 300ms)

**Diagnosis:**
1. Check database query latency: `EXPLAIN ANALYZE` on slow queries
2. Check SymPy sidecar: `curl http://localhost:8001/health`
3. Check Redis (if used): `redis-cli --latency`

**Solutions:**
- Add database indices (see indexing section)
- Scale SymPy instances
- Verify network connectivity

### Issue: Rate limiting not working across instances

**Cause:** Still using in-memory rate limiter (not Redis)

**Fix:**
1. Set `UPSTASH_REDIS_REST_URL` environment variable
2. Update `lib/rate-limit.ts` to use Redis client
3. Restart all instances

### Issue: Mastery not updating

**Diagnosis:**
1. Check database writes: `SELECT * FROM user_mastery ORDER BY last_practiced_at DESC LIMIT 1;`
2. Check API response: does `/api/check-step` return `newMastery`?

**Solutions:**
- Verify database connectivity
- Check for permission errors (user can update row?)
- Check BKT logic in `knowledge-tracing.ts`

## See Also

- **API Reference:** [`/docs/api/check-step.md`](../api/check-step.md)
- **Architecture:** [`/docs/dev/architecture.md`](../dev/architecture.md)
- **Runbook:** [`/docs/ops/runbook.md`](../ops/runbook.md)
