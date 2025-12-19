import Link from 'next/link'
import { FileText } from 'lucide-react'

export default function Header() {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <FileText className="h-8 w-8 text-primary" />
                    <span className="text-xl font-bold tracking-tight text-gray-900">PDF Tools</span>
                </Link>
                <nav className="hidden md:flex space-x-6">
                    <Link href="/tools/merge" className="text-gray-600 hover:text-primary font-medium transition-colors">Merge</Link>
                    <Link href="/tools/split" className="text-gray-600 hover:text-primary font-medium transition-colors">Split</Link>
                    <Link href="/tools/compress" className="text-gray-600 hover:text-primary font-medium transition-colors">Compress</Link>
                    <Link href="/tools/unlock" className="text-gray-600 hover:text-primary font-medium transition-colors">Unlock</Link>
                    <Link href="/tools/protect" className="text-gray-600 hover:text-primary font-medium transition-colors">Protect</Link>
                </nav>
            </div>
        </header>
    )
}
