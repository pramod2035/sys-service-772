const BASE_URL = 'http://localhost:3000';
const PLAYER_ID = 'speed_run_player_99';

async function execute() {
    console.log('⚡ Running Automated Verification Tests...');
    
    // 1. Fund the wallet with 100 coins
    await fetch(`${BASE_URL}/v1/wallets/${PLAYER_ID}/credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 100, reason: 'deposit' })
    });

    console.log('🎯 Launching 10 concurrent racing purchase transactions...');
    const payload = { itemId: 'laser_rifle', price: 100 };
    
    // 2. Blast 10 asynchronous requests at the exact same split-second
    const requests = Array.from({ length: 10 }, () => 
        fetch(`${BASE_URL}/v1/wallets/${PLAYER_ID}/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(res => res.status)
    );

    const statuses = await Promise.all(requests);
    const successes = statuses.filter(s => s === 200).length;
    
    console.log(`📊 Successes: ${successes} | Rejections: ${statuses.length - successes}`);
    
    // 3. Assert that exactly one single transaction passed through the row locks
    if (successes !== 1) throw new Error('Race condition detected!');
    console.log('🏆 PASS: Concurrency handled safely. Wallet is fully durable.');
}

execute().catch(console.error);
