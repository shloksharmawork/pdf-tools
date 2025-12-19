"use client"

import { useState } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { RotateCw, RotateCcw, ArrowRightLeft } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'

export default function RotatePDF() {
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleFileSelect = (files: File[]) => {
        setFile(files[0])
        setStatus('idle')
    }

    const handleRotate = async (angle: number) => {
        if (!file) return
        setStatus('uploading')

        const formData = new FormData()
        formData.append('file', file)
        formData.append('angle', angle.toString())

        try {
            const response = await api.post('/rotate', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, `rotated_${file.name}`)
        } catch (error) {
            setStatus('error')
            console.error(error)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Rotate PDF</h1>

            <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-8">
                <UploadBox onFileSelect={handleFileSelect} description="Drop PDF to rotate" />

                {file && (
                    <FadeIn>
                        <div className="mt-6">
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100 mb-6">
                                <span className="font-medium text-gray-700 truncate flex-1">{file.name}</span>
                                <span className="text-sm text-gray-500 ml-4">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>

                            {status === 'idle' && (
                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        onClick={() => handleRotate(90)}
                                        className="flex flex-col items-center justify-center p-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                                    >
                                        <RotateCw className="w-8 h-8 mb-2" />
                                        <span className="font-medium text-center">Rotate Right (90°)</span>
                                    </button>
                                    <button
                                        onClick={() => handleRotate(270)}
                                        className="flex flex-col items-center justify-center p-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                                    >
                                        <RotateCcw className="w-8 h-8 mb-2" />
                                        <span className="font-medium text-center">Rotate Left (90°)</span>
                                    </button>
                                    <button
                                        onClick={() => handleRotate(180)}
                                        className="flex flex-col items-center justify-center p-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                                    >
                                        <ArrowRightLeft className="w-8 h-8 mb-2" />
                                        <span className="font-medium text-center">Flip (180°)</span>
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
                                    Rotation complete! Download should start automatically.
                                    <button onClick={() => { setFile(null); setStatus('idle') }} className="block mx-auto mt-2 text-sm text-green-700 underline">
                                        Rotate another file
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
