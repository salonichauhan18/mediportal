# MediPortal War Room Protocol: The First 24 Hours

This protocol defines the strict monitoring and response strategy for the critical 24-hour period immediately following the production go-live of the MediPortal Enterprise ecosystem.

## 1. The "Vital Signs" Dashboard

### API Health
- **Metric**: `GET /api/v1/health` status.
- **Cadence**: Automated ping every 60 seconds.
- **Trigger**: Any non-200 response or a response taking > 2 seconds.
- **Action**: Verify AWS ALB metrics to determine if the issue is application-level or network-level. If CPU > 85%, allow Auto-Scaling to trigger.

### Error Spikes
- **Metric**: HTTP `500 Internal Server Error` bursts.
- **Cadence**: Real-time log tailing (CloudWatch/Datadog).
- **Trigger**: > 10 `500` errors in a 5-minute window.
- **Action**: Check `HttpExceptionFilter` logs for the raw stack trace. Correlate with recent deployments or specific module traffic (e.g., FHIR payloads).

### Socket.io Heartbeat
- **Metric**: Active WebSocket connections.
- **Cadence**: Continuous monitoring.
- **Trigger**: Connection drops not correlated with user logout, or active connections falling significantly below active browser sessions.
- **Action**: Inspect NGINX/ALB "Sticky Sessions" configuration. Check Redis Pub/Sub adapter for dropped messages or connection limits.

## 2. Database & AI Watch

### Query Latency
- **Metric**: Prisma query duration.
- **Cadence**: Continuous log monitoring.
- **Trigger**: The system logs a `[WARN] Query Latency Spike` for any database operation exceeding `100ms`.
- **Action**: Immediately run `EXPLAIN ANALYZE` on the offending query. Add composite indexes if the issue is a sequential scan on a large table (e.g., `Appointment` or `Invoice`).

### AI Scrubber Integrity
- **Metric**: `ClinicalAiLog` anonymization success rate.
- **Cadence**: Hourly review.
- **Trigger**: Discovery of any unmasked names, addresses, or identifiers in the `prompt` field.
- **Action**: Immediately isolate the specific prompt, update the `AiAnonymizer` regex patterns, and purge the leaked record from the database. Treat as a Sev-1 security incident.

### Transaction Consistency
- **Metric**: Financial vs. Inventory parity.
- **Cadence**: Post-automation run / End-of-Day.
- **Trigger**: `Transaction` table total revenue does not align with the value derived from `InventoryAudit` stock reductions and service billing.
- **Action**: Cross-reference `idempotencyKey` entries to ensure no double-billing occurred. Investigate the specific invoice items causing the discrepancy.

## 3. The Timeline

### T+2 Hours: Background Job Verification
- **Objective**: Ensure cron jobs and async tasks are running.
- **Action**: Verify that RPM Anomaly Detection is triggering successfully on scheduled intervals without overwhelming the Gemini API. Check Dead Letter Queues (DLQ) for failed FHIR webhook dispatches.

### T+12 Hours: Memory & Resource Leak Check
- **Objective**: Verify Node.js process stability.
- **Action**: Check the `MemoryHealthIndicator` (`memory_heap`) via the `/health` endpoint. If memory usage shows a continuous upward trend without plateauing (exceeding 1GB), initiate a rolling restart of API instances and investigate WebSocket or Prisma connection leaks.
