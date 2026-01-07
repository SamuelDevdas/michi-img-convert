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
      <div className="glass-card bg-[var(--card-bg)] border border-white/5 rounded-2xl p-8">
        <h2 className="font-display text-2xl font-bold mb-4">Select Source Folder</h2>
        <p className="text-[var(--secondary-text)] mb-6">
          Choose the directory containing your ARW files
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="folder-path" className="block text-sm font-medium mb-2">
              Folder Path
            </label>
            <div className="flex gap-2">
              <input
                id="folder-path"
                type="text"
                value={path}
                onChange={(e) => {
                  setPath(e.target.value)
                  setIsValid(true)
                }}
                placeholder="/Volumes/Photos/2024"
                className={`flex-1 px-4 py-3 bg-white/5 border ${
                  isValid ? 'border-white/10' : 'border-red-500'
                } rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors font-mono text-sm`}
              />
              <button
                type="button"
                onClick={() => setIsBrowserOpen(true)}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-colors flex items-center gap-2"
                title="Browse folders"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="hidden sm:inline">Browse</span>
              </button>
            </div>
            {!isValid && (
              <p className="text-red-500 text-sm mt-2">Please enter a valid path</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Scan Directory
          </button>
        </form>

        <div className="mt-6 p-4 bg-white/5 rounded-lg">
          <p className="text-xs text-[var(--secondary-text)]">
            <strong>Tip:</strong> For NAS volumes, use paths like <code className="px-1 py-0.5 bg-white/10 rounded">/Volumes/YourNAS/Photos</code>
          </p>
        </div>
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

