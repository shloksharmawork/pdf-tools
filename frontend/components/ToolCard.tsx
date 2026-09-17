import Link from 'next/link'
import { LucideIcon, ArrowRight } from 'lucide-react'

export interface ToolCardProps {
    title: string
    description?: string
    href: string
    icon?: LucideIcon
    colorTheme?: 'purple' | 'emerald' | 'rose' | 'amber' | 'blue' | 'slate' | 'red'
    disabled?: boolean
    badge?: string
}

const colorMap = {
    purple: {
        bg: 'bg-purple-50 group-hover:bg-purple-600',
        text: 'text-purple-600 group-hover:text-white',
        border: 'hover:border-purple-200',
        hoverShadow: 'hover:shadow-purple-100',
        accentBar: 'bg-purple-500',
    },
    emerald: {
        bg: 'bg-emerald-50 group-hover:bg-emerald-600',
        text: 'text-emerald-600 group-hover:text-white',
        border: 'hover:border-emerald-200',
        hoverShadow: 'hover:shadow-emerald-100',
        accentBar: 'bg-emerald-500',
    },
    rose: {
        bg: 'bg-rose-50 group-hover:bg-rose-600',
        text: 'text-rose-600 group-hover:text-white',
        border: 'hover:border-rose-200',
        hoverShadow: 'hover:shadow-rose-100',
        accentBar: 'bg-rose-500',
    },
    amber: {
        bg: 'bg-amber-50 group-hover:bg-amber-600',
        text: 'text-amber-600 group-hover:text-white',
        border: 'hover:border-amber-200',
        hoverShadow: 'hover:shadow-amber-100',
        accentBar: 'bg-amber-500',
    },
    blue: {
        bg: 'bg-blue-50 group-hover:bg-blue-600',
        text: 'text-blue-600 group-hover:text-white',
        border: 'hover:border-blue-200',
        hoverShadow: 'hover:shadow-blue-100',
        accentBar: 'bg-blue-500',
    },
    slate: {
        bg: 'bg-slate-100 group-hover:bg-slate-800',
        text: 'text-slate-700 group-hover:text-white',
        border: 'hover:border-slate-300',
        hoverShadow: 'hover:shadow-slate-100',
        accentBar: 'bg-slate-700',
    },
    red: {
        bg: 'bg-red-50 group-hover:bg-red-600',
        text: 'text-red-600 group-hover:text-white',
        border: 'hover:border-red-200',
        hoverShadow: 'hover:shadow-red-100',
        accentBar: 'bg-red-500',
    },
}

export default function ToolCard({
    title,
    description,
    href,
    icon: Icon,
    colorTheme = 'red',
    disabled,
    badge,
}: ToolCardProps) {
    const colors = colorMap[colorTheme] || colorMap.red

    const cardContent = (
        <div
            className={`
                relative h-full bg-white p-5 rounded-2xl border border-gray-100
                shadow-sm hover:shadow-xl transition-all duration-300 transform
                flex flex-col justify-between overflow-hidden
                ${disabled ? 'opacity-60 cursor-not-allowed' : `hover:-translate-y-1 ${colors.border} ${colors.hoverShadow}`}
            `}
        >
            <div>
                <div className="flex items-center justify-between mb-4">
                    {Icon ? (
                        <div
                            className={`
                                w-12 h-12 rounded-xl flex items-center justify-center
                                transition-all duration-300 shadow-sm
                                ${colors.bg} ${colors.text}
                            `}
                        >
                            <Icon className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                    ) : (
                        <div className={`w-2.5 h-8 rounded-full ${colors.accentBar}`} />
                    )}

                    {badge && (
                        <span className="px-2.5 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">
                            {badge}
                        </span>
                    )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-950 transition-colors mb-1.5 leading-snug">
                    {title}
                </h3>

                {description && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-normal">
                        {description}
                    </p>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs font-semibold text-gray-400 group-hover:text-gray-700 transition-colors">
                <span>Use tool</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
        </div>
    )

    if (disabled) {
        return <div className="block h-full">{cardContent}</div>
    }

    return (
        <Link href={href} className="group block h-full">
            {cardContent}
        </Link>
    )
}
