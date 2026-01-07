"use client"

interface ConversionDashboardProps {
  successful: number
  failed: number
  total: number
  isComplete: boolean
}

export default function ConversionDashboard({
  successful,
  failed,
  total,
  isComplete
}: ConversionDashboardProps) {
  const progress = total > 0 ? ((successful + failed) / total) * 100 : 0

  return (
    <div className="glass-card bg-[var(--card-bg)] border border-white/5 rounded-2xl p-8">
      <h2 className="font-display text-2xl font-bold mb-6">Conversion Progress</h2>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[var(--secondary-text)]">Progress</span>
          <span className="font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--accent)] to-[#026F73] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-white/5 rounded-lg">
          <div className="text-2xl font-bold">{successful + failed}</div>
          <div className="text-sm text-[var(--secondary-text)]">Processed</div>
        </div>
        
        <div className="text-center p-4 bg-white/5 rounded-lg">
          <div className="text-2xl font-bold text-green-500">{successful}</div>
          <div className="text-sm text-[var(--secondary-text)]">Successful</div>
        </div>
        
        <div className="text-center p-4 bg-white/5 rounded-lg">
          <div className="text-2xl font-bold text-red-500">{failed}</div>
          <div className="text-sm text-[var(--secondary-text)]">Failed</div>
        </div>
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
          <p className="text-green-500 font-semibold text-lg">
            🎉 Conversion Complete!
          </p>
          <p className="text-sm text-[var(--secondary-text)] mt-2">
            {successful} files converted successfully
            {failed > 0 && `, ${failed} failed`}
          </p>
        </div>
      )}
    </div>
  )
}
