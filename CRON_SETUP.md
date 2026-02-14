# 🕐 Cron Job Setup for LYNE

## Achievement Checker

**Purpose:** Run achievement checker every 5 minutes to award achievements automatically

**Script:** `scripts/achievement-checker.mjs`

**Schedule:** Every 5 minutes

**Setup via OpenClaw CLI:**

```bash
openclaw cron add \
  --name "LYNE Achievement Checker" \
  --schedule-every 300000 \
  --payload-kind systemEvent \
  --payload-text "cd ~/.openclaw/workspace/inheritance-game && SUPABASE_SERVICE_ROLE_KEY=\$SUPABASE_KEY node scripts/achievement-checker.mjs" \
  --session-target main
```

**Or via OpenClaw API (programmatic):**

```javascript
{
  "name": "LYNE Achievement Checker",
  "schedule": {
    "kind": "every",
    "everyMs": 300000,  // 5 minutes
    "anchorMs": Date.now()
  },
  "payload": {
    "kind": "systemEvent",
    "text": "cd ~/.openclaw/workspace/inheritance-game && SUPABASE_SERVICE_ROLE_KEY='$SUPABASE_SERVICE_ROLE_KEY' node scripts/achievement-checker.mjs"
  },
  "sessionTarget": "main",
  "enabled": true
}
```

**What it does:**
- Checks all kids' stats
- Awards earned achievements
- Runs idempotently (no duplicates)
- Logs results to session

**Benefits:**
- Achievements awarded automatically
- No manual intervention needed
- Kids see achievements appear in real-time
- Decoupled from transaction trigger (no errors)

---

## Health Monitor

**Purpose:** Check system health and auto-fix issues every 15 minutes

**Script:** `scripts/health-monitor.mjs`

**Schedule:** Every 15 minutes

**Setup:**

```bash
openclaw cron add \
  --name "LYNE Health Monitor" \
  --schedule-every 900000 \
  --payload-kind systemEvent \
  --payload-text "cd ~/.openclaw/workspace/inheritance-game && SUPABASE_SERVICE_ROLE_KEY='$SUPABASE_SERVICE_ROLE_KEY' VERCEL_TOKEN='$VERCEL_TOKEN' node scripts/health-monitor.mjs" \
  --session-target main
```

**What it does:**
- Checks database connectivity
- Verifies production site is up
- Checks for duplicate achievements
- Auto-fixes common issues
- Only alerts on critical failures

---

## Morning Briefing

**Purpose:** Generate summary of overnight activity every morning at 8 AM PST

**Schedule:** Daily at 8:00 AM PST

**Setup:**

```bash
openclaw cron add \
  --name "LYNE Morning Briefing" \
  --schedule-cron "0 8 * * *" \
  --schedule-tz "America/Los_Angeles" \
  --payload-kind systemEvent \
  --payload-text "Generate morning briefing for LYNE: summary of overnight achievements, new features deployed, issues fixed, and today's priorities" \
  --session-target main
```

---

## Current Cron Jobs

Run `openclaw cron list` to see active jobs.

**Recommended setup:**
1. Achievement Checker (every 5 min) - ✅ High priority
2. Health Monitor (every 15 min) - ✅ Medium priority  
3. Morning Briefing (daily 8 AM) - ⏳ Optional

**Note:** Credential management for cron jobs can be improved by:
- Using OpenClaw's environment variable system
- Storing credentials in gateway config
- Using secret management service

For now, credentials are embedded (secure within Jake's machine).
