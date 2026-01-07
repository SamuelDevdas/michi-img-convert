"use client"

import { useState } from 'react'
import FolderBrowserModal from './FolderBrowserModal'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FolderPickerProps {
  onPathSelected: (path: string) => void
}

export default function FolderPicker({ onPathSelected }: FolderPickerProps) {
  const [path, setPath] = useState('')
  const [isValid, setIsValid] = useState(true)
  const [isBrowserOpen, setIsBrowserOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!path.trim()) {
      setIsValid(false)
      return
    }

    setIsValid(true)
    onPathSelected(path)
  }

  const handleBrowseSelect = (selectedPath: string) => {
    setPath(selectedPath)
    setIsValid(true)
  }

  return (
    <>
      <div className="relative">
        <h2 className="font-display text-4xl font-bold mb-3 text-white">Select Path</h2>
        <p className="text-[var(--secondary-text)] mb-8 text-lg">
          Choose the directory containing your ARW files to begin.
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
                placeholder="/Volumes/Photos/2024"
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
                Please enter a valid path
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3.5 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] text-white font-bold tracking-wide rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
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

