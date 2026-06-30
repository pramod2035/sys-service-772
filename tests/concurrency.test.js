const BASE_URL = 'http://localhost:3000';
// Generate a unique player ID for this fresh test run to completely clear old caches
const PLAYER_ID = `speed_run_player_${Math.floor(Math.random() * 100000)}`;

async function execute() {
    console.log(`⚡ Running Automated Verification Tests for ${PLAYER_ID}...`);
    
    // 1. Initialise the player wallet with exactly 100 coins
    await fetch(`${BASE_URL}/v1/wallets/${PLAYER_ID}/credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 100, reason: 'deposit' })
    });

    console.log('🎯 Launching 10 concurrent racing purchase transactions...');
    
    // 2. We add a unique transaction tracking index parameter to each request body.
    // This forces unique idempotency signatures while racing for the exact same wallet lock.
    const requests = Array.from({ length: 10 }, (_, index) => 
        fetch(`${BASE_URL}/v1/wallets/${PLAYER_ID}/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                itemId: 'laser_rifle', 
                price: 100,
                tx_ref: `tx_race_ref_${index}` // Blocks idempotency short-circuiting
            })
        }).then(res => res.status)
    );

    const statuses = await Promise.all(requests);
    const successes = statuses.filter(s => s === 200).length;
    const rejections = statuses.filter(s => s === 422).length;
    
    console.log(`📊 Successes: ${successes} | Rejections: ${rejections}`);
    
    if (successes !== 1) {
        throw new Error(`Race condition leakage! Expected exactly 1 success, got ${successes}`);
    }
    console.log('🏆 PASS: Concurrency handled safely. Wallet row-level locks are fully active!');
}

execute().catch(console.error);
