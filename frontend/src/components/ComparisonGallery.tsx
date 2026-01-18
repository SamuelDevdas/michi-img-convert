"use client"

import { useEffect, useMemo, useRef, useState } from 'react'

interface ComparisonItem {
  id: string
  originalPath: string
  convertedPath: string
  skipped?: boolean
}

interface ComparisonGalleryProps {
  items: ComparisonItem[]
  apiBase: string
}

interface ExifMetadata {
  Make?: string
  Model?: string
  LensModel?: string
  DateTimeOriginal?: string
  ISO?: number
  ExposureTime?: number | string
  FNumber?: number
  FocalLength?: string
  GPSLatitude?: string | number
  GPSLongitude?: string | number
  GPSAltitude?: string | number
}

export default function ComparisonGallery({ items, apiBase }: ComparisonGalleryProps) {
  const [selected, setSelected] = useState<ComparisonItem | null>(null)
  const [slider, setSlider] = useState(50)
  const [visibleCount, setVisibleCount] = useState(24)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [metadata, setMetadata] = useState<ExifMetadata | null>(null)
  const [showMetadata, setShowMetadata] = useState(false)
  const compareRef = useRef<HTMLDivElement | null>(null)

  const selectedIndex = selected
    ? items.findIndex((item) => item.id === selected.id)
    : -1
  const canPrev = selectedIndex > 0
  const canNext = selectedIndex >= 0 && selectedIndex < items.length - 1

  const goPrev = () => {
    if (!canPrev) return
    setSelected(items[selectedIndex - 1])
    setSlider(50)
  }

  const goNext = () => {
    if (!canNext) return
    setSelected(items[selectedIndex + 1])
    setSlider(50)
  }

  const updateSliderFromClientX = (clientX: number) => {
    const rect = compareRef.current?.getBoundingClientRect()
    if (!rect) return
    const nextValue = ((clientX - rect.left) / rect.width) * 100
    setSlider(Math.min(100, Math.max(0, nextValue)))
  }

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (event: PointerEvent) => updateSliderFromClientX(event.clientX)
    const handleUp = () => setIsDragging(false)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [isDragging])

  // Fetch metadata when a file is selected
  useEffect(() => {
    if (!selected) {
      setMetadata(null)
      return
    }
    const fetchMetadata = async () => {
      try {
        const res = await fetch(`${apiBase}/api/metadata?path=${encodeURIComponent(selected.convertedPath)}`)
        if (res.ok) {
          const data = await res.json()
          setMetadata(data.metadata || null)
        }
      } catch {
        setMetadata(null)
      }
    }
    fetchMetadata()
  }, [selected, apiBase])

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  )

  const buildPreviewUrl = (path: string) =>
    `${apiBase}/api/preview?path=${encodeURIComponent(path)}`
  const buildFileUrl = (path: string) =>
    `${apiBase}/api/file?path=${encodeURIComponent(path)}`

  const handleQuickReview = () => {
    if (items.length === 0) return
    setSelected(items[0])
    setSlider(50)
  }

  return (
    <div className="glass-card bg-[var(--card-bg)] border border-white/5 rounded-2xl p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--secondary-text)]">Review</p>
          <h2 className="font-display text-2xl font-bold">Before / After</h2>
          <p className="text-sm text-[var(--secondary-text)]">
            Inspect changes with a precision slider or open the full gallery.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-widest text-[var(--accent)] font-semibold">
            {items.length} pairs
          </span>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleQuickReview}
              className="rounded-lg bg-[var(--accent)]/20 px-4 py-2 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/30"
            >
              Quick compare
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
          >
            {isExpanded ? 'Hide gallery' : 'Open gallery'}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-[var(--secondary-text)]">
          No converted files available for review yet.
        </div>
      ) : isExpanded ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelected(item)
                  setSlider(50)
                }}
                className="group rounded-xl border border-white/10 bg-black/20 p-3 text-left transition hover:border-white/20 hover:bg-white/5"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black/40">
                    <img
                      src={buildPreviewUrl(item.originalPath)}
                      alt="Original"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black/40">
                    <img
                      src={buildPreviewUrl(item.convertedPath)}
                      alt="Converted"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[var(--secondary-text)]">
                  <span>{item.skipped ? 'Already converted' : 'Converted'}</span>
                  <span className="text-[var(--accent)]">Open</span>
                </div>
              </button>
            ))}
          </div>

          {items.length > visibleCount && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 24)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--secondary-text)] hover:border-white/20 hover:bg-white/10"
            >
              Show more
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-wrap gap-3">
          {items.slice(0, 3).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelected(item)
                setSlider(50)
              }}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2 text-left hover:border-white/20 hover:bg-white/5"
            >
              <div className="flex -space-x-2">
                <img
                  src={buildPreviewUrl(item.originalPath)}
                  alt="Original preview"
                  className="h-14 w-20 rounded-lg object-cover ring-2 ring-black/50"
                />
                <img
                  src={buildPreviewUrl(item.convertedPath)}
                  alt="Converted preview"
                  className="h-14 w-20 rounded-lg object-cover ring-2 ring-black/50"
                />
              </div>
              <span className="text-xs text-[var(--secondary-text)]">Tap to compare</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative z-10 w-full max-w-5xl mx-4 rounded-2xl border border-white/10 bg-[var(--card-bg)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h3 className="font-display text-lg font-bold">Before / After Compare</h3>
                <p className="text-xs text-[var(--secondary-text)]">
                  Drag the slider to inspect the difference.
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div
                ref={compareRef}
                className="relative h-[45vh] overflow-hidden rounded-xl border border-white/10 bg-black/60"
              >
                <img
                  src={buildPreviewUrl(selected.convertedPath)}
                  alt="Converted preview"
                  className="absolute inset-0 h-full w-full object-contain"
                />
                <img
                  src={buildPreviewUrl(selected.originalPath)}
                  alt="Original preview"
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}
                />
                <div
                  className="absolute inset-y-0 w-10 cursor-ew-resize"
                  style={{ left: `calc(${slider}% - 20px)` }}
                  onPointerDown={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                    updateSliderFromClientX(event.clientX)
                  }}
                >
                  <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-[var(--accent)] shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/70 shadow-[0_0_20px_rgba(0,0,0,0.45)]">
                      <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={goPrev}
                  disabled={!canPrev}
                  className="group absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/50 p-3 text-white/70 backdrop-blur-md transition hover:border-white/30 hover:text-white disabled:opacity-40"
                  aria-label="Previous image"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canNext}
                  className="group absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/50 p-3 text-white/70 backdrop-blur-md transition hover:border-white/30 hover:text-white disabled:opacity-40"
                  aria-label="Next image"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-[var(--secondary-text)]">Original</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={slider}
                  onChange={(e) => setSlider(Number(e.target.value))}
                  className="flex-1 accent-[var(--accent)]"
                />
                <span className="text-xs text-[var(--secondary-text)]">Converted</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={buildFileUrl(selected.convertedPath)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-[var(--accent)]/20 px-4 py-2 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/30"
                >
                  Open converted
                </a>
                <a
                  href={buildFileUrl(selected.originalPath)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
                >
                  Download original
                </a>
                <button
                  type="button"
                  onClick={() => setShowMetadata(!showMetadata)}
                  className={`rounded-lg border px-4 py-2 text-xs transition ${
                    showMetadata
                      ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)]'
                      : 'border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  {showMetadata ? 'Hide EXIF' : 'Show EXIF'}
                </button>
              </div>

              {showMetadata && metadata && (
                <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-4">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--accent)] flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    EXIF Metadata Preserved
                  </p>

                  {/* Camera & Settings */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-[var(--secondary-text)]">Camera</p>
                      <p className={`font-medium ${metadata.Make ? 'text-white' : 'text-white/40 italic'}`}>
                        {metadata.Make && metadata.Model ? `${metadata.Make} ${metadata.Model}` : 'Not available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--secondary-text)]">Lens</p>
                      <p className={`font-medium ${metadata.LensModel ? 'text-white' : 'text-white/40 italic'}`}>
                        {metadata.LensModel || 'Not available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--secondary-text)]">Date Taken</p>
                      <p className={`font-medium ${metadata.DateTimeOriginal ? 'text-white' : 'text-white/40 italic'}`}>
                        {metadata.DateTimeOriginal || 'Not available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--secondary-text)]">ISO</p>
                      <p className={`font-medium ${metadata.ISO ? 'text-white' : 'text-white/40 italic'}`}>
                        {metadata.ISO || 'Not available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--secondary-text)]">Shutter</p>
                      <p className={`font-medium ${metadata.ExposureTime ? 'text-white' : 'text-white/40 italic'}`}>
                        {metadata.ExposureTime
                          ? (typeof metadata.ExposureTime === 'number' && metadata.ExposureTime < 1
                              ? `1/${Math.round(1 / metadata.ExposureTime)}s`
                              : `${metadata.ExposureTime}s`)
                          : 'Not available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--secondary-text)]">Aperture</p>
                      <p className={`font-medium ${metadata.FNumber ? 'text-white' : 'text-white/40 italic'}`}>
                        {metadata.FNumber ? `f/${metadata.FNumber}` : 'Not available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--secondary-text)]">Focal Length</p>
                      <p className={`font-medium ${metadata.FocalLength ? 'text-white' : 'text-white/40 italic'}`}>
                        {metadata.FocalLength || 'Not available'}
                      </p>
                    </div>
                  </div>

                  {/* GPS / Location */}
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--secondary-text)] mb-2 flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Location Data
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-[var(--secondary-text)]">Latitude</p>
                        <p className={`font-medium ${metadata.GPSLatitude ? 'text-white' : 'text-white/40 italic'}`}>
                          {metadata.GPSLatitude || 'Not recorded'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--secondary-text)]">Longitude</p>
                        <p className={`font-medium ${metadata.GPSLongitude ? 'text-white' : 'text-white/40 italic'}`}>
                          {metadata.GPSLongitude || 'Not recorded'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--secondary-text)]">Altitude</p>
                        <p className={`font-medium ${metadata.GPSAltitude ? 'text-white' : 'text-white/40 italic'}`}>
                          {metadata.GPSAltitude || 'Not recorded'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
