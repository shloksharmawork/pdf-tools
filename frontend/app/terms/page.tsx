export default function TermsOfService() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

            <div className="prose prose-lg max-w-none text-gray-600">
                <p className="mb-6">Last updated: {new Date().toLocaleDateString()}</p>

                <section className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">1. Usage Rights</h2>
                    <p>
                        Our PDF tools are free to use for personal and commercial purposes. You agree to use the service only for lawful purposes.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">2. Upload Restrictions</h2>
                    <p>
                        You agree not to upload:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li>Files containing malware, viruses, or malicious code.</li>
                        <li>Content that violates copyright or intellectual property rights.</li>
                        <li>Illegal or harmful content.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">3. Disclaimer</h2>
                    <p>
                        The software is provided "as is", without warranty of any kind. We are not liable for any damages or data loss resulting from the use of our tools.
                        While we strive for high availability and accuracy, we do not guarantee uninterrupted service.
                    </p>
                </section>
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">4. PDF Unlocking</h2>
                    <p>
                        The "Unlock PDF" tool is provided solely for users who have the legal right to access the content. You must possess the password to use this feature.
                        We do not provide password cracking services.
                    </p>
                </section>
            </div>
        </div>
    )
}
