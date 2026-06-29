import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/game_economy'
});

export default {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect()
};
