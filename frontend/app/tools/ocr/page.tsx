"use client"

import { useState } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { ScanText, Check } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'

export default function OCRPDF() {
    const [file, setFile] = useState<File | null>(null)
    const [lang, setLang] = useState<string>('eng')
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    const languages = [
        { id: 'eng', name: 'English' },
        // Add more if installed in backend
    ]

    const handleFileSelect = (files: File[]) => {
        setFile(files[0])
        setStatus('idle')
        setErrorMessage(null)
    }

    const handleOCR = async () => {
        if (!file) return

        setStatus('uploading')
        setErrorMessage(null)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('lang', lang)

        try {
            const response = await api.post('/ocr', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, `ocr_${file.name}`)
        } catch (error) {
            setStatus('error')
            setErrorMessage('Failed to perform OCR. Please try again.')
        }
    }

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">OCR PDF</h1>
            <p className="text-gray-600 mb-8">Convert scanned documents into searchable, selectable PDF text.</p>

            {!file ? (
                <FadeIn>
                    <UploadBox onFileSelect={handleFileSelect} description="Drop scanned PDF here" />
                </FadeIn>
            ) : (
                <FadeIn>
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-lg mx-auto">
                        <div className="flex items-center justify-center mb-6">
                            <div className="bg-purple-100 p-4 rounded-full">
                                <ScanText className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>

                        <p className="font-medium text-gray-900 mb-6 truncate">{file.name}</p>

                        {status === 'idle' || status === 'error' ? (
                            <div className="space-y-6">
                                <div className="text-left space-y-3">
                                    <label className="text-sm font-medium text-gray-700">Language</label>
                                    <div className="grid gap-3">
                                        {languages.map((l) => (
                                            <div
                                                key={l.id}
                                                onClick={() => setLang(l.id)}
                                                className={`p-3 border rounded-lg cursor-pointer flex items-center justify-between transition-colors ${lang === l.id
                                                        ? 'border-purple-500 bg-purple-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <span className="font-medium text-sm text-gray-900">{l.name}</span>
                                                {lang === l.id && <Check className="w-5 h-5 text-purple-500" />}
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
                                        onClick={handleOCR}
                                        className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-md shadow-purple-200 transition-colors"
                                    >
                                        Start OCR
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-lg font-medium text-gray-900 mb-2">
                                    {status === 'uploading' ? 'Uploading...' : 'Processing OCR...'}
                                </p>
                                <ProgressBar progress={uploadProgress} />
                                {status === 'processing' && (
                                    <p className="text-xs text-gray-500 mt-2">This may take a while depending on file size...</p>
                                )}
                                {status === 'completed' && (
                                    <div className="mt-4 text-purple-600 font-medium animate-pulse">
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
