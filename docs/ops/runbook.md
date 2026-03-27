# On-Call Runbook: Fading Steps System

## Alert Response Procedures

### Alert 1: High Latency on `/api/check-step` (p95 > 300ms)

**Severity:** Medium

**Detection:**
```
Monitoring alert: API latency exceeds 300ms
Typical causes: Database, SymPy, or network issue
```

**Response Steps:**

1. **Verify alert is real (not fluke)**
   ```bash
   curl -w "Time: %{time_total}s\n" -X POST \
     https://app.example.com/api/check-step \
     -H "Content-Type: application/json" \
     -d '{"stepId":"test","questionId":"test","topicId":"test","studentInput":"x"}'

   # Expected: <300ms
   ```

2. **Check database query latency**
   ```bash
   # SSH into database server
   psql -U prod -d qmath -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 5;"

   # Look for queries with mean_exec_time > 100ms
   ```

3. **Check SymPy sidecar health**
   ```bash
   curl -i http://sympy-sidecar.internal:8001/health

   # Expected: 200 OK
   # If not, restart sidecar or scale up instances
   ```

4. **Check database connections**
   ```bash
   psql -U prod -d qmath -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

   # If > 80% of max_connections, increase pool or kill idle sessions
   ```

5. **Check network latency**
   ```bash
   ping sympy-sidecar.internal
   # Expected: < 10ms (same network)
   ```

**Mitigation:**
- Kill long-running queries: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE query_start < NOW() - INTERVAL '10 min';`
- Scale up SymPy sidecar: `kubectl scale deployment sympy-sidecar --replicas=10`
- Increase database connection pool (requires app restart)

**Escalation:**
- If latency persists > 10 minutes, page senior on-call engineer
- Consider disabling fading steps feature flag (temporary measure)

---

### Alert 2: Rate Limit Spike (429 errors spike 10x)

**Severity:** Medium (possible attack)

**Detection:**
```
Monitoring alert: 429 error rate spikes to >5% of requests
Typical causes: Brute-force attempt, bot, or load test
```

**Response Steps:**

1. **Acknowledge alert and notify security team**
   ```
   Message: "Possible rate limit attack detected. Investigating."
   ```

2. **Identify the attacker**
   ```bash
   # Check application logs for spike in 429 errors
   tail -f /var/log/qmath/app.log | grep "429\|RateLimit"

   # Look for patterns:
   # - Single user ID submitting many requests
   # - Multiple user IDs from same IP
   # - Repetitive payloads (same question, different answers)
   ```

3. **Check Redis memory (if using Redis for rate limiting)**
   ```bash
   redis-cli INFO memory

   # If memory > 1GB, we might have memory leak
   # Check key count: DBSIZE
   ```

4. **Temporary mitigation:**
   ```bash
   # Option A: Increase rate limit temporarily (not recommended)
   # env: RATE_LIMIT_PER_MINUTE=40

   # Option B: IP-based rate limiting (at load balancer level)
   # nginx: limit_req_zone $binary_remote_addr zone=attack:10m rate=5r/m;

   # Option C: Block offending IP (if clear attack)
   # SSH into load balancer:
   # iptables -I INPUT -s 192.168.1.100 -j DROP
   ```

5. **Investigate root cause**
   ```bash
   # Get list of most active user IDs
   tail -1000 /var/log/qmath/app.log | grep "429" | cut -d' ' -f8 | sort | uniq -c | sort -rn | head -10

   # Check if legitimate (bulk grading task, broken client?)
   # or malicious (automated script, brute force)
   ```

**Recovery:**
- Remove IP block if legitimate traffic identified
- Monitor for 30 minutes post-incident
- Review logs: `grep "429" /var/log/qmath/app.log | wc -l`

**Escalation:**
- If sustained > 30 minutes: contact infrastructure team
- If DDoS level: activate DDoS mitigation service (Cloudflare, AWS Shield)

---

### Alert 3: Redis Connection Failure (Rate Limit Down)

**Severity:** Low (graceful fallback)

**Detection:**
```
Monitoring alert: Redis latency > 5 seconds or connection refused
Fallback: App automatically falls back to in-memory rate limiting
Impact: Brief period of looser rate limiting (acceptable tradeoff)
```

**Response Steps:**

1. **Verify Redis is down**
   ```bash
   redis-cli ping

   # Expected: PONG
   # If timeout/refused: Redis is down
   ```

2. **Check Redis logs**
   ```bash
   tail -f /var/log/redis/redis-server.log

   # Look for OOM (out of memory), crash, or connection errors
   ```

3. **Restart Redis** (if self-hosted)
   ```bash
   systemctl restart redis-server
   # or
   kubectl rollout restart deployment redis
   ```

4. **If using Upstash (managed Redis):**
   ```bash
   # Check Upstash dashboard for incident status
   # Usually auto-recovers within 5 minutes
   # Contact Upstash support if > 15 minutes down
   ```

5. **Monitor app behavior**
   ```bash
   # App should still work (using in-memory fallback)
   # But data is lost on app restart

   # Check app logs for fallback message:
   tail -f /var/log/qmath/app.log | grep "fallback"
   ```

**Recovery:**
- Once Redis is back, rate limit state resets (acceptable)
- Monitor for 10 minutes to ensure stability

**Escalation:**
- If Redis down > 30 minutes: escalate to infrastructure on-call

---

### Alert 4: SymPy Sidecar Timeout (CAS Grading Tier 2 Failing)

**Severity:** Low (Tier 1 fallback works)

**Detection:**
```
Monitoring alert: SymPy timeout rate > 1%
Typical causes: High CPU, slow network, or crash
Impact: Some complex answers incorrectly marked as wrong
       (but simple answers still work via Tier 1)
```

**Response Steps:**

1. **Check SymPy sidecar health**
   ```bash
   curl -i http://sympy-sidecar:8001/health

   # Expected: 200 OK with response time < 100ms
   ```

2. **Check sidecar CPU/memory**
   ```bash
   kubectl top pod sympy-sidecar-xxx

   # If CPU > 90% or memory > 80%, scale up
   ```

3. **Scale up SymPy instances**
   ```bash
   kubectl scale deployment sympy-sidecar --replicas=10

   # Should reduce queue time and timeouts
   ```

4. **Check network latency**
   ```bash
   ping sympy-sidecar
   # Expected: < 10ms

   # If > 50ms, network issue — contact infrastructure
   ```

5. **Monitor timeout rate**
   ```bash
   # Check logs for timeout events
   tail -f /var/log/qmath/app.log | grep "SymPy timeout\|Tier 2 failed"

   # Should drop below 1% within 5 minutes of scaling
   ```

**Mitigation:**
- Temporarily increase timeout from 4s to 6s (env: `SYMPY_TIMEOUT_MS=6000`)
  - Not ideal, but prevents more false negatives
- Reduce load: temporarily disable Tier 2 for non-critical questions

**Recovery:**
- Once sidecar back: scale back down
- Investigate root cause (OOM? CPU spike? Network?)

**Escalation:**
- If timeout rate remains > 5%: page senior engineer
- Consider upgrading sidecar instance type

---

## Debugging Common Issues

### Issue: Student's mastery score seems wrong

**Diagnosis:**

1. **Fetch current mastery from DB**
   ```bash
   psql -U prod -d qmath -c "SELECT masteryProbability FROM user_mastery WHERE user_id='USER_ID' AND topic_id='TOPIC_ID';"
   ```

2. **Check recent submission history**
   ```bash
   psql -U prod -d qmath -c "SELECT timestamp, is_correct, partial_score FROM attempt_logs WHERE user_id='USER_ID' ORDER BY timestamp DESC LIMIT 20;"
   ```

3. **Manually verify BKT calculation**
   ```typescript
   // From lib/adaptive-engine/knowledge-tracing.ts
   // If mastery was 0.1, student answered correctly:

   const pGuess = 0.25;
   const pSlip = 0.1;
   const pCorrectGivenLearned = 1 - pSlip; // 0.9
   const pCorrectGivenNotLearned = pGuess; // 0.25

   const numerator = 0.1 * 0.9; // 0.09
   const denominator = 0.1 * 0.9 + 0.9 * 0.25; // 0.09 + 0.225 = 0.315

   const newMastery = 0.09 / 0.315 = 0.286 ✓
   ```

4. **Check for stuck state**
   ```bash
   # If student has 50+ correct answers but mastery < 0.5, something is wrong
   psql -U prod -d qmath -c "
     SELECT COUNT(*), SUM(is_correct) FROM attempt_logs
     WHERE user_id='USER_ID' AND topic_id='TOPIC_ID';
   "
   ```

**Fix (if wrong):**
- Manually reset mastery: `UPDATE user_mastery SET masteryProbability=0.1 WHERE user_id='USER_ID' AND topic_id='TOPIC_ID';`
- Have student re-answer a few questions to rebuild correct state

---

### Issue: Fading steps not showing/hiding correctly

**Diagnosis:**

1. **Check mastery level**
   ```bash
   psql -U prod -d qmath -c "SELECT masteryProbability FROM user_mastery WHERE user_id='USER_ID' AND topic_id='TOPIC_ID';"
   ```

2. **Verify fade phase**
   ```typescript
   // lib/math/fade-logic.ts
   const mastery = 0.45;
   if (mastery < 0.35) console.log('Phase 1');
   else if (mastery < 0.55) console.log('Phase 2'); // ← should be here
   else if (mastery < 0.75) console.log('Phase 3');
   else console.log('Phase 4');
   ```

3. **Check steps are in order**
   ```bash
   psql -U prod -d qmath -c "SELECT step_number, instruction FROM question_steps WHERE question_id='Q_ID' ORDER BY step_number;"

   # Must be sequential: 1, 2, 3, 4, 5...
   ```

4. **Test fade function locally**
   ```typescript
   import { getRevealedSteps } from '@/lib/math/fade-logic';

   const steps = [...]; // fetch from DB
   const mastery = 0.45;
   const revealed = getRevealedSteps(steps, mastery);

   console.log(revealed.map(s => ({ step: s.stepNumber, revealed: s.revealed })));
   // Should show: [{step: 1, revealed: true}, {step: 2, revealed: true}, {step: 3, revealed: false}, ...]
   ```

**Fix:**
- Ensure steps are numbered 1, 2, 3, ... in database
- If wrong, manually reorder: `UPDATE question_steps SET step_number=X WHERE id='STEP_ID';`

---

### Issue: Student says their answer should be correct but was marked wrong

**Diagnosis:**

1. **Check what was submitted**
   ```bash
   psql -U prod -d qmath -c "SELECT student_answer_raw, feedback_code FROM attempt_logs WHERE user_id='USER_ID' AND question_id='Q_ID' ORDER BY timestamp DESC LIMIT 1;"
   ```

2. **Check correct answer**
   ```bash
   psql -U prod -d qmath -c "SELECT correct_answer FROM question_steps WHERE id='STEP_ID';"
   ```

3. **Test grading locally**
   ```typescript
   import { gradeAnswer } from '@/lib/math/cas-grader';
   import { preParseInput } from '@/lib/math/pre-parser';

   const parsed = preParseInput("x^2+2x+1");
   const result = await gradeAnswer(parsed, "(x+1)^2", { ignoreConstant: false });

   console.log(result.isCorrect); // Should be true (symbolic equivalence)
   ```

4. **Check if SymPy sidecar was involved**
   ```bash
   psql -U prod -d qmath -c "SELECT symbolically_checked FROM attempt_logs WHERE id='ATTEMPT_ID';"

   # If true: SymPy was needed (Tier 2)
   # If false: math.js was enough (Tier 1)
   ```

**Possible causes:**
- Student's form is mathematically different (e.g., integrated incorrectly)
- SymPy sidecar timed out → Tier 1 result used
- Input normalization didn't work as expected

**Fix:**
- If genuinely equivalent, update `correct_answer` to student's form
- Or, adjust question stem to clarify expected form

---

## Manual Testing: Grading a Specific Answer

**Test locally without submitting to production:**

```typescript
// test-grade.ts
import { gradeAnswer } from '@/lib/math/cas-grader';
import { preParseInput } from '@/lib/math/pre-parser';

async function testGrade(studentInput: string, correctAnswer: string) {
  const parsed = preParseInput(studentInput);
  const result = await gradeAnswer(parsed, correctAnswer, {
    ignoreConstant: true, // For integrals
    variables: ['x'],
    tolerance: 1e-6,
  });

  console.log('Parsed Student Input:', parsed);
  console.log('Correct Answer:', correctAnswer);
  console.log('Is Correct:', result.isCorrect);
  console.log('Partial Score:', result.partialScore);
  console.log('Symbolically Checked:', result.symbolicallyChecked);
}

testGrade('(x+1)^2', 'x^2+2x+1'); // Should be true
testGrade('x^2', 'x^2+2x+1');      // Should be false
```

**Run:**
```bash
tsx test-grade.ts
```

---

## Resetting Student Mastery (For Testing/Correction)

**⚠️ Use sparingly; only when mastery is provably wrong.**

1. **Reset to initial state**
   ```bash
   psql -U prod -d qmath -c "
     UPDATE user_mastery
     SET masteryProbability = 0.1
     WHERE user_id = 'USER_ID' AND topic_id = 'TOPIC_ID';
   "
   ```

2. **Reset and mark as never practiced**
   ```bash
   psql -U prod -d qmath -c "
     DELETE FROM user_mastery
     WHERE user_id = 'USER_ID' AND topic_id = 'TOPIC_ID';
   "
   ```

3. **Verify reset**
   ```bash
   psql -U prod -d qmath -c "SELECT masteryProbability FROM user_mastery WHERE user_id='USER_ID' AND topic_id='TOPIC_ID';"

   # Should return 0.1 (next API call will create row)
   ```

---

## Emergency: Disable Fading Steps for a Question

**If a question has a bug (incorrect correct answer, broken CAS grading, etc.):**

1. **Quick fix: Mark question as not published**
   ```bash
   psql -U prod -d qmath -c "
     UPDATE questions
     SET is_published = false
     WHERE id = 'QUESTION_ID';
   "
   ```
   - Students won't see it
   - No mastery updates
   - Safe fallback

2. **Disable CAS grading for one question** (if supported)
   ```bash
   # Set question type to non-CAS
   psql -U prod -d qmath -c "
     UPDATE questions
     SET question_type = 'guided_steps'
     WHERE id = 'QUESTION_ID';
   "
   ```

3. **Fix question and re-enable**
   - Correct the `correct_answer` in the database
   - Test locally
   - Set `is_published = true`

---

## Escalation Path

```
Level 1: On-call Engineer
├─ Responds to alerts
├─ Diagnoses issues using runbook
└─ Escalates to Level 2 if unable to resolve in 15 min

Level 2: Senior Engineer
├─ Available for complex issues
├─ Can approve emergency changes
└─ Escalates to Level 3 for infrastructure

Level 3: Infrastructure Team
├─ Database scaling
├─ Redis/SymPy cluster issues
└─ Network/security incidents
```

**Contact on-call:**
```bash
# Depends on your incident management system
# Example:
PagerDuty: https://pagerduty.com/...
Slack: @on-call-dev
Phone: [emergency number]
```

---

## Key Contacts

| Role | Contact | Availability |
|------|---------|---|
| Primary On-Call | @on-call-dev | 24/7 |
| Secondary | [Backup] | 24/7 |
| SymPy Sidecar Owner | [Engineer] | During business hours |
| Database Admin | [DBA] | During business hours |
| Security Team | security@example.com | 24/7 (escalation) |

---

## See Also

- **Deployment Guide:** [`/docs/ops/deployment.md`](../ops/deployment.md)
- **Architecture:** [`/docs/dev/architecture.md`](../dev/architecture.md)
- **API Reference:** [`/docs/api/check-step.md`](../api/check-step.md)
