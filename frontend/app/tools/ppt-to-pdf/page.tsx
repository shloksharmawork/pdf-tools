"use client"

import { useState } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { FileBarChart, File } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'

export default function PptToPdf() {
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleFileSelect = (files: File[]) => {
        setFile(files[0])
        setStatus('idle')
    }

    const handleConvert = async () => {
        if (!file) return
        setStatus('uploading')

        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await api.post('/ppt-to-pdf', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, `${file.name.replace(/\.[^/.]+$/, "")}.pdf`)
        } catch (error) {
            setStatus('error')
            console.error(error)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">PowerPoint to PDF</h1>

            <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8">
                <UploadBox
                    onFileSelect={handleFileSelect}
                    description="Drop PowerPoint presentation to convert to PDF"
                    accept={{
                        'application/vnd.ms-powerpoint': ['.ppt'],
                        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
                    }}
                />

                {file && (
                    <FadeIn>
                        <div className="mt-8 max-w-md mx-auto">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-orange-100 rounded-lg mr-3">
                                        <FileBarChart className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-700 truncate max-w-[200px]">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    Remove
                                </button>
                            </div>

                            {status === 'idle' && (
                                <button
                                    onClick={handleConvert}
                                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center shadow-md hover:shadow-lg transform active:scale-95"
                                >
                                    Convert to PDF
                                    <File className="ml-2 w-4 h-4" />
                                </button>
                            )}

                            {(status === 'uploading' || status === 'processing') && (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-500 text-center font-medium">
                                        {status === 'processing' ? 'Converting to PDF...' : 'Uploading Presentation...'}
                                    </p>
                                    <ProgressBar progress={uploadProgress} />
                                </div>
                            )}

                            {status === 'completed' && (
                                <div className="text-center bg-green-50 p-6 rounded-xl border border-green-100">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <File className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-green-800 mb-1">Conversion Successful!</h3>
                                    <p className="text-sm text-green-600 mb-4">Your PDF document is ready.</p>
                                    <button
                                        onClick={() => { setFile(null); setStatus('idle') }}
                                        className="text-sm font-medium text-orange-600 hover:text-orange-800 hover:underline"
                                    >
                                        Convert another file
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
                <p>Convert your PowerPoint presentations (.ppt, .pptx) to PDF format effortlessly.</p>
            </div>
        </div>
    )
}
