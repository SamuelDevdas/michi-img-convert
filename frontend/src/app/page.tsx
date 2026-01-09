"use client"

import { useEffect, useState } from 'react'
import FolderPicker from '@/components/FolderPicker'
import ScanResults from '@/components/ScanResults'
import ConversionDashboard from '@/components/ConversionDashboard'
import ComparisonGallery from '@/components/ComparisonGallery'
import { useConverter } from '@/hooks/useConverter'

type AppState = 'idle' | 'scanned' | 'converting' | 'complete'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const LAST_REVIEW_KEY = 'spectrum:last-review'

export default function Home() {
  const [state, setState] = useState<AppState>('idle')
  const [scanData, setScanData] = useState<any>(null)
  const [conversionData, setConversionData] = useState<any>(null)
  const [selectedPath, setSelectedPath] = useState('')
  const [preset, setPreset] = useState('standard')
  const [savedReview, setSavedReview] = useState<any | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  
  const { scan, convertWithProgress, isLoading, error } = useConverter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(LAST_REVIEW_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSavedReview(parsed)
      } catch {
        window.localStorage.removeItem(LAST_REVIEW_KEY)
      }
    }
  }, [])

  const handlePathSelected = async (path: string) => {
    setSelectedPath(path)
    const results = await scan(path)
    
    if (results) {
      setScanData(results)
      setState('scanned')
    }
  }

  const handleStartConversion = async () => {
    if (!scanData) return
    
    setState('converting')
    
    // Get files that need conversion
    const filesToConvert = scanData.files
      .filter((f: any) => !f.already_converted)
      .map((f: any) => f.path)
    
    // Determine output directory
    const outputDir = `${selectedPath}/converted`

    setConversionData({
      total: filesToConvert.length,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      results: []
    })

    const results = await convertWithProgress(
      filesToConvert,
      outputDir,
      (update) => {
        setConversionData((prev: any) => ({
          ...prev,
          processed: update.processed,
          successful: update.successful,
          failed: update.failed,
          skipped: update.skipped,
          total: update.total
        }))
      },
      100,
      preset
    )

    if (results) {
      const updated = {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        skipped: results.skipped,
        processed: results.total,
        results: results.results || []
      }
      setConversionData(updated)
      const reviewPayload = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        sourcePath: selectedPath,
        outputDir,
        preset,
        summary: {
          total: results.total,
          successful: results.successful,
          failed: results.failed,
          skipped: results.skipped
        },
        pairCount: results.results?.length || 0
      }
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(LAST_REVIEW_KEY, JSON.stringify(reviewPayload))
        } catch {
          window.localStorage.removeItem(LAST_REVIEW_KEY)
        }
      }
      setSavedReview(reviewPayload)
      setState('complete')
    }
  }

  const handleReset = () => {
    setState('idle')
    setScanData(null)
    setConversionData(null)
    setSelectedPath('')
  }

  const handleOpenSavedReview = async () => {
    if (!savedReview) return
    setIsRestoring(true)
    try {
      const response = await fetch(`${API_BASE}/api/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_path: savedReview.sourcePath,
          output_dir: savedReview.outputDir || `${savedReview.sourcePath}/converted`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to restore review')
      }

      const data = await response.json()
      setConversionData({
        total: data.total_converted,
        successful: data.total_converted,
        failed: 0,
        skipped: data.total_converted,
        processed: data.total_converted,
        results: data.pairs || []
      })
      setState('complete')
    } catch (err) {
      console.error(err)
    } finally {
      setIsRestoring(false)
    }
  }

  const handleClearSavedReview = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LAST_REVIEW_KEY)
    }
    setSavedReview(null)
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Background Gradient Spotlights */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[var(--accent)]/10 rounded-full blur-[120px] -z-10 opacity-30"></div>
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] -z-10 opacity-30"></div>

      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-md sticky top-0 z-50 bg-black/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="TrueVine Insights Logo" 
              className="w-20 h-20 object-contain drop-shadow-2xl"
            />
            <h1 className="font-display text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[var(--secondary-text)]">
              Spectrum
            </h1>
          </div>
          <span className="font-tech text-xs uppercase tracking-widest text-[var(--accent)] font-semibold opacity-80">
            Professional ARW Workflow
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 pb-24 space-y-8 animate-enter">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-sm">
            <p className="text-red-400 font-semibold flex items-center gap-2">
              <span className="text-xl">⚠️</span> {error}
            </p>
            {error.toLowerCase().includes('unc paths') && (
              <p className="text-xs text-red-300 mt-2">
                Tip: Map the share to a drive letter in Windows (e.g., Z:) and use that path instead.
              </p>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="p-4 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg animate-pulse">
            <p className="text-[var(--accent)] font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping"></span>
              Processing...
            </p>
          </div>
        )}

        {/* glass-panel wrapper for main interactive area */}
        <div className="glass-panel rounded-2xl p-1 shadow-2xl">
            <div className="bg-black/40 rounded-xl p-8 border border-white/5">
                {state === 'idle' && savedReview && (
                  <div className="mb-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-black/40 to-black/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="max-w-xl">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--secondary-text)]">Resume</p>
                        <h2 className="font-display text-2xl font-bold">Last conversion ready</h2>
                        <p
                          className="text-xs text-[var(--secondary-text)] mt-2 truncate"
                          title={savedReview.sourcePath}
                        >
                          {savedReview.sourcePath}
                        </p>
                      </div>
                      <div className="text-right text-[11px] text-[var(--secondary-text)]">
                        {new Date(savedReview.timestamp).toLocaleString()}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-[var(--secondary-text)]">
                      <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">
                        {savedReview.summary.total} total
                      </span>
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                        {savedReview.summary.successful} success
                      </span>
                      <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-yellow-200">
                        {savedReview.summary.skipped} skipped
                      </span>
                      <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-red-200">
                        {savedReview.summary.failed} failed
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={handleOpenSavedReview}
                        disabled={isRestoring}
                        className="rounded-full bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
                      >
                        {isRestoring ? 'Restoring…' : 'Open review'}
                      </button>
                      <button
                        onClick={handleClearSavedReview}
                        className="rounded-full border border-white/10 px-6 py-2 text-sm text-white/70 hover:bg-white/10"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
                {/* Step 1: Folder Selection */}
                {state === 'idle' && (
                <FolderPicker onPathSelected={handlePathSelected} />
                )}

                {/* Step 2: Scan Results */}
                {state === 'scanned' && scanData && (
                <ScanResults
                    totalFiles={scanData.total_files}
                    alreadyConverted={scanData.already_converted}
                    pendingConversion={scanData.pending_conversion}
                    totalSizeMb={scanData.total_size_mb}
                    onStartConversion={handleStartConversion}
                    isConverting={state === 'converting'}
                    preset={preset}
                    onPresetChange={setPreset}
                />
                )}

                {/* Step 3: Conversion Progress */}
                {(state === 'converting' || state === 'complete') && conversionData && (
                <ConversionDashboard
                    successful={conversionData.successful}
                    failed={conversionData.failed}
                    skipped={conversionData.skipped}
                    processed={conversionData.processed}
                    total={conversionData.total}
                    isComplete={state === 'complete'}
                />
                )}

                {state === 'complete' && conversionData?.results?.length > 0 && (
                  <ComparisonGallery
                    apiBase={API_BASE}
                    items={conversionData.results
                      .filter((item: any) => item.dst)
                      .map((item: any) => ({
                        id: item.dst || item.src,
                        originalPath: item.src,
                        convertedPath: item.dst,
                        skipped: item.skipped
                      }))}
                  />
                )}
            </div>
        </div>

        {/* Reset Button */}
        {state !== 'idle' && (
          <button
            onClick={handleReset}
            className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 hover:border-white/20 border border-white/10 text-[var(--secondary-text)] hover:text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <span>Start New Conversion</span>
            <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        )}

      </div>

      {/* Footer Link - Fixed at bottom */}
      <div className="fixed bottom-6 left-0 right-0 text-center pointer-events-none z-50">
        <a 
          href="https://truevineinsights.ch" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/5 transition-all duration-300 pointer-events-auto"
        >
          <span className="font-tech text-[10px] uppercase tracking-widest text-[var(--secondary-text)] opacity-70 group-hover:opacity-100 transition-opacity">
            Engineered by
          </span>
          <span className="font-display font-bold text-sm tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-blue-500 filter drop-shadow-sm group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] transition-all">
            TrueVine Insights
          </span>
        </a>
      </div>
    </main>
  )
}
