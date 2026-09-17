import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || ''
    if (backendUrl) {
        backendUrl = backendUrl.replace(/\/+$/, '')
        if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
            backendUrl = `https://${backendUrl}`
        }
    }
    return NextResponse.json({ backendUrl })
}
