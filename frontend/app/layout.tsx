import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'PDF Tools - Merge, Split, Compress, Unlock PDFs Free',
    description: 'Free, secure, and easy-to-use online PDF tools. Merge, split, compress, unlock, and protect PDF files without login.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-grow container mx-auto px-4 py-8">
                        {children}
                    </main>
                    <Footer />
                </div>
            </body>
        </html>
    )
}
