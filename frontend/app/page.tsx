import ToolCard from '../components/ToolCard'
import {
    Layers,
    Scissors,
    Trash2,
    FileOutput,
    LayoutGrid,
    Scan,
    Minimize2,
    Zap,
    Wrench,
    Search,
    Image,
    FileText,
    FileSpreadsheet,
    Code2,
    RotateCw,
    Hash,
    Stamp,
    Crop,
    Unlock,
    Lock,
    PenTool,
    EyeOff,
    GitCompare,
    Sparkles,
    ShieldCheck,
    CheckCircle2,
} from 'lucide-react'

export default function Home() {
    const toolGroups = [
        {
            group: "Organize PDF",
            colorTheme: "purple" as const,
            badge: "Page Control",
            tools: [
                { title: "Merge PDF", slug: "merge", icon: Layers, desc: "Combine multiple PDFs in the exact order you want." },
                { title: "Split PDF", slug: "split", icon: Scissors, desc: "Separate individual pages or extract page ranges." },
                { title: "Remove pages", slug: "remove-pages", icon: Trash2, desc: "Delete unwanted pages from your document." },
                { title: "Extract pages", slug: "extract-pages", icon: FileOutput, desc: "Save selected pages into an independent PDF." },
                { title: "Organize PDF", slug: "organize", icon: LayoutGrid, desc: "Sort, reorder, and rotate pages interactively." },
                { title: "Scan to PDF", slug: "scan", icon: Scan, desc: "Convert paper document captures into neat PDFs." },
            ],
        },
        {
            group: "Optimize PDF",
            colorTheme: "emerald" as const,
            badge: "Speed & Size",
            tools: [
                { title: "Compress PDF", slug: "compress", icon: Minimize2, desc: "Reduce file size significantly while preserving quality." },
                { title: "Optimize PDF", slug: "optimize", icon: Zap, desc: "Enhance viewing performance for fast web loading." },
                { title: "Repair PDF", slug: "repair", icon: Wrench, desc: "Recover and restore unreadable or corrupted PDFs." },
                { title: "OCR PDF", slug: "ocr", icon: Search, desc: "Turn scanned documents into searchable, selectable text." },
            ],
        },
        {
            group: "Convert to PDF",
            colorTheme: "rose" as const,
            badge: "To PDF",
            tools: [
                { title: "JPG to PDF", slug: "jpg-to-pdf", icon: Image, desc: "Convert JPG, JPEG, and PNG images into a clean PDF." },
                { title: "WORD to PDF", slug: "word-to-pdf", icon: FileText, desc: "Make DOC and DOCX documents easy to read as PDF." },
                { title: "POWERPOINT to PDF", slug: "ppt-to-pdf", icon: FileText, desc: "Convert PPT slides into universal PDF handouts." },
                { title: "EXCEL to PDF", slug: "excel-to-pdf", icon: FileSpreadsheet, desc: "Make Excel spreadsheets and tables printable as PDF." },
                { title: "HTML to PDF", slug: "html-to-pdf", icon: Code2, desc: "Save full webpages and HTML documents into PDF." },
            ],
        },
        {
            group: "Convert from PDF",
            colorTheme: "amber" as const,
            badge: "From PDF",
            tools: [
                { title: "PDF to JPG", slug: "pdf-to-jpg", icon: Image, desc: "Extract high-resolution images from each PDF page." },
                { title: "PDF to WORD", slug: "pdf-to-word", icon: FileText, desc: "Convert PDF documents to editable Microsoft Word files." },
                { title: "PDF to POWERPOINT", slug: "pdf-to-ppt", icon: FileText, desc: "Turn your PDF presentations back into editable slides." },
                { title: "PDF to EXCEL", slug: "pdf-to-excel", icon: FileSpreadsheet, desc: "Extract structured tables directly into Excel spreadsheets." },
                { title: "PDF to PDF/A", slug: "pdf-to-pdfa", icon: ShieldCheck, desc: "Transform into ISO-compliant PDF/A for long-term archiving." },
            ],
        },
        {
            group: "Edit PDF",
            colorTheme: "blue" as const,
            badge: "Customization",
            tools: [
                { title: "Edit PDF", slug: "edit", icon: FileText, desc: "Add text, annotations, shapes, and highlights to PDF." },
                { title: "Rotate PDF", slug: "rotate", icon: RotateCw, desc: "Rotate upside-down or sideways pages in seconds." },
                { title: "Add page numbers", slug: "page-numbers", icon: Hash, desc: "Insert customizable header or footer page numbers." },
                { title: "Add watermark", slug: "watermark", icon: Stamp, desc: "Brand your files with custom text or image watermarks." },
                { title: "Crop PDF", slug: "crop", icon: Crop, desc: "Trim page margins and adjust printable boundary." },
            ],
        },
        {
            group: "PDF Security",
            colorTheme: "slate" as const,
            badge: "Privacy & Protection",
            tools: [
                { title: "Unlock PDF", slug: "unlock", icon: Unlock, desc: "Remove passwords and editing restrictions from PDFs." },
                { title: "Protect PDF", slug: "protect", icon: Lock, desc: "Encrypt sensitive PDF documents with secure passwords." },
                { title: "Sign PDF", slug: "sign", icon: PenTool, desc: "Sign documents with digital or drawn hand signatures." },
                { title: "Redact PDF", slug: "redact", icon: EyeOff, desc: "Permanently black out private or confidential data." },
                { title: "Compare PDF", slug: "compare", icon: GitCompare, desc: "Display side-by-side visual differences between PDFs." },
            ],
        },
    ]

    return (
        <div className="flex flex-col items-center justify-center py-6">
            {/* Hero Section */}
            <div className="text-center mb-14 max-w-3xl px-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200/70 text-red-700 text-xs font-semibold mb-6 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>100% Free • No Sign-up Required • Instant Processing</span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
                    Every tool you need to work with{' '}
                    <span className="bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                        PDFs in one place
                    </span>
                </h1>

                <p className="text-lg sm:text-xl text-gray-600 leading-relaxed font-normal max-w-2xl mx-auto">
                    Merge, split, compress, convert, edit, and secure your PDF documents with complete privacy and zero hassle.
                </p>

                {/* Feature highlights */}
                <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs font-semibold text-gray-500">
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Client-side Security</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>High Quality Conversions</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>No File Watermarks</span>
                    </div>
                </div>
            </div>

            {/* Tool Groups */}
            <div className="w-full max-w-7xl px-4 sm:px-6 space-y-12">
                {toolGroups.map((group) => (
                    <div key={group.group} className="w-full">
                        <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                                    {group.group}
                                </h2>
                                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                    {group.badge}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                            {group.tools.map((tool) => (
                                <ToolCard
                                    key={tool.title}
                                    title={tool.title}
                                    description={tool.desc}
                                    href={`/tools/${tool.slug}`}
                                    icon={tool.icon}
                                    colorTheme={group.colorTheme}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
