"use client"

import { useState } from 'react'
import UploadBox from '../../../components/UploadBox'
import ProgressBar from '../../../components/ProgressBar'
import api, { downloadFile } from '../../../lib/api'
import { Unlock, Lock, AlertTriangle } from 'lucide-react'
import { FadeIn } from '../../../components/Animations'

export default function UnlockPDF() {
    const [file, setFile] = useState<File | null>(null)
    const [password, setPassword] = useState('')
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleFileSelect = (files: File[]) => {
        setFile(files[0])
        setStatus('idle')
        setErrorMessage(null)
        setPassword('')
    }

    const handleUnlock = async () => {
        if (!file) return

        setStatus('uploading')
        setErrorMessage(null)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('password', password)

        try {
            const response = await api.post('/unlock', formData, {
                responseType: 'blob',
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
                    setUploadProgress(progress)
                    if (progress === 100) setStatus('processing')
                },
            })

            setStatus('completed')
            downloadFile(response.data, `unlocked_${file.name}`)
        } catch (error: any) {
            setStatus('error')
            if (error.response && error.response.status === 400) {
                // Try to read blob as text to get error message
                const reader = new FileReader();
                reader.onload = function () {
                    try {
                        const errorJson = JSON.parse(reader.result as string);
                        setErrorMessage(errorJson.detail || "Invalid password.");
                    } catch (e) {
                        setErrorMessage("Invalid password or corrupt file.");
                    }
                }
                reader.readAsText(error.response.data);
            } else {
                setErrorMessage('An unexpected error occurred. Please try again.')
            }
        }
    }

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Unlock PDF</h1>
            <p className="text-gray-600 mb-8">Remove security from your PDF file (Password Required).</p>

            {!file ? (
                <FadeIn>
                    <UploadBox onFileSelect={handleFileSelect} description="Drop your protected PDF here" />
                </FadeIn>
            ) : (
                <FadeIn>
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-lg mx-auto">
                        <div className="flex items-center justify-center mb-6">
                            <div className="bg-pink-100 p-4 rounded-full">
                                <Unlock className="w-8 h-8 text-pink-600" />
                            </div>
                        </div>

                        <p className="font-medium text-gray-900 mb-6 truncate">{file.name}</p>

                        {status === 'idle' || status === 'error' ? (
                            <div className="space-y-4">
                                <div className="text-left bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                                    <div className="flex items-start">
                                        <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold text-blue-800">Unlock / Bypass Security</p>
                                            <p className="text-xs text-blue-700 mt-1">
                                                If you know the password, enter it below for instant unlocking.
                                                If not, leave it blank and we will attempt to bypass security restrictions (Owner Password).
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-left text-sm font-medium text-gray-700 mb-1">
                                        PDF Password (Optional)
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                                        placeholder="Enter password (if known)"
                                    />
                                </div>

                                {errorMessage && (
                                    <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setFile(null)}
                                        className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        Change File
                                    </button>
                                    <button
                                        onClick={handleUnlock}
                                        className="flex-1 py-2 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium shadow-md shadow-pink-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {password ? "Unlock PDF" : "Attempt Bypass"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-lg font-medium text-gray-900 mb-2">
                                    {status === 'uploading' ? 'Uploading...' : 'Unlocking...'}
                                </p>
                                <ProgressBar progress={uploadProgress} />
                                {status === 'completed' && (
                                    <div className="mt-4 text-green-600 font-medium animate-pulse">
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
