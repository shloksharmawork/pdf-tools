"use client"

import { useState, useRef, useEffect } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { Crop } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'
import dynamic from 'next/dynamic'

const Document = dynamic(() => import('react-pdf').then(mod => mod.Document), { ssr: false })
const Page = dynamic(() => import('react-pdf').then(mod => mod.Page), { ssr: false })



interface CropBox {
    x: number // percentage 0-1
    y: number // percentage 0-1
    width: number // percentage 0-1
    height: number // percentage 0-1
}

export default function CropPDF() {
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [uploadProgress, setUploadProgress] = useState(0)

    // PDF Rendering
    const [numPages, setNumPages] = useState<number>(0)
    const [pageWidth, setPageWidth] = useState<number>(0)
    const [pageHeight, setPageHeight] = useState<number>(0)

    // Crop State
    const [crop, setCrop] = useState<CropBox>({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null)
    const [imgRef, setImgRef] = useState<HTMLDivElement | null>(null)

    useEffect(() => {
        (async () => {
            const { pdfjs } = await import('react-pdf');
            pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        })();
    }, [])

    const handleFileSelect = (files: File[]) => {
        setFile(files[0])
        setStatus('idle')
    }

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages)
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!imgRef) return
        const rect = imgRef.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height

        setIsDragging(true)
        setDragStart({ x, y })
        setCrop({ x, y, width: 0, height: 0 })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !dragStart || !imgRef) return

        const rect = imgRef.getBoundingClientRect()
        const currentX = (e.clientX - rect.left) / rect.width
        const currentY = (e.clientY - rect.top) / rect.height

        const x = Math.min(currentX, dragStart.x)
        const y = Math.min(currentY, dragStart.y)
        const width = Math.abs(currentX - dragStart.x)
        const height = Math.abs(currentY - dragStart.y)

        // Clamp to 0-1
        setCrop({
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: Math.min(1 - x, width),
            height: Math.min(1 - y, height)
        })
    }

    const handleMouseUp = () => {
        setIsDragging(false)
        setDragStart(null)
    }

    const handleCrop = async () => {
        if (!file) return
        setStatus('uploading')

        const formData = new FormData()
        formData.append('file', file)
        formData.append('x', crop.x.toString())
        formData.append('y', crop.y.toString())
        formData.append('width', crop.width.toString())
        formData.append('height', crop.height.toString())

        try {
            const response = await api.post('/crop', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, `cropped_${file.name}`)
        } catch (error) {
            setStatus('error')
            console.error(error)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4" onMouseUp={handleMouseUp}>
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Crop PDF</h1>

            <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8">
                <UploadBox onFileSelect={handleFileSelect} description="Drop PDF to crop (Applied to all pages)" />

                {file && (
                    <FadeIn>
                        <div className="mt-6 flex flex-col md:flex-row gap-6">
                            {/* Preview Area */}
                            <div className="flex-1 bg-gray-100 rounded-lg p-4 flex justify-center overflow-hidden select-none relative">
                                <Document
                                    file={file}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    className="max-w-full"
                                >
                                    <div
                                        className="relative cursor-crosshair"
                                        ref={setImgRef}
                                        onMouseDown={handleMouseDown}
                                        onMouseMove={handleMouseMove}
                                    >
                                        <Page
                                            pageNumber={1}
                                            width={500}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                        />

                                        {/* Crop Overlay */}
                                        <div
                                            className="absolute border-2 border-indigo-500 bg-indigo-500/20"
                                            style={{
                                                left: `${crop.x * 100}%`,
                                                top: `${crop.y * 100}%`,
                                                width: `${crop.width * 100}%`,
                                                height: `${crop.height * 100}%`
                                            }}
                                        />
                                    </div>
                                </Document>
                            </div>

                            {/* Controls */}
                            <div className="w-72 space-y-6">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <h3 className="font-medium text-gray-700 mb-2">Crop Details</h3>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>X: {(crop.x * 100).toFixed(1)}%</p>
                                        <p>Y: {(crop.y * 100).toFixed(1)}%</p>
                                        <p>Width: {(crop.width * 100).toFixed(1)}%</p>
                                        <p>Height: {(crop.height * 100).toFixed(1)}%</p>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Selection on Page 1 is applied to all pages.</p>
                                </div>

                                {status === 'idle' && (
                                    <button
                                        onClick={handleCrop}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                                    >
                                        Crop PDF
                                        <Crop className="ml-2 w-4 h-4" />
                                    </button>
                                )}

                                {(status === 'uploading' || status === 'processing') && (
                                    <>
                                        <p className="text-sm text-gray-500 text-center mb-2">{status === 'processing' ? 'Processing...' : 'Uploading...'}</p>
                                        <ProgressBar progress={uploadProgress} />
                                    </>
                                )}

                                {status === 'completed' && (
                                    <div className="text-center text-green-600 font-medium p-4 bg-green-50 rounded-lg">
                                        Cropped successfully!
                                        <button onClick={() => { setFile(null); setStatus('idle') }} className="block mx-auto mt-2 text-sm text-green-700 underline">
                                            Crop another file
                                        </button>
                                    </div>
                                )}

                                {status === 'error' && (
                                    <div className="text-center text-red-600 font-medium p-4 bg-red-50 rounded-lg">
                                        Error processing file.
                                        <button onClick={() => setStatus('idle')} className="block mx-auto mt-2 text-sm text-red-700 underline">
                                            Try again
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </FadeIn>
                )}
            </div>
        </div>
    )
}
