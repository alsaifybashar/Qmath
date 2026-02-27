'use client';

import { useEffect } from 'react';

const safeSerialize = (obj: any): string => {
    try {
        if (obj instanceof Error) {
            return `${obj.name}: ${obj.message}\n${obj.stack}`;
        }
        if (typeof obj === 'object') {
            return JSON.stringify(obj, (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (value instanceof Node) return `[DOM Node ${value.nodeName}]`;
                    if (value instanceof Window) return '[Window]';
                }
                return value;
            });
        }
        return String(obj);
    } catch {
        return '[Unserializable Object]';
    }
};

export function GlobalErrorLogger() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        let isLogging = false;

        const sendErrorToTerminal = (type: string, message: any, stack?: string, source?: string, lineno?: number, colno?: number) => {
            if (isLogging) return;
            isLogging = true;

            const msgStr = String(message);
            // Ignore normal React HMR messages and innocuous warnings
            if (msgStr.includes('[Fast Refresh]') || msgStr.includes('[HMR]') || msgStr.includes('The "middleware" file convention is deprecated')) {
                isLogging = false;
                return;
            }

            fetch('/api/log-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    message: msgStr,
                    source: source || 'unknown',
                    lineno: lineno || 0,
                    colno: colno || 0,
                    stack: stack || '',
                    url: window.location.href,
                })
            }).catch(() => {
                // Ignore API failures to prevent loop
            }).finally(() => {
                // Short timeout to debounce massive error cascades
                setTimeout(() => { isLogging = false; }, 100);
            });
        };

        const handleWindowError = (event: ErrorEvent) => {
            sendErrorToTerminal('uncaught_exception', event.message, event.error?.stack, event.filename, event.lineno, event.colno);
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            const message = reason?.message || String(reason);
            const stack = reason?.stack || '';
            sendErrorToTerminal('unhandled_rejection', message, stack);
        };

        const originalConsoleError = console.error;
        console.error = (...args: any[]) => {
            originalConsoleError.apply(console, args);
            const message = args.map(safeSerialize).join(' ');
            sendErrorToTerminal('console_error', message);
        };

        window.addEventListener('error', handleWindowError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleWindowError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            console.error = originalConsoleError;
        };
    }, []);

    return null;
}
