"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, AlertCircle, FileCheck } from 'lucide-react'

interface UploadBoxProps {
    onFileSelect: (files: File[]) => void
    multiple?: boolean
    description?: string
    title?: string
    accept?: Record<string, string[]>
    isSmall?: boolean
}

export default function UploadBox({
    onFileSelect,
    multiple = false,
    description = "or drop PDF files here",
    title = "Select PDF files",
    accept = { 'application/pdf': ['.pdf'] },
    isSmall = false,
}: UploadBoxProps) {
    const [error, setError] = useState<string | null>(null)

    const onDrop = useCallback(
        (acceptedFiles: File[], fileRejections: any[]) => {
            setError(null)
            if (fileRejections.length > 0) {
                const rejection = fileRejections[0]
                if (rejection.errors[0].code === 'file-too-large') {
                    setError('File is too large. Maximum size allowed is 25MB.')
                } else {
                    setError('Invalid file format. Please upload supported file types.')
                }
                return
            }

            if (acceptedFiles.length > 0) {
                if (!multiple) {
                    onFileSelect([acceptedFiles[0]])
                } else {
                    onFileSelect(acceptedFiles)
                }
            }
        },
        [onFileSelect, multiple]
    )

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        multiple,
        maxSize: 25 * 1024 * 1024, // 25MB
    })

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div
                {...getRootProps()}
                className={`
                    relative group flex flex-col items-center justify-center w-full
                    ${isSmall ? 'py-8 px-4' : 'py-14 px-6'}
                    border-2 border-dashed rounded-3xl cursor-pointer
                    transition-all duration-300 transform
                    ${
                        isDragActive
                            ? 'border-red-500 bg-red-50/60 scale-[1.01] shadow-lg shadow-red-100'
                            : 'border-gray-200 bg-gradient-to-b from-gray-50/70 to-white hover:border-red-400 hover:bg-red-50/20 hover:shadow-md'
                    }
                `}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center justify-center text-center">
                    <div
                        className={`
                            w-16 h-16 rounded-2xl flex items-center justify-center mb-4
                            transition-transform duration-300 group-hover:scale-110 shadow-sm
                            ${isDragActive ? 'bg-red-500 text-white animate-bounce' : 'bg-red-50 text-primary'}
                        `}
                    >
                        <UploadCloud className="w-8 h-8" />
                    </div>

                    <button
                        type="button"
                        className="px-6 py-2.5 rounded-xl bg-primary hover:bg-red-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 mb-3"
                    >
                        {isDragActive ? 'Drop files here' : title}
                    </button>

                    <p className="text-gray-500 text-sm font-medium mb-2">{description}</p>

                    <div className="inline-flex items-center gap-2 text-xs text-gray-400">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Fast processing • Up to 25MB free</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    )
}
