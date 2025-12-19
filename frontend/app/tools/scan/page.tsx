"use client"

import { useState } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { Files, X, Image as ImageIcon } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'

export default function ScanToPDF() {
    const [files, setFiles] = useState<File[]>([])
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleFileSelect = (newFiles: File[]) => {
        setFiles((prev) => [...prev, ...newFiles])
        setStatus('idle')
        setErrorMessage(null)
    }

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const handleConvert = async () => {
        if (files.length === 0) {
            setErrorMessage("Please select at least one image.")
            return
        }

        setStatus('uploading')
        setErrorMessage(null)

        const formData = new FormData()
        files.forEach((file) => {
            formData.append('files', file)
        })

        try {
            const response = await api.post('/scan/', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, 'scanned_document.pdf')
        } catch (error: any) {
            setStatus('error')
            let msg = 'Failed to create PDF from images. Please try again.'

            if (error.response?.data instanceof Blob) {
                try {
                    const text = await error.response.data.text()
                    const json = JSON.parse(text)
                    if (json.detail) msg = json.detail
                } catch (e) {
                    // fallback
                }
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
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Scan to PDF</h1>
            <p className="text-gray-600 mb-8">Convert your images (JPG, PNG) into a single PDF file.</p>

            {status === 'idle' || status === 'error' ? (
                <FadeIn>
                    <div className="space-y-6">
                        <UploadBox
                            onFileSelect={handleFileSelect}
                            multiple={true}
                            title="Select images"
                            description="Drop images here (JPG, PNG)"
                            accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }}
                        />

                        {files.length > 0 && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto text-left">
                                <h3 className="font-semibold text-gray-700 mb-4">Selected Images ({files.length})</h3>
                                <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {files.map((file, index) => (
                                        <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                <ImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                                <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                            </div>
                                            <button onClick={() => removeFile(index)} className="text-gray-400 hover:text-red-500">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                {errorMessage && (
                                    <div className="text-red-500 text-sm mt-4 text-center">{errorMessage}</div>
                                )}

                                <div className="mt-6 flex justify-center">
                                    <button
                                        onClick={handleConvert}
                                        className="w-full md:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-200 transition-all transform hover:-translate-y-0.5"
                                    >
                                        Convert to PDF
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </FadeIn>
            ) : (
                <FadeIn>
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-lg mx-auto">
                        <div className="text-center py-4">
                            <p className="text-lg font-medium text-gray-900 mb-2">
                                {status === 'uploading' ? 'Uploading images...' : 'Converting...'}
                            </p>
                            <ProgressBar progress={uploadProgress} />
                            {status === 'completed' && (
                                <div className="mt-4 text-green-600 font-medium animate-pulse">
                                    Download starting...
                                </div>
                            )}
                            {status === 'completed' && (
                                <div className="mt-6 flex gap-4 justify-center">
                                    <button
                                        onClick={() => { setFiles([]); setStatus('idle'); }}
                                        className="text-sm text-gray-500 hover:text-gray-900 underline"
                                    >
                                        Convert more images
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </FadeIn>
            )}
        </div>
    )
}
