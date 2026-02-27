import { useCallback, useEffect, useRef, useState } from 'react';

export function useGraphStream(url: string = 'ws://127.0.0.1:8000/ws/math-engine') {
    const ws = useRef<WebSocket | null>(null);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Reconnect logic or simple one-off connection
        ws.current = new WebSocket(url);

        ws.current.onopen = () => setIsConnected(true);
        ws.current.onclose = () => setIsConnected(false);

        ws.current.onmessage = (event) => {
            try {
                setLastMessage(JSON.parse(event.data));
            } catch (e) {
                console.error("Failed to parse websocket message", e);
            }
        };

        return () => {
            ws.current?.close();
        };
    }, [url]);

    const streamState = useCallback((data: any) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data));
        }
    }, []);

    return { streamState, lastMessage, isConnected };
}
