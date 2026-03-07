
let webhookUrl: string | null = null;

export function configureWebhook(url: string) {
    webhookUrl = url;
    console.log('[AEGIS Alerts] Webhook configured.');
}

export async function sendAlert(message: string, severity: 'info' | 'warning' | 'critical' = 'info') {
    if (!webhookUrl) {
        console.log(`[AEGIS Alert Placeholder] ${severity.toUpperCase()}: ${message}`);
        return;
    }

    try {
        const payload = {
            username: 'AEGIS Shield',
            content: `**[${severity.toUpperCase()}]** ${message}`,
            embeds: [
                {
                    title: 'AEGIS System Alert',
                    description: message,
                    color: severity === 'critical' ? 0xff0000 : severity === 'warning' ? 0xffff00 : 0x00ff00,
                    timestamp: new Date().toISOString()
                }
            ]
        };

        // Using global fetch (available in modern Node/Electon)
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.error('[AEGIS Alert] Webhook delivery failed:', res.statusText);
        }
    } catch (e) {
        console.error('[AEGIS Alert] Webhook error:', e);
    }
}
