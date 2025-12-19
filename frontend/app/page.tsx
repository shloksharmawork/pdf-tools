import ToolCard from '../components/ToolCard'

export default function Home() {
    const toolGroups = [
        {
            group: "Organize PDF",
            tools: [
                { title: "Merge PDF", slug: "merge", active: true },
                { title: "Split PDF", slug: "split", active: true },
                { title: "Remove pages", slug: "remove-pages", active: true },
                { title: "Extract pages", slug: "extract-pages", active: true },
                { title: "Organize PDF", slug: "organize", active: true },
                { title: "Scan to PDF", slug: "scan", active: true },
            ],
        },
        {
            group: "Optimize PDF",
            tools: [
                { title: "Compress PDF", slug: "compress", active: true },
                { title: "Optimize PDF", slug: "optimize", active: true },
                { title: "Repair PDF", slug: "repair", active: true },
                { title: "OCR PDF", slug: "ocr", active: true },
            ],
        },
        {
            group: "Convert to PDF",
            tools: [
                { title: "JPG to PDF", slug: "jpg-to-pdf", active: true },
                { title: "WORD to PDF", slug: "word-to-pdf", active: true },
                { title: "POWERPOINT to PDF", slug: "ppt-to-pdf", active: true },
                { title: "EXCEL to PDF", slug: "excel-to-pdf", active: true },
                { title: "HTML to PDF", slug: "html-to-pdf", active: true },
            ],
        },
        {
            group: "Convert from PDF",
            tools: [
                { title: "PDF to JPG", slug: "pdf-to-jpg", active: true },
                { title: "PDF to WORD", slug: "pdf-to-word", active: true },
                { title: "PDF to POWERPOINT", slug: "pdf-to-ppt", active: true },
                { title: "PDF to EXCEL", slug: "pdf-to-excel", active: true },
                { title: "PDF to PDF/A", slug: "pdf-to-pdfa", active: true },
            ],
        },
        {
            group: "Edit PDF",
            tools: [
                { title: "Edit PDF", slug: "edit", active: true },
                { title: "Rotate PDF", slug: "rotate", active: true },
                { title: "Add page numbers", slug: "page-numbers", active: true },
                { title: "Add watermark", slug: "watermark", active: true },
                { title: "Crop PDF", slug: "crop", active: true },
            ],
        },
        {
            group: "PDF Security",
            tools: [
                { title: "Unlock PDF", slug: "unlock", active: true },
                { title: "Protect PDF", slug: "protect", active: true },
                { title: "Sign PDF", slug: "sign", active: true },
                { title: "Redact PDF", slug: "redact", active: true },
                { title: "Compare PDF", slug: "compare", active: true },
            ],
        },
    ];

    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center mb-16 max-w-2xl px-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                    Every tool you need to work with PDFs in one place
                </h1>
                <p className="text-xl text-gray-500">
                    All the tools you need to use PDFs, at your fingertips. All are 100% FREE and easy to use!
                </p>
            </div>

            <div className="w-full max-w-6xl px-4">
                {toolGroups.map((group) => (
                    <div key={group.group} className="w-full mb-12">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">{group.group}</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {group.tools.map((tool) => (
                                <ToolCard
                                    key={tool.title}
                                    title={tool.title}
                                    href={tool.active ? `/tools/${tool.slug}` : "#"}
                                    disabled={!tool.active}
                                    badge={!tool.active ? "Coming Soon" : undefined}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
