"use client"

import PresetSelector from './PresetSelector'

interface ScanResultsProps {
  totalFiles: number
  alreadyConverted: number
  pendingConversion: number
  totalSizeMb: number
  onStartConversion: () => void
  isConverting: boolean
  preset: string
  onPresetChange: (preset: string) => void
}

export default function ScanResults({
  totalFiles,
  alreadyConverted,
  pendingConversion,
  totalSizeMb,
  onStartConversion,
  isConverting,
  preset,
  onPresetChange
}: ScanResultsProps) {
  return (
    <div className="glass-card bg-[var(--card-bg)] border border-white/5 rounded-2xl p-8">
      <h2 className="font-display text-2xl font-bold mb-6">Scan Results</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="text-2xl font-bold text-[var(--accent)]">{totalFiles}</div>
          <div className="text-sm text-[var(--secondary-text)]">Total Files</div>
        </div>
        
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="text-2xl font-bold text-green-500">{alreadyConverted}</div>
          <div className="text-sm text-[var(--secondary-text)]">Already Done</div>
        </div>
        
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="text-2xl font-bold text-yellow-500">{pendingConversion}</div>
          <div className="text-sm text-[var(--secondary-text)]">Pending</div>
        </div>
        
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="text-2xl font-bold">{totalSizeMb.toFixed(1)} MB</div>
          <div className="text-sm text-[var(--secondary-text)]">Total Size</div>
        </div>
      </div>

      {/* Action Button */}
      {pendingConversion > 0 ? (
        <div className="space-y-5">
          <PresetSelector value={preset} onChange={onPresetChange} />
          <button
            onClick={onStartConversion}
            disabled={isConverting}
            className="w-full px-6 py-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 text-lg"
          >
            {isConverting ? 'Converting...' : `Convert ${pendingConversion} Files`}
          </button>
        </div>
      ) : (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
          <p className="text-green-500 font-semibold">✅ All files already converted!</p>
        </div>
      )}
    </div>
  )
}
