interface AccuracyDialProps {
  label: string
  accuracy: number
  performanceElo: number
  accentClass: string
}

export function AccuracyDial({
  label,
  accuracy,
  performanceElo,
  accentClass,
}: AccuracyDialProps) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (accuracy / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 text-sm font-semibold text-zinc-300">{label}</p>
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-zinc-800"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={accentClass}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-zinc-100">
            {accuracy}%
          </span>
          <span className="text-[10px] text-zinc-500">accuracy</span>
        </div>
      </div>
      <p className="mt-3 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium text-amber-400">
        ~{performanceElo} perf. ELO
      </p>
    </div>
  )
}
