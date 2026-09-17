import axios from 'axios'

let cachedBackendUrl: string | null = null
let configPromise: Promise<string> | null = null

async function resolveBackendUrl(): Promise<string> {
    if (cachedBackendUrl) return cachedBackendUrl

    // 1. Check window.__ENV__ (injected by root layout at SSR)
    if (typeof window !== 'undefined' && (window as any).__ENV__?.BACKEND_URL) {
        let url = ((window as any).__ENV__.BACKEND_URL as string).trim()
        if (url) {
            url = url.replace(/\/+$/, '')
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = `https://${url}`
            }
            cachedBackendUrl = url
            return cachedBackendUrl
        }
    }

    // 2. Check build-time environment variable
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
        let url = process.env.NEXT_PUBLIC_BACKEND_URL.trim()
        if (url) {
            url = url.replace(/\/+$/, '')
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = `https://${url}`
            }
            cachedBackendUrl = url
            return cachedBackendUrl
        }
    }

    // 3. Fetch from /api/config at runtime in browser
    if (typeof window !== 'undefined') {
        if (!configPromise) {
            configPromise = fetch('/api/config')
                .then((res) => (res.ok ? res.json() : {}))
                .then((data) => {
                    let url = (data?.backendUrl || '').trim()
                    if (url) {
                        url = url.replace(/\/+$/, '')
                        if (!url.startsWith('http://') && !url.startsWith('https://')) {
                            url = `https://${url}`
                        }
                        cachedBackendUrl = url
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
