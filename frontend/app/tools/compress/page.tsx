"use client"

import { useState } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { Minimize2 } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'

export default function CompressPDF() {
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleFileSelect = (files: File[]) => {
        setFile(files[0])
        setStatus('idle')
        setErrorMessage(null)
    }

    const handleCompress = async () => {
        if (!file) return

        setStatus('uploading')
        setErrorMessage(null)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await api.post('/compress', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, `compressed_${file.name}`)
        } catch (error) {
            setStatus('error')
            setErrorMessage('Failed to compress PDF. Please try again.')
        }
    }

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Compress PDF</h1>
            <p className="text-gray-600 mb-8">Reduce file size while optimizing for maximal PDF quality.</p>

            {!file ? (
                <FadeIn>
                    <UploadBox onFileSelect={handleFileSelect} description="Drop PDF here to compress" />
                </FadeIn>
            ) : (
                <FadeIn>
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-lg mx-auto">
                        <div className="flex items-center justify-center mb-6">
                            <div className="bg-green-100 p-4 rounded-full">
                                <Minimize2 className="w-8 h-8 text-green-600" />
                            </div>
                        </div>

                        <p className="font-medium text-gray-900 mb-6 truncate">{file.name}</p>

                        {status === 'idle' || status === 'error' ? (
                            <div className="space-y-4">
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
                                        onClick={handleCompress}
                                        className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-md shadow-green-200 transition-colors"
                                    >
                                        Compress PDF
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-lg font-medium text-gray-900 mb-2">
                                    {status === 'uploading' ? 'Uploading...' : 'Compressing...'}
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
