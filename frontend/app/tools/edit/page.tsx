"use client"

import { useState, useRef, useEffect } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { Type, Image as ImageIcon, Move, Download, Trash, MousePointer } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'
import dynamic from 'next/dynamic'

const Document = dynamic(() => import('react-pdf').then(mod => mod.Document), { ssr: false })
const Page = dynamic(() => import('react-pdf').then(mod => mod.Page), { ssr: false })

type EditElement = {
    id: string
    type: 'text' | 'image'
    page: number
    x: number
    y: number
    content?: string // for text
    file?: File // for images
    width?: number // for images or text wrap
    height?: number
    fontSize?: number
    color?: string
}

export default function EditPDF() {
    useEffect(() => {
        (async () => {
            const { pdfjs } = await import('react-pdf');
            pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        })();
    }, []);

    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [uploadProgress, setUploadProgress] = useState(0)

    // PDF State
    const [numPages, setNumPages] = useState<number>(0)
    const [pageNumber, setPageNumber] = useState(1)
    const [scale, setScale] = useState(1.0)
    const pdfContainerRef = useRef<HTMLDivElement>(null)

    // Tools
    const [activeTool, setActiveTool] = useState<'select' | 'text' | 'image'>('select')
    const [elements, setElements] = useState<EditElement[]>([])
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null)

    // Text styling
    const [fontSize, setFontSize] = useState(16)
    const [color, setColor] = useState('#000000')

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages)
    }

    const handleFileSelect = (files: File[]) => {
        setFile(files[0])
        setStatus('idle')
        setElements([])
    }

    const handlePageClick = (e: React.MouseEvent, pageIndex: number) => {
        if (activeTool === 'text') {
            const rect = (e.target as HTMLElement).getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            const newElement: EditElement = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'text',
                page: pageIndex + 1,
                x,
                y,
                content: 'Double click to edit',
                fontSize,
                color
            }
            setElements([...elements, newElement])
            setActiveTool('select')
            setSelectedElementId(newElement.id)
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const imgFile = e.target.files[0]
            const newElement: EditElement = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'image',
                page: pageNumber,
                x: 100,
                y: 100,
                width: 200,
                height: 150, // Aspect ratio could be fixed later
                file: imgFile
            }
            setElements([...elements, newElement])
            setActiveTool('select')
        }
    }

    // Dragging State
    const draggingRef = useRef<{ id: string, startX: number, startY: number, initialElX: number, initialElY: number } | null>(null)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!draggingRef.current) return

            const { id, startX, startY, initialElX, initialElY } = draggingRef.current
            const deltaX = e.clientX - startX
            const deltaY = e.clientY - startY

            setElements(prev => prev.map(el => {
                if (el.id === id) {
                    return { ...el, x: initialElX + deltaX, y: initialElY + deltaY }
                }
                return el
            }))
        }

        const handleMouseUp = () => {
            draggingRef.current = null
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    const handleElementMouseDown = (e: React.MouseEvent, id: string, initialX: number, initialY: number) => {
        e.stopPropagation()
        e.preventDefault() // Prevent text selection
        setSelectedElementId(id)
        draggingRef.current = {
            id,
            startX: e.clientX,
            startY: e.clientY,
            initialElX: initialX,
            initialElY: initialY
        }
    }
    const updateElement = (id: string, updates: Partial<EditElement>) => {
        setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el))
    }

    const deleteElement = (id: string) => {
        setElements(elements.filter(el => el.id !== id))
        setSelectedElementId(null)
    }

    const handleDownload = async () => {
        if (!file) return
        setStatus('uploading')

        // Prepare edits
        // WARNING: Coordinates need to be scaled to PDF points (72 DPI)
        // react-pdf renders at scale * 72DPI roughly, but let's assume 1px = 1pt for simplicity if scale=1
        // We usually need the original page size to be accurate.
        // For MVP, passing raw coordinates and relying on the user "seeing" it might be off if we don't normalize.
        // Let's assume the PDF is rendered at 100% size (approx 72dpi/96dpi screen). 
        // A better approach is to get the Page originalWidth and use (vals / renderedWidth) * originalWidth
        // But for now, we send raw and hope PyMuPDF interprets similarly (points).

        const editsPayload = elements.map(el => {
            if (el.type === 'text') {
                return {
                    type: 'text',
                    page: el.page,
                    x: el.x, // Adjust for scale if needed: el.x / scale
                    y: el.y, // el.y / scale
                    text: el.content,
                    fontSize: (el.fontSize || 12),
                    color: el.color
                }
            } else {
                return {
                    type: 'image',
                    page: el.page,
                    x: el.x,
                    y: el.y,
                    width: el.width,
                    height: el.height,
                    imageId: el.file?.name // Backend maps this
                }
            }
        })

        const formData = new FormData()
        formData.append('file', file)
        formData.append('edits', JSON.stringify(editsPayload))

        // Append images
        elements.forEach(el => {
            if (el.type === 'image' && el.file) {
                formData.append('images', el.file)
            }
        })

        try {
            const response = await api.post('/edit', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, `edited_${file.name}`)
        } catch (error) {
            setStatus('error')
            console.error(error)
        }
    }

    return (
        <div className="h-screen flex flex-col bg-gray-100">
            {/* Toolbar */}
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between z-10 sticky top-0 md:static">
                <div className="flex items-center gap-4">
                    <h1 className="font-bold text-gray-800">Edit PDF</h1>
                    <div className="h-6 w-px bg-gray-300"></div>

                    <button
                        onClick={() => setActiveTool('select')}
                        className={`p-2 rounded hover:bg-gray-100 ${activeTool === 'select' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600'}`}
                        title="Select & Move"
                    >
                        <MousePointer className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => setActiveTool('text')}
                        className={`p-2 rounded hover:bg-gray-100 ${activeTool === 'text' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600'}`}
                        title="Add Text"
                    >
                        <Type className="w-5 h-5" />
                    </button>

                    <label className={`p-2 rounded hover:bg-gray-100 cursor-pointer ${activeTool === 'image' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600'}`}>
                        <ImageIcon className="w-5 h-5" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                        disabled={status === 'uploading' || status === 'processing'}
                    >
                        {status === 'uploading' ? 'Uploading...' : status === 'processing' ? 'Processing...' : <><Download className="w-4 h-4" /> Download</>}
                    </button>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-auto flex justify-center p-8 bg-gray-200 relative">
                {!file ? (
                    <div className="max-w-xl w-full">
                        <UploadBox onFileSelect={handleFileSelect} description="Drop PDF to edit" />
                    </div>
                ) : (
                    <div ref={pdfContainerRef} className="relative shadow-lg">
                        <Document
                            file={file}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={(error) => console.error('Error loading PDF:', error)}
                            className="flex flex-col gap-4"
                        >
                            {Array.from(new Array(numPages), (el, index) => (
                                <div key={`page_${index + 1}`} className="relative bg-white" onClick={(e) => handlePageClick(e, index)}>
                                    <Page
                                        pageNumber={index + 1}
                                        renderAnnotationLayer={false}
                                        renderTextLayer={false}
                                        scale={scale}
                                    />

                                    {/* Overlay Elements for this page */}
                                    {elements.filter(el => el.page === index + 1).map(el => (
                                        <div
                                            key={el.id}
                                            className={`absolute cursor-move group ${selectedElementId === el.id ? 'ring-2 ring-indigo-500' : ''}`}
                                            style={{
                                                left: el.x,
                                                top: el.y,
                                                color: el.color,
                                                fontSize: `${el.fontSize}px`
                                            }}
                                            onMouseDown={(e) => handleElementMouseDown(e, el.id, el.x, el.y)}
                                        >
                                            {el.type === 'text' ? (
                                                <div
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => updateElement(el.id, { content: e.currentTarget.textContent || '' })}
                                                    className="outline-none whitespace-pre p-1 hover:bg-indigo-50/50"
                                                >
                                                    {el.content}
                                                </div>
                                            ) : (
                                                el.file && (
                                                    <img
                                                        src={URL.createObjectURL(el.file)}
                                                        alt="upload"
                                                        style={{ width: el.width, height: el.height }}
                                                        className="pointer-events-none"
                                                    />
                                                )
                                            )}

                                            {selectedElementId === el.id && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteElement(el.id) }}
                                                    className="absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full shadow-sm hover:bg-red-700"
                                                >
                                                    <Trash className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </Document>
                    </div>
                )}
            </div>

            {/* Property Bar (Right side or Floating) for Selected Element */}
            {selectedElementId && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-xl border border-gray-200 flex items-center gap-4 animate-in slide-in-from-bottom-4">
                    {elements.find(el => el.id === selectedElementId)?.type === 'text' && (
                        <>
                            <input
                                type="number"
                                value={elements.find(el => el.id === selectedElementId)?.fontSize}
                                onChange={(e) => updateElement(selectedElementId, { fontSize: parseInt(e.target.value) })}
                                className="w-16 border rounded px-2 py-1 text-sm"
                                title="Font Size"
                            />
                            <input
                                type="color"
                                value={elements.find(el => el.id === selectedElementId)?.color}
                                onChange={(e) => updateElement(selectedElementId, { color: e.target.value })}
                                className="w-8 h-8 rounded cursor-pointer"
                                title="Color"
                            />
                        </>
                    )}
                    <span className="text-sm text-gray-500">Drag to move • Click text to edit</span>
                </div>
            )}
        </div>
    )
}
