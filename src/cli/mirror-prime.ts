import { StewardPrime } from '../shared/main/steward-prime';

const port = process.env.AEGIS_PRIME_PORT ? parseInt(process.env.AEGIS_PRIME_PORT, 10) : 8888;
const prime = new StewardPrime();

try {
    console.log(`[CLI] Starting Mirror Prime on port ${port}...`);
    prime.start(port);
} catch (error) {
    console.error('[CLI] Failed to start Mirror Prime:', error);
    process.exit(1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[CLI] Shutting down Mirror Prime...');
    prime.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n[CLI] Shutting down Mirror Prime...');
    prime.stop();
    process.exit(0);
});
