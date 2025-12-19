export default function ProgressBar({ progress }: { progress: number }) {
    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    )
}
