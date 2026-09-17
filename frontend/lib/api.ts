import axios from 'axios'

let cachedBackendUrl: string | null = null
let configPromise: Promise<string> | null = null

function normalizeUrl(raw: string): string {
    let url = raw.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
    if (!url) return ''
    if (!url.includes('.') && !url.includes('localhost')) {
        url = `${url}.onrender.com`
    }
    return url.startsWith('localhost') ? `http://${url}` : `https://${url}`
}

async function resolveBackendUrl(): Promise<string> {
    if (cachedBackendUrl) return cachedBackendUrl

    // 1. Check window.__ENV__ (injected by root layout at SSR)
    if (typeof window !== 'undefined' && (window as any).__ENV__?.BACKEND_URL) {
        const raw = (window as any).__ENV__.BACKEND_URL as string
        const formatted = normalizeUrl(raw)
        if (formatted) {
            cachedBackendUrl = formatted
            return cachedBackendUrl
        }
    }

    // 2. Check build-time environment variable
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
        const formatted = normalizeUrl(process.env.NEXT_PUBLIC_BACKEND_URL)
        if (formatted) {
            cachedBackendUrl = formatted
            return cachedBackendUrl
        }
    }

    // 3. Fetch from /api/config at runtime in browser
    if (typeof window !== 'undefined') {
        if (!configPromise) {
            configPromise = fetch('/api/config')
                .then((res) => (res.ok ? res.json() : {}))
                .then((data) => {
                    const raw = data?.backendUrl || ''
                    const formatted = normalizeUrl(raw)
                    if (formatted) {
                        cachedBackendUrl = formatted
                        return cachedBackendUrl
                    }
                    return ''
                })
                .catch(() => '')
        }
        const fetched = await configPromise
        if (fetched) return fetched
    }

    return ''
}

const api = axios.create({
    headers: {
        'Content-Type': 'multipart/form-data',
    },
})

// Dynamically set baseURL and append trailing slash before every request
api.interceptors.request.use(async (config) => {
    const backendUrl = await resolveBackendUrl()
    if (backendUrl) {
        config.baseURL = `${backendUrl}/api`
    } else {
        config.baseURL = '/api'
    }

    // Ensure trailing slash for API endpoints to prevent 307 redirect CORS drops
    if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
        config.url = `${config.url}/`
    }

    return config
})

export const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
}

export default api
