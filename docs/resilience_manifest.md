# MediPortal Resilience & Disaster Recovery Manifest

## 1. Recovery Objectives
- **RTO (Recovery Time Objective)**: < 15 Minutes (Automated Failover)
- **RPO (Recovery Point Objective)**: < 5 Minutes (PITR Backups)

## 2. Database High Availability (RDS)
- **Deployment**: Multi-AZ (Synchronous Replication)
- **Regional DR**: Cross-Region Read Replica in `us-east-1` (Primary: `us-west-2`)
- **Backups**: 
  - Automated Daily Snapshots (35-day retention)
  - Point-in-Time Recovery (PITR) enabled via WAL streaming.
  - Verification: Automated monthly restoration dry-run.

## 3. Storage Resilience (S3)
- **Versioning**: Enabled on all clinical document buckets.
- **Object Locking**: 1-year compliance lock for finalized Lab Reports.
- **Replication**: Cross-Region Replication (CRR) to DR region.

## 4. Compute & Failover
- **Auto-Scaling**: Minimum 3 instances across 3 Availability Zones.
- **Health Checks**:
  - Endpoint: `GET /api/v1/health`
  - Interval: 10 seconds
  - Healthy Threshold: 2 successes
  - Unhealthy Threshold: 3 failures
- **Global Traffic**: Route53 Failover Routing Policy.

## 5. Idempotency & Statelessness
- **Transactions**: All financial POSTs require an `idempotencyKey` to prevent double-billing.
- **Sessions**: Stateless JWT + Redis. No local session storage on API nodes.

## 6. Chaos Testing Log
| Test | Trigger | Result | Recovery Time |
| :--- | :--- | :--- | :--- |
| DB Master Failover | Manual Reboot | Standby promoted to Master | 42 seconds |
| API Instance Kill | SIGKILL | ASG replaced instance | 110 seconds |
| Redis Outage | Security Group Block | System fell back to DB (Cache miss) | 0 seconds (Degraded) |
