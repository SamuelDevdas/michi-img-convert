"use client"

import { useState } from 'react'
import FolderPicker from '@/components/FolderPicker'
import ScanResults from '@/components/ScanResults'
import ConversionDashboard from '@/components/ConversionDashboard'
import { useConverter } from '@/hooks/useConverter'

type AppState = 'idle' | 'scanned' | 'converting' | 'complete'

export default function Home() {
  const [state, setState] = useState<AppState>('idle')
  const [scanData, setScanData] = useState<any>(null)
  const [conversionData, setConversionData] = useState<any>(null)
  const [selectedPath, setSelectedPath] = useState('')
  
  const { scan, convert, isLoading, error } = useConverter()

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
    
    const results = await convert(filesToConvert, outputDir)
    
    if (results) {
      setConversionData(results)
      setState('complete')
    }
  }

  const handleReset = () => {
    setState('idle')
    setScanData(null)
    setConversionData(null)
    setSelectedPath('')
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
            <h1 className="font-display text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[var(--secondary-text)]">
              Spectrum
            </h1>
          </div>
          <span className="text-xs uppercase tracking-widest text-[var(--accent)] font-semibold opacity-80">
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
                    isConverting={false}
                />
                )}

                {/* Step 3: Conversion Progress */}
                {(state === 'converting' || state === 'complete') && conversionData && (
                <ConversionDashboard
                    successful={conversionData.successful}
                    failed={conversionData.failed}
                    total={conversionData.total}
                    isComplete={state === 'complete'}
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
      <div className="fixed bottom-4 left-0 right-0 text-center pointer-events-none z-50">
        <a 
          href="https://truevineinsights.ch" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-[var(--secondary-text)] opacity-40 hover:opacity-100 transition-all duration-300 pointer-events-auto"
        >
          <span className="font-light">Engineered by</span>
          <span className="font-bold tracking-wider text-white">TrueVine Insights</span>
        </a>
      </div>
    </main>
  )
}
