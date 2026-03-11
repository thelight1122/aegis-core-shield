import React, { useState, useEffect, useRef } from 'react';

interface LiveEvent {
    type: 'event' | 'quarantine_start' | 'quarantine_end';
    data: any;
    receivedAt: string;
}

export default function LiveEventFeed() {
    const [events, setEvents] = useState<LiveEvent[]>([]);
    const [connected, setConnected] = useState(false);
    const [eventCount, setEventCount] = useState(0);
    const esRef = useRef<EventSource | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const STEWARD_URL = process.env.AEGIS_STEWARD_URL || 'http://localhost:8787';
        const es = new EventSource(`${STEWARD_URL}/events`);
        esRef.current = es;

        es.onopen = () => setConnected(true);
        es.onerror = () => setConnected(false);

        const handleEvent = (type: string) => (e: MessageEvent) => {
            let data: any;
            try { data = JSON.parse(e.data); } catch { data = e.data; }
            const entry: LiveEvent = { type: type as any, data, receivedAt: new Date().toISOString() };
            setEvents(prev => [entry, ...prev].slice(0, 50)); // keep latest 50
            setEventCount(c => c + 1);
        };

        es.addEventListener('event', handleEvent('event'));
        es.addEventListener('quarantine_start', handleEvent('quarantine_start'));
        es.addEventListener('quarantine_end', handleEvent('quarantine_end'));

        return () => {
            es.close();
            setConnected(false);
        };
    }, []);

    const getEventBadge = (type: string, data: any) => {
        if (type === 'quarantine_start') return { label: '🔒 QUARANTINE', cls: 'badge-quarantine' };
        if (type === 'quarantine_end') {
            return data.analysis?.isMalicious
                ? { label: '⚠ MALICIOUS', cls: 'badge-malicious' }
                : { label: '✓ CLEARED', cls: 'badge-cleared' };
        }
        if (data?.admitted === false) return { label: '↑ FRACTURED', cls: 'badge-fracture' };
        return { label: '✓ ADMITTED', cls: 'badge-admitted' };
    };

    return (
        <div className="prime-card card-live-feed">
            <div className="live-feed-header">
                <h3>Live Event Stream</h3>
                <div className="live-feed-meta">
                    <span className={`sse-status ${connected ? 'connected' : 'disconnected'}`}>
                        {connected ? '● SSE Connected' : '○ Connecting...'}
                    </span>
                    <span className="event-counter">{eventCount} events</span>
                </div>
            </div>

            {events.length === 0 ? (
                <div className="live-feed-empty">
                    <p>Waiting for OpenClaw events...</p>
                    <p className="dim-text">Events appear here in real-time as they arrive from connected Stewards.</p>
                </div>
            ) : (
                <div className="live-event-list" ref={listRef}>
                    {events.map((ev, idx) => {
                        const badge = getEventBadge(ev.type, ev.data);
                        return (
                            <div key={idx} className={`live-event-entry ${ev.type}`}>
                                <span className={`live-badge ${badge.cls}`}>{badge.label}</span>
                                <span className="live-agent">{ev.data?.agentId || '—'}</span>
                                <span className="live-prompt">
                                    {typeof ev.data?.prompt === 'string'
                                        ? ev.data.prompt.slice(0, 70) + (ev.data.prompt.length > 70 ? '…' : '')
                                        : ''}
                                </span>
                                <span className="live-time">{new Date(ev.receivedAt).toLocaleTimeString()}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
