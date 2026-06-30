import db from '../config/database.js';

async function saveIdempotency(client, key, status, body) {
    await client.query(
        'INSERT INTO idempotency_keys (idempotency_key, response_code, response_body) VALUES ($1, $2, $3)',
        [key, status, JSON.stringify(body)]
    );
}

export const getWallet = async (req, res) => {
    const { playerId } = req.params;
    try {
        const walletRes = await db.query('SELECT balance FROM wallets WHERE player_id = $1', [playerId]);
        const balance = walletRes.rows.length > 0 ? walletRes.rows[0].balance : 0;
        
        const itemsRes = await db.query('SELECT item_id FROM inventories WHERE player_id = $1', [playerId]);
        const rewardsRes = await db.query('SELECT reward_id FROM claimed_rewards WHERE player_id = $1', [playerId]);

        res.json({
            balance,
            inventory: itemsRes.rows.map(i => i.item_id),
            claimedRewards: rewardsRes.rows.map(r => r.reward_id)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const creditWallet = async (req, res) => {
    const { playerId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0 || !reason) {
        return res.status(400).json({ error: "Validation failure" });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        await client.query(`
            INSERT INTO wallets (player_id, balance) VALUES ($1, $2)
            ON CONFLICT(player_id) DO UPDATE SET balance = wallets.balance + EXCLUDED.balance
        `, [playerId, amount]);

        const walletRes = await client.query('SELECT balance FROM wallets WHERE player_id = $1', [playerId]);
        const resBody = { status: "success", newBalance: walletRes.rows[0].balance };
        
        await saveIdempotency(client, req.idempotencyKey, 200, resBody);
        await client.query('COMMIT');
        res.json(resBody);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

export const purchaseItem = async (req, res) => {
    const { playerId } = req.params;
    const { itemId, price } = req.body;

    if (!itemId || !price || typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ error: "Validation failure" });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        
        // CRITICAL: FOR UPDATE applies the row-level exclusive lock to isolate race conditions
        const walletRes = await client.query('SELECT balance FROM wallets WHERE player_id = $1 FOR UPDATE', [playerId]);

        if (walletRes.rows.length === 0 || walletRes.rows[0].balance < price) {
            await client.query('ROLLBACK');
            return res.status(422).json({ error: "Insufficient funds" });
        }

        await client.query('UPDATE wallets SET balance = balance - $1 WHERE player_id = $2', [price, playerId]);
        await client.query('INSERT INTO inventories (player_id, item_id) VALUES ($1, $2)', [playerId, itemId]);

        const resBody = { status: "purchased", itemId };
        await saveIdempotency(client, req.idempotencyKey, 200, resBody);
        
        await client.query('COMMIT');
        res.json(resBody);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};
