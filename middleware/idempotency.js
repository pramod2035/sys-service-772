import db from '../config/database.js';

export default async (req, res, next) => {
    if (req.method !== 'POST') return next();

    const payloadKey = `${req.path}:${JSON.stringify(req.body)}`;
    req.idempotencyKey = payloadKey;

    try {
        const result = await db.query('SELECT * FROM idempotency_keys WHERE idempotency_key = $1', [payloadKey]);
        if (result.rows.length > 0) {
            const record = result.rows[0];
            return res.status(record.response_code).json(record.response_body);
        }
        next();
    } catch (err) {
        res.status(500).json({ error: "System idempotency evaluation failure" });
    }
};
