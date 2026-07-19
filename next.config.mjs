import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    // restart.sh can set NEXT_DIST_DIR when a root-owned .next cannot be removed
    distDir: process.env.NEXT_DIST_DIR || '.next',

    // Auth runs in root `proxy.ts` (Next.js 16+); see https://nextjs.org/docs/messages/middleware-to-proxy
    logging: {
        fetches: {
            fullUrl: true,
        },
    },

    // Experimental features for Next.js 16
    experimental: {
        // Suppress specific warnings
        serverActions: {
            // Large PDFs upload directly to private Vercel Blob, never through a Function.
            bodySizeLimit: '1mb',
        },
    },

    turbopack: {
        root: repoRoot,
    },

    async headers() {
        return [{
            source: '/:path*',
            headers: [
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
                { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
                { key: 'X-Frame-Options', value: 'DENY' },
                ...(process.env.NODE_ENV === 'production'
                    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
                    : []),
            ],
        }];
    },
};

export default nextConfig;
