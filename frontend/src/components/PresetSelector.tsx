"use client"

interface PresetOption {
  id: string
  name: string
  tagline: string
  description: string
  badge?: string
}

const PRESETS: PresetOption[] = [
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'Balanced',
    description: 'Natural contrast and color with clean detail.',
    badge: 'Recommended'
  },
  {
    id: 'neutral',
    name: 'Neutral',
    tagline: 'Subtle',
    description: 'Closest to RAW with minimal styling.'
  },
  {
    id: 'vivid',
    name: 'Vivid',
    tagline: 'Punchy',
    description: 'More contrast and saturation for impact.'
  },
  {
    id: 'clean',
    name: 'Clean ISO',
    tagline: 'Noise control',
    description: 'Softer detail with stronger noise reduction.'
  }
]

interface PresetSelectorProps {
  value: string
  onChange: (preset: string) => void
}

export default function PresetSelector({ value, onChange }: PresetSelectorProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--secondary-text)]">Processing Preset</p>
          <h3 className="font-display text-lg font-semibold">Choose a look</h3>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-semibold">
          Pro defaults
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {PRESETS.map((preset) => {
          const selected = value === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.id)}
              className={`group text-left rounded-xl border px-4 py-3 transition-all ${
                selected
                  ? 'border-[var(--accent)]/70 bg-[var(--accent)]/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                  : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{preset.name}</p>
                  <p className="text-xs text-[var(--secondary-text)]">{preset.tagline}</p>
                </div>
                {preset.badge && (
                  <span className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)]">
                    {preset.badge}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-[var(--secondary-text)]">{preset.description}</p>
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-[11px] text-[var(--secondary-text)]">
        Output stays full resolution, JPEG quality 100, EXIF preserved.
      </p>
    </div>
  )
}
