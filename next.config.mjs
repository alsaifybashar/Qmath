/** @type {import('next').NextConfig} */
const nextConfig = {
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
            bodySizeLimit: '10mb', // Increase for exam PDF uploads
        },
    },
};

export default nextConfig;
