/** @type {import('next').NextConfig} */
const nextConfig = {
    // Suppress middleware deprecation warning (false positive with NextAuth v5)
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
