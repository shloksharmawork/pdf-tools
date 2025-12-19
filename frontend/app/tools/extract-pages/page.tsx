"use client"

import { useState } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { File as FileIcon, X } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'

export default function ExtractPagesPDF() {
    const [file, setFile] = useState<File | null>(null)
    const [pagesToExtract, setPagesToExtract] = useState('')
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleFileSelect = (newFiles: File[]) => {
        if (newFiles.length > 0) {
            setFile(newFiles[0])
            setStatus('idle')
            setErrorMessage(null)
        }
    }

    const removeFile = () => {
        setFile(null)
        setPagesToExtract('')
    }

    const handleExtractPages = async () => {
        if (!file) {
            setErrorMessage("Please select a PDF file.")
            return
        }

        if (!pagesToExtract) {
            setErrorMessage("Please enter page numbers to extract.")
            return
        }

        const pagePattern = /^[\d,\s]+$/;
        if (!pagePattern.test(pagesToExtract)) {
            setErrorMessage("Please enter valid page numbers separated by commas (e.g., 1, 3, 5).")
            return
        }

        setStatus('uploading')
        setErrorMessage(null)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('pages', pagesToExtract)

        try {
            const response = await api.post('/extract-pages/', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, `extracted_pages_${file.name}`)
        } catch (error: any) {
            setStatus('error')
            let msg = 'Failed to extract pages. Please check if page numbers are valid.'

            if (error.response?.data instanceof Blob) {
                try {
                    const text = await error.response.data.text()
                    const json = JSON.parse(text)
                    if (json.detail) msg = json.detail
                } catch (e) {
                    // fallback
                }
            } else if (error.response?.data?.detail) {
                msg = error.response.data.detail
            } else if (error.message) {
                msg = error.message
            }
            setErrorMessage(msg)
        }
    }

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Extract Pages</h1>
            <p className="text-gray-600 mb-8">Select specific pages to extract and create a new PDF.</p>

            {status === 'idle' || status === 'error' ? (
                <FadeIn>
                    <div className="space-y-6">
                        {!file ? (
                            <UploadBox onFileSelect={handleFileSelect} multiple={false} description="Drop PDF here" />
                        ) : (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto text-left">
                                <h3 className="font-semibold text-gray-700 mb-4">Selected File</h3>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-6">
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <FileIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                    </div>
                                    <button onClick={removeFile} className="text-gray-400 hover:text-red-500">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <label htmlFor="pages" className="block text-sm font-medium text-gray-700 mb-2">
                                        Pages to extract (comma-separated, e.g., 1, 3, 5)
                                    </label>
                                    <input
                                        type="text"
                                        id="pages"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                        placeholder="e.g. 1, 3, 5"
                                        value={pagesToExtract}
                                        onChange={(e) => setPagesToExtract(e.target.value)}
                                    />
                                </div>

                                {errorMessage && (
                                    <div className="text-red-500 text-sm mb-4 text-center">{errorMessage}</div>
                                )}

                                <div className="flex justify-center">
                                    <button
                                        onClick={handleExtractPages}
                                        className="w-full md:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-200 transition-all transform hover:-translate-y-0.5"
                                    >
                                        Extract Pages
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </FadeIn>
            ) : (
                <FadeIn>
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-lg mx-auto">
                        <div className="text-center py-4">
                            <p className="text-lg font-medium text-gray-900 mb-2">
                                {status === 'uploading' ? 'Uploading file...' : 'Processing PDF...'}
                            </p>
                            <ProgressBar progress={uploadProgress} />
                            {status === 'completed' && (
                                <div className="mt-4 text-green-600 font-medium animate-pulse">
                                    Download starting...
                                </div>
                            )}
                            {status === 'completed' && (
                                <div className="mt-6 flex gap-4 justify-center">
                                    <button
                                        onClick={() => { removeFile(); setStatus('idle'); }}
                                        className="text-sm text-gray-500 hover:text-gray-900 underline"
                                    >
                                        Extract from another PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </FadeIn>
            )}
        </div>
    )
}
