"use client"

import { useState } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { Wrench } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'

export default function RepairPDF() {
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleFileSelect = (files: File[]) => {
        setFile(files[0])
        setStatus('idle')
        setErrorMessage(null)
    }

    const handleRepair = async () => {
        if (!file) return

        setStatus('uploading')
        setErrorMessage(null)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await api.post('/repair', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, `repaired_${file.name}`)
        } catch (error) {
            setStatus('error')
            setErrorMessage('Failed to repair PDF. The file might be too damaged or encrypted.')
        }
    }

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Repair PDF</h1>
            <p className="text-gray-600 mb-8">Recover data from a corrupt or damaged PDF file.</p>

            {!file ? (
                <FadeIn>
                    <UploadBox onFileSelect={handleFileSelect} description="Drop damaged PDF here" />
                </FadeIn>
            ) : (
                <FadeIn>
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-lg mx-auto">
                        <div className="flex items-center justify-center mb-6">
                            <div className="bg-orange-100 p-4 rounded-full">
                                <Wrench className="w-8 h-8 text-orange-600" />
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
                                        onClick={handleRepair}
                                        className="flex-1 py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium shadow-md shadow-orange-200 transition-colors"
                                    >
                                        Repair PDF
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-lg font-medium text-gray-900 mb-2">
                                    {status === 'uploading' ? 'Uploading...' : 'Repairing...'}
                                </p>
                                <ProgressBar progress={uploadProgress} />
                                {status === 'completed' && (
                                    <div className="mt-4 text-orange-600 font-medium animate-pulse">
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
