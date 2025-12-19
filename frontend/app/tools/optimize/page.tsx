"use client"

import { useState } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { Settings, Check } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'

export default function OptimizePDF() {
    const [file, setFile] = useState<File | null>(null)
    const [profile, setProfile] = useState<string>('ebook')
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    const profiles = [
        { id: 'screen', name: 'Web Optimized', description: 'Smallest file size (72dpi), lower quality. Best for screen viewing.' },
        { id: 'ebook', name: 'Ebook / Standard', description: 'Good balance of size and quality (150dpi). Default choice.' },
        { id: 'printer', name: 'Print Ready', description: 'High quality (300dpi), larger file size. Best for printing.' },
    ]

    const handleFileSelect = (files: File[]) => {
        setFile(files[0])
        setStatus('idle')
        setErrorMessage(null)
    }

    const handleOptimize = async () => {
        if (!file) return

        setStatus('uploading')
        setErrorMessage(null)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('profile', profile)

        try {
            const response = await api.post('/optimize', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, `optimized_${profile}_${file.name}`)
        } catch (error) {
            setStatus('error')
            setErrorMessage('Failed to optimize PDF. Please try again.')
        }
    }

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Optimize PDF</h1>
            <p className="text-gray-600 mb-8">Choose a compromise between file size and quality.</p>

            {!file ? (
                <FadeIn>
                    <UploadBox onFileSelect={handleFileSelect} description="Drop PDF here to optimize" />
                </FadeIn>
            ) : (
                <FadeIn>
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-lg mx-auto">
                        <div className="flex items-center justify-center mb-6">
                            <div className="bg-blue-100 p-4 rounded-full">
                                <Settings className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>

                        <p className="font-medium text-gray-900 mb-6 truncate">{file.name}</p>

                        {status === 'idle' || status === 'error' ? (
                            <div className="space-y-6">
                                <div className="text-left space-y-3">
                                    <label className="text-sm font-medium text-gray-700">Optimization Profile</label>
                                    <div className="grid gap-3">
                                        {profiles.map((p) => (
                                            <div
                                                key={p.id}
                                                onClick={() => setProfile(p.id)}
                                                className={`p-3 border rounded-lg cursor-pointer flex items-center justify-between transition-colors ${profile === p.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div>
                                                    <div className="font-medium text-sm text-gray-900">{p.name}</div>
                                                    <div className="text-xs text-gray-500">{p.description}</div>
                                                </div>
                                                {profile === p.id && <Check className="w-5 h-5 text-blue-500" />}
                                            </div>
                                        ))}
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
                                        onClick={handleOptimize}
                                        className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md shadow-blue-200 transition-colors"
                                    >
                                        Optimize PDF
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-lg font-medium text-gray-900 mb-2">
                                    {status === 'uploading' ? 'Uploading...' : 'Optimizing...'}
                                </p>
                                <ProgressBar progress={uploadProgress} />
                                {status === 'completed' && (
                                    <div className="mt-4 text-blue-600 font-medium animate-pulse">
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
