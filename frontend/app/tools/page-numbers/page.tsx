"use client"

import { useState } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { ArrowDown } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'

export default function PageNumbers() {
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [uploadProgress, setUploadProgress] = useState(0)
    const [position, setPosition] = useState('bottom-center')

    const handleFileSelect = (files: File[]) => {
        setFile(files[0])
        setStatus('idle')
    }

    const handleAddNumbers = async () => {
        if (!file) return
        setStatus('uploading')

        const formData = new FormData()
        formData.append('file', file)
        formData.append('position', position)

        try {
            const response = await api.post('/page-numbers', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, `numbered_${file.name}`)
        } catch (error) {
            setStatus('error')
            console.error(error)
        }
    }

    const positions = [
        { id: 'top-left', label: 'Top Left' },
        { id: 'top-center', label: 'Top Center' },
        { id: 'top-right', label: 'Top Right' },
        { id: 'bottom-left', label: 'Bottom Left' },
        { id: 'bottom-center', label: 'Bottom Center' },
        { id: 'bottom-right', label: 'Bottom Right' },
    ]

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Add Page Numbers</h1>

            <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-8">
                <UploadBox onFileSelect={handleFileSelect} description="Drop PDF to add page numbers" />

                {file && (
                    <FadeIn>
                        <div className="mt-6">
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100 mb-6">
                                <span className="font-medium text-gray-700 truncate flex-1">{file.name}</span>
                                <span className="text-sm text-gray-500 ml-4">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>

                            {status === 'idle' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-3 gap-3">
                                        {positions.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setPosition(p.id)}
                                                className={`p-3 text-sm rounded-lg border transition-all ${position === p.id
                                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                    }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleAddNumbers}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                                    >
                                        Add Page Numbers
                                        <ArrowDown className="ml-2 w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {(status === 'uploading' || status === 'processing') && (
                                <>
                                    <p className="text-sm text-gray-500 text-center mb-2">{status === 'processing' ? 'Processing...' : 'Uploading...'}</p>
                                    <ProgressBar progress={uploadProgress} />
                                </>
                            )}

                            {status === 'completed' && (
                                <div className="text-center text-green-600 font-medium p-4 bg-green-50 rounded-lg">
                                    Page numbers added! Download should start automatically.
                                    <button onClick={() => { setFile(null); setStatus('idle') }} className="block mx-auto mt-2 text-sm text-green-700 underline">
                                        Process another file
                                    </button>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="text-center text-red-600 font-medium p-4 bg-red-50 rounded-lg">
                                    Error processing file. Please try again.
                                    <button onClick={() => setStatus('idle')} className="block mx-auto mt-2 text-sm text-red-700 underline">
                                        Try again
                                    </button>
                                </div>
                            )}
                        </div>
                    </FadeIn>
                )}
            </div>
        </div>
    )
}
