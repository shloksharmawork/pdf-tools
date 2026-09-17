import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
    let rawBackend = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8000'
    rawBackend = rawBackend.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
    if (!rawBackend.includes('.') && !rawBackend.includes('localhost') && !rawBackend.includes(':')) {
        rawBackend = `${rawBackend}.onrender.com`
    }
    const backendUrl = rawBackend.startsWith('localhost') || rawBackend.startsWith('127.0.0.1')
        ? `http://${rawBackend}`
        : `https://${rawBackend}`

    const subPath = pathSegments.join('/')
    const trailing = subPath.endsWith('/') ? '' : '/'
    const targetUrl = `${backendUrl}/api/${subPath}${trailing}${req.nextUrl.search}`

    try {
        const headers = new Headers(req.headers)
        headers.delete('host')

        const body = req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined

        const res = await fetch(targetUrl, {
            method: req.method,
            headers,
            body,
            // @ts-ignore
            duplex: 'half',
        })

        const responseHeaders = new Headers(res.headers)
        responseHeaders.delete('content-encoding')

        return new NextResponse(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers: responseHeaders,
        })
    } catch (error: any) {
        return NextResponse.json({ error: 'Proxy error', details: error?.message }, { status: 502 })
    }
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyRequest(req, params.path)
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyRequest(req, params.path)
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyRequest(req, params.path)
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyRequest(req, params.path)
}
