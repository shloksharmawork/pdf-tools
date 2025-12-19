"use client"

import { useState } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { Stamp } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'

export default function AddWatermark() {
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [uploadProgress, setUploadProgress] = useState(0)

    // Watermark settings
    const [text, setText] = useState('CONFIDENTIAL')
    const [opacity, setOpacity] = useState(0.5)
    const [rotation, setRotation] = useState(45)
    const [fontSize, setFontSize] = useState(60)

    const handleFileSelect = (files: File[]) => {
        setFile(files[0])
        setStatus('idle')
    }

    const handleAddWatermark = async () => {
        if (!file) return
        setStatus('uploading')

        const formData = new FormData()
        formData.append('file', file)
        formData.append('text', text)
        formData.append('opacity', opacity.toString())
        formData.append('rotation', rotation.toString())
        formData.append('fontSize', fontSize.toString())

        try {
            const response = await api.post('/watermark', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, `watermarked_${file.name}`)
        } catch (error) {
            setStatus('error')
            console.error(error)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Add Watermark</h1>

            <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-8">
                <UploadBox onFileSelect={handleFileSelect} description="Drop PDF to watermark" />

                {file && (
                    <FadeIn>
                        <div className="mt-6">
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100 mb-6">
                                <span className="font-medium text-gray-700 truncate flex-1">{file.name}</span>
                                <span className="text-sm text-gray-500 ml-4">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>

                            {status === 'idle' && (
                                <div className="space-y-6">
                                    {/* Text Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Watermark Text</label>
                                        <input
                                            type="text"
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Enter text..."
                                        />
                                    </div>

                                    {/* Settings Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Opacity */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Opacity: {Math.round(opacity * 100)}%</label>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="1"
                                                step="0.1"
                                                value={opacity}
                                                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>

                                        {/* Rotation */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Rotation: {rotation}°</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="360"
                                                step="45"
                                                value={rotation}
                                                onChange={(e) => setRotation(parseInt(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>

                                        {/* Font Size */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Font Size: {fontSize}px</label>
                                            <input
                                                type="range"
                                                min="20"
                                                max="200"
                                                step="10"
                                                value={fontSize}
                                                onChange={(e) => setFontSize(parseInt(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAddWatermark}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                                    >
                                        Add Watermark
                                        <Stamp className="ml-2 w-4 h-4" />
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
                                    Watermark added! Download should start automatically.
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
