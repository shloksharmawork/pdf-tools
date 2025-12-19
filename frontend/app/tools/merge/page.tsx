"use client"

import { useState } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { Files, X } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'

export default function MergePDF() {
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

    const handleMerge = async () => {
        if (files.length < 2) {
            setErrorMessage("Please select at least 2 PDF files to merge.")
            return
        }

        setStatus('uploading')
        setErrorMessage(null)

        const formData = new FormData()
        files.forEach((file) => {
            formData.append('files', file)
        })

        try {
            const response = await api.post('/merge', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, 'merged_document.pdf')
        } catch (error) {
            setStatus('error')
            setErrorMessage('Failed to merge PDFs. Please try again.')
        }
    }

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Merge PDF</h1>
            <p className="text-gray-600 mb-8">Combine PDFs in the order you want with the easiest PDF merger.</p>

            {status === 'idle' || status === 'error' ? (
                <FadeIn>
                    <div className="space-y-6">
                        <UploadBox onFileSelect={handleFileSelect} multiple={true} description="Drop multiple PDFs here" />

                        {files.length > 0 && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto text-left">
                                <h3 className="font-semibold text-gray-700 mb-4">Selected Files ({files.length})</h3>
                                <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {files.map((file, index) => (
                                        <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                <Files className="w-5 h-5 text-red-500 flex-shrink-0" />
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
                                        onClick={handleMerge}
                                        className="w-full md:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-200 transition-all transform hover:-translate-y-0.5"
                                    >
                                        Merge PDFs
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
                                {status === 'uploading' ? 'Uploading files...' : 'Merging PDFs...'}
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
                                        Merge more files
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
