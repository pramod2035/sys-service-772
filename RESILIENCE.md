# Distributed Systems Resilience Analysis

## Part 1: Decoupled Inventory Microservice Architecture
Moving the inventory grant mechanic to an external, network-isolated microservice introduces partial failure windows where local database transactions can no longer guarantee atomic consistency. If the remote service times out or crashes mid-purchase, data divergence can occur. 

To achieve end-to-end exactly-once execution across this distributed boundary, I would implement the Transactional Outbox Pattern paired with an Idempotent Saga model:

1. **Atomic State Execution:** When a purchase request is initiated, the Wallet Service opens a local database transaction. It deducts the player's balance and writes an event payload (e.g., `OrderPending`) into a local `outbox` table within the exact same atomic database transaction.
2. **Reliable Event Dispatcher:** A separate background worker reads the outbox table sequentially and transmits the grant request to the external Inventory Service via HTTP, passing the unique outbox transaction ID as an explicit idempotency token.
3. **Deduplication under Network Stress:** If the network link fails or times out, the dispatcher retries the request using exponential backoff. Because the Inventory Service relies on the passed token to enforce idempotency, duplicate network packets are safely deduplicated, ensuring zero double-grants. Once a valid acknowledgment is received, the outbox entry is safely cleared.

## Part 2: Historical Double-Grant Defect Remediation
To safely isolate and correct a production bug that caused duplicate currency credits last week without inducing system downtime, I would execute a dual-phase remediation protocol:

### 1. Verification & Audit Phase
I would execute an offline analytical query that compares every player's current runtime balance against an aggregate total of an immutable, append-only historical transaction ledger (sum of validated credits minus validated debits):

```sql
SELECT player_id, current_balance, calculated_balance 
FROM (
    SELECT w.player_id, w.balance AS current_balance, 
           (COALESCE(SUM(c.amount), 0) - COALESCE(SUM(p.price), 0)) AS calculated_balance
    FROM wallets w
    LEFT JOIN ledger_credits c ON w.player_id = c.player_id
    LEFT JOIN ledger_purchases p ON w.player_id = p.player_id
    GROUP BY w.player_id
) audit_query 
WHERE current_balance != calculated_balance;
```

### 2. Live Reconciliation
Using the identified list of anomalous accounts, I would issue a corrective reconciliation entry directly to the ledger with a negative delta matching the duplicate value. If applying this correction forces a player's balance below zero, the ledger records the deficit cleanly, and a temporary safety flag inside the wallet controller blocks subsequent outbox purchases until future gameplay earnings naturally clear the balance deficit.
