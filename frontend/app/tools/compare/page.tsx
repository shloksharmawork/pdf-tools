"use client"

import { useState } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { GitCompare, FileDiff } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'

export default function ComparePDF() {
    const [file1, setFile1] = useState<File | null>(null)
    const [file2, setFile2] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleFile1Select = (files: File[]) => {
        setFile1(files[0])
        setStatus('idle')
        setErrorMessage(null)
    }

    const handleFile2Select = (files: File[]) => {
        setFile2(files[0])
        setStatus('idle')
        setErrorMessage(null)
    }

    const handleCompare = async () => {
        if (!file1 || !file2) return

        setStatus('uploading')
        setErrorMessage(null)

        const formData = new FormData()
        formData.append('file1', file1)
        formData.append('file2', file2)

        try {
            const response = await api.post('/compare', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, `comparison_result.pdf`)
        } catch (error) {
            setStatus('error')
            setErrorMessage('Failed to compare PDFs. Please try again.')
        }
    }

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Compare PDF</h1>
            <p className="text-gray-600 mb-8">Upload two PDFs to see the visual differences.</p>

            <FadeIn>
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-orange-100 p-4 rounded-full">
                            <GitCompare className="w-8 h-8 text-orange-600" />
                        </div>
                    </div>

                    {(status === 'idle' || status === 'error') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="text-lg font-medium text-gray-700 mb-4">Original PDF (File A)</h3>
                                {!file1 ? (
                                    <UploadBox onFileSelect={handleFile1Select} description="Drop first PDF here" isSmall={true} />
                                ) : (
                                    <div className="p-4 bg-gray-50 border rounded-lg flex flex-col items-center">
                                        <p className="font-medium text-gray-900 truncate w-full">{file1.name}</p>
                                        <button onClick={() => setFile1(null)} className="text-xs text-red-500 mt-2 hover:underline">Remove</button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-700 mb-4">Modified PDF (File B)</h3>
                                {!file2 ? (
                                    <UploadBox onFileSelect={handleFile2Select} description="Drop second PDF here" isSmall={true} />
                                ) : (
                                    <div className="p-4 bg-gray-50 border rounded-lg flex flex-col items-center">
                                        <p className="font-medium text-gray-900 truncate w-full">{file2.name}</p>
                                        <button onClick={() => setFile2(null)} className="text-xs text-red-500 mt-2 hover:underline">Remove</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {status === 'idle' && file1 && file2 && (
                        <button
                            onClick={handleCompare}
                            className="py-3 px-8 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium shadow-md shadow-orange-200 transition-colors transform active:scale-95"
                        >
                            Compare Files
                        </button>
                    )}

                    {errorMessage && (
                        <div className="text-red-500 text-sm mt-4">{errorMessage}</div>
                    )}

                    {(status === 'uploading' || status === 'processing' || status === 'completed') && (
                        <div className="text-center py-4">
                            <p className="text-lg font-medium text-gray-900 mb-2">
                                {status === 'uploading' ? 'Uploading...' : 'Comparing PDFs...'}
                            </p>
                            <ProgressBar progress={uploadProgress} />
                            {status === 'completed' && (
                                <div className="mt-4 text-green-600 font-medium animate-pulse">
                                    Download starting...
                                </div>
                            )}
                            {status === 'completed' && (
                                <button
                                    onClick={() => {
                                        setFile1(null)
                                        setFile2(null)
                                        setStatus('idle')
                                    }}
                                    className="mt-6 text-sm text-gray-500 hover:text-gray-900 underline"
                                >
                                    Compare more files
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </FadeIn>
        </div>
    )
}
