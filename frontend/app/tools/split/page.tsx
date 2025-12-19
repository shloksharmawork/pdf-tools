"use client"

import { useState } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { Scissors } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'

export default function SplitPDF() {
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    const [startPage, setStartPage] = useState('')
    const [endPage, setEndPage] = useState('')

    const handleFileSelect = (files: File[]) => {
        setFile(files[0])
        setStatus('idle')
        setErrorMessage(null)
    }

    const handleSplit = async () => {
        if (!file) return
        if (!startPage || !endPage) {
            setErrorMessage('Please enter both start and end page numbers.')
            return
        }

        setStatus('uploading')
        setErrorMessage(null)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('start', startPage)
        formData.append('end', endPage)

        try {
            const response = await api.post('/split/', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, `split_${startPage}-${endPage}_${file.name}`)
        } catch (error: any) {
            setStatus('error')
            let msg = 'Failed to split PDF. Please check page numbers.'

            if (error.response?.data instanceof Blob) {
                try {
                    const text = await error.response.data.text()
                    const json = JSON.parse(text)
                    if (json.detail) msg = json.detail
                } catch (e) { }
            } else if (error.response?.data?.detail) {
                msg = error.response.data.detail
            } else if (error.message) {
                msg = error.message
            }
            setErrorMessage(msg)
        }
    }

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Split PDF</h1>
            <p className="text-gray-600 mb-8">Extract a specific range of pages from your PDF.</p>

            {!file ? (
                <FadeIn>
                    <UploadBox onFileSelect={handleFileSelect} description="Drop PDF here to split" />
                </FadeIn>
            ) : (
                <FadeIn>
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-lg mx-auto">
                        <div className="flex items-center justify-center mb-6">
                            <div className="bg-orange-100 p-4 rounded-full">
                                <Scissors className="w-8 h-8 text-orange-600" />
                            </div>
                        </div>

                        <p className="font-medium text-gray-900 mb-6 truncate">{file.name}</p>

                        {status === 'idle' || status === 'error' ? (
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Page</label>
                                        <input
                                            type="number"
                                            value={startPage}
                                            onChange={(e) => setStartPage(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                            placeholder="1"
                                            min="1"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">End Page</label>
                                        <input
                                            type="number"
                                            value={endPage}
                                            onChange={(e) => setEndPage(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                            placeholder="5"
                                            min="1"
                                        />
                                    </div>
                                </div>

                                {errorMessage && (
                                    <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setFile(null)}
                                        className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        Change File
                                    </button>
                                    <button
                                        onClick={handleSplit}
                                        className="flex-1 py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium shadow-md shadow-orange-200 transition-colors"
                                    >
                                        Split PDF
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-lg font-medium text-gray-900 mb-2">
                                    {status === 'uploading' ? 'Uploading...' : 'Splitting...'}
                                </p>
                                <ProgressBar progress={uploadProgress} />
                                {status === 'completed' && (
                                    <div className="mt-4 text-green-600 font-medium animate-pulse">
                                        Download starting...
                                    </div>
                                )}
                                {status === 'completed' && (
                                    <button
                                        onClick={() => setFile(null)}
                                        className="mt-6 text-sm text-gray-500 hover:text-gray-900 underline"
                                    >
                                        Process another file
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </FadeIn>
            )}
        </div>
    )
}
