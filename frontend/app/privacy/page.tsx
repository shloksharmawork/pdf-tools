export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

            <div className="prose prose-lg max-w-none text-gray-600">
                <p className="mb-6">Last updated: {new Date().toLocaleDateString()}</p>

                <section className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">1. File Handling & Retention</h2>
                    <p>
                        Your privacy is our priority. We operate with a strict "No Retention" policy for processed files.
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li>Files uploaded to our servers are stored in a temporary directory purely for processing purposes.</li>
                        <li>All files are <strong>automatically deleted</strong> immediately after the processed file is generated or within 10 minutes of upload, whichever comes first.</li>
                        <li>We do not create backups of your user content.</li>
                        <li>We do not view, list, or share your files.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">2. Data Collection</h2>
                    <p>
                        We do not require user accounts, so we do not collect names, emails, or personal contact information.
                        We may collect standard server logs (IP address, browser type, timestamp) for security monitoring, rate limiting, and abuse prevention.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">3. Security</h2>
                    <p>
                        We adhere to strict security practices:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li>All data transfer is encrypted via HTTPS (SSL/TLS).</li>
                        <li>For the "Unlock PDF" feature, we strictly require the correct password. We do not attempt to crack, guess, or brute-force PDF passwords.</li>
                    </ul>
                </section>
            </div>
        </div>
    )
}
