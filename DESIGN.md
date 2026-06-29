# Engineering Design Documentation

## Core Runtime & Architecture
The service is built on Node.js and Express to leverage an asynchronous, non-blocking I/O model suitable for concurrent API traffic. The entire stack is containerized using Docker and Docker Compose, ensuring identical local development and production runtime configurations.

## Datastore Selection & Crash Durability
PostgreSQL was selected as the authoritative datastore. When managing financial state and inventory, strict ACID compliance is non-negotiable to eliminate data corruption. 

Postgres relies on a Write-Ahead Logging (WAL) engine. If the process is terminated via a hard `kill -9` signal mid-transaction, uncommitted modifications are automatically rolled back upon recovery, while committed state remains completely intact. Data durability is preserved across container lifecycles via a persistent Docker volume mount on the host.

## Concurrency Control & Atomicity
To eliminate race conditions—such as a player rapidly double-tapping a purchase button—all state-mutating endpoints are executed within explicit database transactions (`BEGIN` / `COMMIT`).

Inside the transaction, we enforce strict row-level locking using a `SELECT ... FOR UPDATE` query on the target player's wallet. This serializes concurrent requests hitting the same account, forcing them to execute sequentially rather than overlapping. As a final, structural safeguard against application-layer bugs, the database schema enforces a strict physical table constraint (`CHECK(balance >= 0)`) to mechanically reject any operation that would result in a negative balance.

## Hashed Idempotency Strategy
Because the mandated API contract does not feature a dedicated `Idempotency-Key` HTTP header, the service generates a deterministic key string for every incoming mutating request. This key is derived deterministically by joining the request path with the stringified body payload:
- `credit:{playerId}:{reason}:{amount}`
- `purchase:{playerId}:{itemId}:{price}`
- `claim:{rewardId}:{playerId}`

A dedicated pre-routing middleware intercepts incoming `POST` requests and queries the `idempotency_keys` table using this generated token. If a record exists, the middleware short-circuits the request lifecycle—bypassing the core business logic completely—and instantly returns the cached status code and response payload. These keys are retained permanently to guarantee exactly-once processing during late network retries or client-side reconnection loops.
