import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || ''
    if (backendUrl) {
        backendUrl = backendUrl.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
        // If it's a Render internal service name without domain extension, append .onrender.com
        if (!backendUrl.includes('.') && !backendUrl.includes('localhost')) {
            backendUrl = `${backendUrl}.onrender.com`
        }
        backendUrl = backendUrl.startsWith('localhost') ? `http://${backendUrl}` : `https://${backendUrl}`
    }
    return NextResponse.json({ backendUrl })
}
