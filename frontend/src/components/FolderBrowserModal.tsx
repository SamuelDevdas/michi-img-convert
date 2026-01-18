"use client"

import { useState, useEffect } from 'react'

interface DirectoryItem {
  name: string
  path: string
}

interface BrowseResponse {
  current: string
  parent: string | null
  directories: DirectoryItem[]
}

interface FolderBrowserModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (path: string) => void
  apiBase: string
}

export default function FolderBrowserModal({
  isOpen,
  onClose,
  onSelect,
  apiBase,
}: FolderBrowserModalProps) {
  const [currentPath, setCurrentPath] = useState('')
  const [directories, setDirectories] = useState<DirectoryItem[]>([])
  const [parent, setParent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDirectories = async (path: string) => {
    setIsLoading(true)
    setError(null)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    try {
      const response = await fetch(
        `${apiBase}/api/browse?path=${encodeURIComponent(path)}`,
        { signal: controller.signal }
      )
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to browse directory')
      }

      const data: BrowseResponse = await response.json()
      setCurrentPath(data.current)
      setDirectories(data.directories || [])
      setParent(data.parent)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out - try again')
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchDirectories('')
    }
  }, [isOpen])

  const handleNavigate = (path: string) => {
    fetchDirectories(path)
  }

  const handleSelect = () => {
    onSelect(currentPath)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-[var(--card-bg)] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="font-display text-lg font-bold">Select Folder</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Path */}
        <div className="px-6 py-3 bg-white/5 border-b border-white/10">
          <p className="font-mono text-sm text-[var(--secondary-text)] truncate">
            {currentPath}
          </p>
        </div>

        {/* Directory List */}
        <div className="h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-400">
              <p>{error}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {/* Parent directory */}
              {parent && (
                <button
                  onClick={() => handleNavigate(parent)}
                  className="w-full px-6 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                >
                  <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  <span className="text-[var(--secondary-text)]">..</span>
                </button>
              )}
              
              {/* Subdirectories */}
              {directories.length === 0 && !parent ? (
                <p className="px-6 py-4 text-[var(--secondary-text)] text-sm">No folders found</p>
              ) : (
                directories.map((dir) => (
                  <button
                    key={dir.path}
                    onClick={() => handleNavigate(dir.path)}
                    className="w-full px-6 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span>{dir.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-white/10 bg-white/5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={currentPath === '/' || currentPath === ''}
            className="flex-1 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            Select This Folder
          </button>
        </div>
      </div>
    </div>
  )
}
