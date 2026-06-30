import db from '../config/database.js';

async function saveIdempotency(client, key, status, body) {
    await client.query(
        'INSERT INTO idempotency_keys (idempotency_key, response_code, response_body) VALUES ($1, $2, $3)',
        [key, status, JSON.stringify(body)]
    );
}

export const claimReward = async (req, res) => {
    const { rewardId } = req.params;
    const { playerId } = req.body;

    if (!playerId) return res.status(400).json({ error: "Validation failure" });

    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        
        const walletRes = await client.query('SELECT balance FROM wallets WHERE player_id = $1', [playerId]);
        if (walletRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Wallet not found" });
        }

        try {
            await client.query('INSERT INTO claimed_rewards (reward_id, player_id) VALUES ($1, $2)', [rewardId, playerId]);
        } catch (dbErr) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: "Reward already processed" });
        }

        const resBody = { status: "claimed", rewardId };
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
