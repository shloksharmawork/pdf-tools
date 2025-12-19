/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/:path*` : 'http://127.0.0.1:8000/api/:path*',
            },
        ]
    },
}

module.exports = nextConfig
