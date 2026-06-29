import db from './config/database.js';

export async function initSchema() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS wallets (
            player_id VARCHAR(64) PRIMARY KEY,
            balance INT NOT NULL CHECK(balance >= 0)
        );
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS inventories (
            id SERIAL PRIMARY KEY,
            player_id VARCHAR(64) REFERENCES wallets(player_id) ON DELETE CASCADE,
            item_id VARCHAR(64) NOT NULL,
            purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS claimed_rewards (
            reward_id VARCHAR(64) NOT NULL,
            player_id VARCHAR(64) REFERENCES wallets(player_id) ON DELETE CASCADE,
            PRIMARY KEY (reward_id, player_id)
        );
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS idempotency_keys (
            idempotency_key VARCHAR(256) PRIMARY KEY,
            response_code INT NOT NULL,
            response_body JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
}
