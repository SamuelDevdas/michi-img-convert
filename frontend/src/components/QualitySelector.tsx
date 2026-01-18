"use client"

interface QualityOption {
  id: number
  name: string
  tagline: string
  description: string
  badge?: string
}

const QUALITY_PRESETS: QualityOption[] = [
  {
    id: 100,
    name: 'Maximum',
    tagline: '100%',
    description: 'Largest files. Best for archival or print.'
  },
  {
    id: 95,
    name: 'High',
    tagline: '95%',
    description: 'Visually identical. ~70% smaller than max.',
    badge: 'Recommended'
  },
  {
    id: 90,
    name: 'Standard',
    tagline: '90%',
    description: 'Great quality. ~80% smaller than max.'
  },
  {
    id: 80,
    name: 'Web',
    tagline: '80%',
    description: 'Good for web/social. ~90% smaller.'
  }
]

interface QualitySelectorProps {
  value: number
  onChange: (quality: number) => void
}

export default function QualitySelector({ value, onChange }: QualitySelectorProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--secondary-text)]">Output Quality</p>
          <h3 className="font-display text-lg font-semibold">Choose file size</h3>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-semibold">
          JPEG Quality
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {QUALITY_PRESETS.map((preset) => {
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
        Full resolution preserved. EXIF metadata copied from source.
      </p>
    </div>
  )
}
