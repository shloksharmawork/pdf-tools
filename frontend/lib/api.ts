import axios from 'axios'

// Use full backend URL in production, relative path in development
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL
    ? `https://${process.env.NEXT_PUBLIC_BACKEND_URL}/api`
    : '/api'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'multipart/form-data',
    },
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
