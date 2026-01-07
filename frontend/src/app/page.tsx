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
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#018488]/20 rounded-full blur-[120px] -z-10 opacity-30"></div>
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] -z-10 opacity-30"></div>

      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="TrueVine Insights Logo" 
              className="w-24 h-24 object-contain"
            />
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Spectrum
            </h1>
          </div>
          <span className="text-sm text-[var(--secondary-text)] font-medium">
            by TrueVine Insights
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500 font-semibold">Error: {error}</p>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="p-4 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg">
            <p className="text-[var(--accent)] font-semibold">Processing...</p>
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

        {/* Reset Button */}
        {state !== 'idle' && (
          <button
            onClick={handleReset}
            className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Start New Conversion
          </button>
        )}

        {/* Footer Link */}
        <div className="mt-16 text-center">
          <a 
            href="https://truevineinsights.ch" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[var(--secondary-text)] hover:text-[#018488] transition-colors duration-200"
          >
            <span>Powered by</span>
            <span className="font-bold text-white tracking-wide">TrueVine Insights</span>
          </a>
        </div>
      </div>
    </main>
  )
}
