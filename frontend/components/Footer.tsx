export default function Footer() {
    return (
        <footer className="bg-gray-50 border-t border-gray-100">
            <div className="container mx-auto px-4 py-8">
                <div className="text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} PDF Tools. All rights reserved.</p>
                    <p className="mt-2">Free, Secure, and Private. Files are automatically deleted after 10 minutes.</p>
                </div>
            </div>
        </footer>
    )
}
