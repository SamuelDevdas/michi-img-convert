"use client"

import { useMemo, useState } from 'react'
import FolderBrowserModal from './FolderBrowserModal'
import { getWindowsDriveLetter, isUNCPath, isWindowsDrivePath, normalizeInputPath } from '@/lib/pathUtils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FolderPickerProps {
  onPathSelected: (path: string) => void
}

export default function FolderPicker({ onPathSelected }: FolderPickerProps) {
  const [path, setPath] = useState('')
  const [isValid, setIsValid] = useState(true)
  const [isBrowserOpen, setIsBrowserOpen] = useState(false)

  const normalizedPath = useMemo(() => normalizeInputPath(path), [path])
  const showUNCWarning = useMemo(() => isUNCPath(path), [path])
  const driveLetter = useMemo(() => getWindowsDriveLetter(path), [path])
  const showDriveNotice = useMemo(
    () => isWindowsDrivePath(path) && driveLetter !== 'C',
    [path, driveLetter]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!normalizedPath) {
      setIsValid(false)
      return
    }

    setIsValid(true)
    if (showUNCWarning) {
      setIsValid(false)
      return
    }
    onPathSelected(normalizedPath)
  }

  const handleBrowseSelect = (selectedPath: string) => {
    setPath(selectedPath)
    setIsValid(true)
  }

  return (
    <>
      <div className="relative">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--secondary-text)] mb-2">
          New Conversion
        </p>
        <h2 className="font-display text-3xl font-bold mb-3 text-white">Choose a source folder</h2>
        <p className="text-[var(--secondary-text)] mb-8 text-base">
          We scan for ARW files and keep your originals untouched.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group relative">
            <label htmlFor="folder-path" className="block text-xs uppercase tracking-widest font-semibold mb-3 text-[var(--accent)] opacity-80">
              Source Directory
            </label>
            <div className="flex gap-4">
              <input
                id="folder-path"
                type="text"
                value={path}
                onChange={(e) => {
                  setPath(e.target.value)
                  setIsValid(true)
                }}
                placeholder="e.g. /Users/username/Photos or C:\\Users\\username\\Photos"
                className={`flex-1 px-5 py-4 premium-input rounded-xl focus:outline-none transition-all font-mono text-sm ${
                  isValid ? 'border-white/10' : 'border-red-500/50 focus:border-red-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setIsBrowserOpen(true)}
                className="px-6 py-4 bg-white/5 hover:bg-white/10 hover:shadow-lg border border-white/10 rounded-xl transition-all flex items-center gap-3 group"
                title="Browse folders"
              >
                <div className="p-1 bg-[var(--accent)]/10 rounded-full group-hover:bg-[var(--accent)]/20 transition-colors">
                    <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                </div>
                <span className="font-semibold text-white">Browse</span>
              </button>
            </div>
            {!isValid && (
              <p className="text-red-400 text-sm mt-3 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-[10px] font-bold">!</span>
                {showUNCWarning ? 'Network share paths (\\\\server\\share) must be mapped to a drive letter first.' : 'Please enter a valid path'}
              </p>
            )}
            {showUNCWarning && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                Map the share in Windows, then use the drive letter path here. Example:
                <span className="block font-mono text-[11px] mt-2 text-amber-100">
                  net use Z: \\NAS\\Photos /persistent:yes
                </span>
              </div>
            )}
            {!showUNCWarning && showDriveNotice && (
              <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-[var(--secondary-text)]">
                Using drive {driveLetter}:? Make sure that drive is shared in Docker Desktop and configured in start.bat.
              </div>
            )}
          </div>

          <button
            type="submit"
            className="font-tech w-full px-6 py-3.5 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] text-white font-bold tracking-wide rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none"
            disabled={showUNCWarning}
          >
            Scan for .ARW Files
          </button>
        </form>

      </div>

      <FolderBrowserModal
        isOpen={isBrowserOpen}
        onClose={() => setIsBrowserOpen(false)}
        onSelect={handleBrowseSelect}
        apiBase={API_BASE}
      />
    </>
  )
}
