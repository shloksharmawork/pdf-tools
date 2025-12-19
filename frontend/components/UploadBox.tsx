"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, File, X } from 'lucide-react'

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
    description = "or drop PDF here",
    title = "Select PDF file",
    accept = { 'application/pdf': ['.pdf'] },
    isSmall = false
}: UploadBoxProps) {
    const [error, setError] = useState<string | null>(null)

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
        setError(null)
        if (fileRejections.length > 0) {
            const rejection = fileRejections[0]
            if (rejection.errors[0].code === 'file-too-large') {
                setError('File is too large. Max size is 25MB.')
            } else {
                setError('Invalid file type. Please check the allowed formats.')
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
    }, [onFileSelect, multiple])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        multiple,
        maxSize: 25 * 1024 * 1024, // 25MB
    })

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div
                {...getRootProps()}
                className={`
          flex flex-col items-center justify-center w-full ${isSmall ? 'h-32' : 'h-64'}
          border-2 border-dashed rounded-2xl cursor-pointer transition-colors duration-200
          ${isDragActive ? 'border-primary bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
        `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <UploadCloud className={`w-12 h-12 mb-4 ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
                    <p className="mb-2 text-xl font-semibold text-gray-700">
                        {isDragActive ? 'Drop file here' : title}
                    </p>
                    <p className="text-gray-500 text-sm">{description}</p>
                </div>
            </div>
            {error && (
                <div className="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg flex items-center">
                    <X className="w-4 h-4 mr-2" />
                    {error}
                </div>
            )}
        </div>
    )
}
