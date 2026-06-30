import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// REPLACE 'YOUR_ACTUAL_PASSWORD' with the password you type to open pgAdmin 4
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Pomu2035@localhost:5432/game_economy'
});

export default {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect()
};
