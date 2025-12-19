"use client"

import { useState, useRef, useEffect } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { PenTool, Upload, Eraser, Grid3X3, Check } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'

export default function SignPDF() {
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    // Signature State
    const [signMode, setSignMode] = useState<'draw' | 'upload'>('draw')
    const [signatureFile, setSignatureFile] = useState<File | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasDrawn, setHasDrawn] = useState(false)

    // Config State
    const [pageNum, setPageNum] = useState(1)
    const [position, setPosition] = useState<{ x: number, y: number, label: string }>({ x: 450, y: 50, label: 'Bottom Right' })

    // Drawing Logic
    const startDrawing = (e: any) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        setIsDrawing(true)
        const rect = canvas.getBoundingClientRect()
        const x = (e.clientX || e.touches[0].clientX) - rect.left
        const y = (e.clientY || e.touches[0].clientY) - rect.top
        ctx.beginPath()
        ctx.moveTo(x, y)
    }

    const draw = (e: any) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        const x = (e.clientX || e.touches[0].clientX) - rect.left
        const y = (e.clientY || e.touches[0].clientY) - rect.top

        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineTo(x, y)
        ctx.stroke()
        setHasDrawn(true)
    }

    const stopDrawing = () => {
        setIsDrawing(false)
    }

    const clearCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setHasDrawn(false)
    }

    const handleFileSelect = (files: File[]) => {
        setFile(files[0])
        setStatus('idle')
        setErrorMessage(null)
    }

    const handleSign = async () => {
        if (!file) return

        let finalSignatureBlob: Blob | null = null

        if (signMode === 'upload') {
            if (!signatureFile) {
                setErrorMessage("Please upload a signature image.")
                return
            }
            finalSignatureBlob = signatureFile
        } else {
            if (!hasDrawn) {
                setErrorMessage("Please draw a signature.")
                return
            }
            const canvas = canvasRef.current
            if (!canvas) return

            // Convert canvas to blob
            finalSignatureBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
        }

        if (!finalSignatureBlob) return

        setStatus('uploading')
        setErrorMessage(null)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('signature', finalSignatureBlob, 'signature.png')
        formData.append('page_num', pageNum.toString())
        formData.append('x', position.x.toString())
        formData.append('y', position.y.toString())

        try {
            const response = await api.post('/sign', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, `signed_${file.name}`)
        } catch (error) {
            setStatus('error')
            setErrorMessage('Failed to sign PDF. Please try again.')
        }
    }

    const positions = [
        { label: 'TL', x: 50, y: 700 }, { label: 'TC', x: 250, y: 700 }, { label: 'TR', x: 450, y: 700 },
        { label: 'CL', x: 50, y: 400 }, { label: 'CC', x: 250, y: 400 }, { label: 'CR', x: 450, y: 400 },
        { label: 'BL', x: 50, y: 50 }, { label: 'BC', x: 250, y: 50 }, { label: 'BR', x: 450, y: 50 },
    ]

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Sign PDF</h1>
            <p className="text-gray-600 mb-8">Add a signature to your PDF document.</p>

            {!file ? (
                <FadeIn>
                    <UploadBox onFileSelect={handleFileSelect} description="Drop PDF to sign here" />
                </FadeIn>
            ) : (
                <FadeIn>
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                        <div className="flex items-center justify-center mb-6">
                            <div className="bg-indigo-100 p-4 rounded-full">
                                <PenTool className="w-8 h-8 text-indigo-600" />
                            </div>
                        </div>

                        <p className="font-medium text-gray-900 mb-6 truncate">{file.name}</p>

                        {status === 'idle' || status === 'error' ? (
                            <div className="space-y-8 text-left">
                                {/* Signature Input Section */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">1. Create Signature</label>
                                    <div className="flex gap-4 mb-4">
                                        <button
                                            onClick={() => setSignMode('draw')}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${signMode === 'draw' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            Draw
                                        </button>
                                        <button
                                            onClick={() => setSignMode('upload')}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${signMode === 'upload' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            Upload Image
                                        </button>
                                    </div>

                                    {signMode === 'draw' ? (
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center bg-gray-50">
                                            <canvas
                                                ref={canvasRef}
                                                width={400}
                                                height={150}
                                                className="bg-white rounded-lg shadow-sm border border-gray-200 cursor-crosshair touch-none"
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseLeave={stopDrawing}
                                                onTouchStart={startDrawing}
                                                onTouchMove={draw}
                                                onTouchEnd={stopDrawing}
                                            />
                                            <button
                                                onClick={clearCanvas}
                                                className="mt-3 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                                            >
                                                <Eraser className="w-3 h-3" /> Clear Signature
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50">
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Configuration Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">2. Position</label>
                                        <div className="grid grid-cols-3 gap-2 w-32 mx-auto md:mx-0">
                                            {positions.map((pos) => (
                                                <button
                                                    key={pos.label}
                                                    onClick={() => setPosition(pos)}
                                                    className={`w-10 h-10 rounded border flex items-center justify-center text-xs font-medium transition-all ${position.label === pos.label
                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                            : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                                                        }`}
                                                >
                                                    {pos.label}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-center md:text-left text-gray-500 mt-2">Selected: {position.label}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">3. Page Number</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={pageNum}
                                            onChange={(e) => setPageNum(parseInt(e.target.value) || 1)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                </div>

                                {errorMessage && (
                                    <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
                                )}

                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => setFile(null)}
                                        className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        Change File
                                    </button>
                                    <button
                                        onClick={handleSign}
                                        className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md shadow-indigo-200 transition-colors"
                                    >
                                        Sign PDF
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-lg font-medium text-gray-900 mb-2">
                                    {status === 'uploading' ? 'Uploading...' : 'Signing PDF...'}
                                </p>
                                <ProgressBar progress={uploadProgress} />
                                {status === 'completed' && (
                                    <div className="mt-4 text-indigo-600 font-medium animate-pulse">
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
