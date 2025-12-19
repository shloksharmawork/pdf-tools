"use client"

import { useState } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { FileImage, FileText } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'

export default function JpgToPdf() {
    const [files, setFiles] = useState<File[]>([])
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleFileSelect = (newFiles: File[]) => {
        setFiles(newFiles)
        setStatus('idle')
    }

    const handleConvert = async () => {
        if (files.length === 0) return
        setStatus('uploading')

        const formData = new FormData()
        files.forEach((file) => {
            formData.append('files', file)
        })

        try {
            const response = await api.post('/jpg-to-pdf', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, files.length > 1 ? 'converted_images.pdf' : `${files[0].name.replace(/\.[^/.]+$/, "")}.pdf`)
        } catch (error) {
            setStatus('error')
            console.error(error)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">JPG to PDF</h1>

            <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8">
                <UploadBox
                    onFileSelect={handleFileSelect}
                    description="Drop JPG images to convert to PDF"
                    accept={{ 'image/jpeg': ['.jpg', '.jpeg'] }}
                    multiple={true}
                />

                {files.length > 0 && (
                    <FadeIn>
                        <div className="mt-8 max-w-md mx-auto">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-gray-700">{files.length} file{files.length > 1 ? 's' : ''} selected</span>
                                    <button
                                        onClick={() => setFiles([])}
                                        className="text-xs text-red-500 hover:text-red-700"
                                    >
                                        Clear all
                                    </button>
                                </div>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                    {files.map((file, index) => (
                                        <div key={index} className="flex items-center text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                                            <FileImage className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                                            <span className="truncate">{file.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {status === 'idle' && (
                                <button
                                    onClick={handleConvert}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center shadow-md hover:shadow-lg transform active:scale-95"
                                >
                                    Convert to PDF
                                    <FileText className="ml-2 w-4 h-4" />
                                </button>
                            )}

                            {(status === 'uploading' || status === 'processing') && (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-500 text-center font-medium">
                                        {status === 'processing' ? 'Generating PDF...' : 'Uploading Images...'}
                                    </p>
                                    <ProgressBar progress={uploadProgress} />
                                </div>
                            )}

                            {status === 'completed' && (
                                <div className="text-center bg-green-50 p-6 rounded-xl border border-green-100">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FileText className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-green-800 mb-1">Conversion Successful!</h3>
                                    <p className="text-sm text-green-600 mb-4">Your PDF document is ready.</p>
                                    <button
                                        onClick={() => { setFiles([]); setStatus('idle') }}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        Convert more files
                                    </button>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="text-center bg-red-50 p-6 rounded-xl border border-red-100">
                                    <h3 className="text-lg font-bold text-red-800 mb-1">Conversion Failed</h3>
                                    <p className="text-sm text-red-600 mb-4">Something went wrong. Please try again.</p>
                                    <button onClick={() => setStatus('idle')} className="text-sm font-medium text-red-700 hover:underline">
                                        Try again
                                    </button>
                                </div>
                            )}
                        </div>
                    </FadeIn>
                )}
            </div>

            <div className="mt-12 max-w-2xl text-center space-y-4 text-gray-500">
                <p>Combine multiple JPG images into a single high-quality PDF document.</p>
            </div>
        </div>
    )
}
