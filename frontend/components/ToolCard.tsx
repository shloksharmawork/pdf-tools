import Link from 'next/link'

interface ToolCardProps {
    title: string
    href: string
    disabled?: boolean
    badge?: string
}

export default function ToolCard({ title, href, disabled, badge }: ToolCardProps) {
    const cardContent = (
        <div className={`h-full bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-200 flex flex-col items-start justify-between min-h-[100px] ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:border-blue-500'}`}>
            <h3 className={`text-lg font-bold mb-2 ${disabled ? 'text-gray-500' : 'text-gray-900 group-hover:text-blue-600'}`}>
                {title}
            </h3>
            {badge && (
                <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-md">
                    {badge}
                </span>
            )}
        </div>
    )

    if (disabled) {
        return (
            <div className="block">
                {cardContent}
            </div>
        )
    }

    return (
        <Link href={href} className="group block h-full">
            {cardContent}
        </Link>
    )
}
