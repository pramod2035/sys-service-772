import app from './app.js';
import { initSchema } from './db.js';

const PORT = process.env.PORT || 3000;

async function start() {
    await initSchema();
    app.listen(PORT, () => {
        console.log(`Application context initialized on port ${PORT}`);
    });
}

start().catch(err => {
    console.error("Initialization crash:", err);
    process.exit(1);
});
