"use client"

import { useMemo, useState, useEffect } from 'react'
import FolderBrowserModal from './FolderBrowserModal'
import { getWindowsDriveLetter, isUNCPath, isWindowsDrivePath, normalizeInputPath } from '@/lib/pathUtils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface DriveInfo {
  name: string
  path: string
  type: 'volume' | 'windows' | 'home'
  letter?: string
  accessible: boolean
  has_photos: boolean
  photo_hint?: string
}

interface FolderPickerProps {
  onPathSelected: (path: string) => void
}

export default function FolderPicker({ onPathSelected }: FolderPickerProps) {
  const [path, setPath] = useState('')
  const [isValid, setIsValid] = useState(true)
  const [isBrowserOpen, setIsBrowserOpen] = useState(false)
  const [drives, setDrives] = useState<DriveInfo[]>([])
  const [drivesLoading, setDrivesLoading] = useState(true)
  const [platform, setPlatform] = useState<string>('')

  const normalizedPath = useMemo(() => normalizeInputPath(path), [path])
  const showUNCWarning = useMemo(() => isUNCPath(path), [path])
  const driveLetter = useMemo(() => getWindowsDriveLetter(path), [path])
  const showDriveNotice = useMemo(
    () => isWindowsDrivePath(path) && driveLetter !== 'C',
    [path, driveLetter]
  )

  // Auto-detect drives on mount
  useEffect(() => {
    fetchDrives()
  }, [])

  const fetchDrives = async () => {
    try {
      setDrivesLoading(true)
      const response = await fetch(`${API_BASE}/api/drives`)
      if (response.ok) {
        const data = await response.json()
        setDrives(data.drives || [])
        setPlatform(data.platform || '')
      }
    } catch (err) {
      console.error('Failed to fetch drives:', err)
    } finally {
      setDrivesLoading(false)
    }
  }

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

  const handleDriveClick = (drive: DriveInfo) => {
    const targetPath = drive.photo_hint || drive.path
    setPath(targetPath)
    setIsValid(true)
    // Always trigger scan when clicking a drive
    onPathSelected(targetPath)
  }

  // Separate drives into categories
  const photoDrives = drives.filter(d => d.accessible && d.has_photos)
  const otherDrives = drives.filter(d => d.accessible && !d.has_photos)
  const hasAccessibleDrives = photoDrives.length > 0 || otherDrives.length > 0

  const getIcon = (drive: DriveInfo) => {
    if (drive.type === 'home') return '🏠'
    if (drive.type === 'volume') return '💾'
    if (drive.type === 'windows') return '💻'
    return '📁'
  }

  return (
    <>
      <div className="relative">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--secondary-text)] mb-2">
          New Conversion
        </p>
        <h2 className="font-display text-3xl font-bold mb-3 text-white">Choose a source folder</h2>
        <p className="text-[var(--secondary-text)] mb-6 text-base">
          We scan for ARW files and keep your originals untouched.
        </p>

        {/* Quick Drive Access */}
        {!drivesLoading && hasAccessibleDrives && (
          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest text-[var(--secondary-text)] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Quick Access
            </p>

            {/* Photo drives first - highlighted */}
            {photoDrives.length > 0 && (
              <div className="grid gap-2 mb-3">
                {photoDrives.map((drive) => (
                  <button
                    key={drive.path}
                    onClick={() => handleDriveClick(drive)}
                    className="group flex items-center gap-3 w-full text-left rounded-xl border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 px-4 py-3 transition-all"
                  >
                    <span className="text-2xl">{getIcon(drive)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white flex items-center gap-2">
                        {drive.name}
                        <span className="text-[10px] font-medium uppercase tracking-wider text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">
                          Photos found
                        </span>
                      </p>
                      <p className="text-xs text-[var(--secondary-text)] truncate">{drive.photo_hint || drive.path}</p>
                    </div>
                    <svg className="w-5 h-5 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Other drives */}
            {otherDrives.length > 0 && (
              <div className="grid gap-2 md:grid-cols-2">
                {otherDrives.slice(0, 4).map((drive) => (
                  <button
                    key={drive.path}
                    onClick={() => handleDriveClick(drive)}
                    className="group flex items-center gap-3 text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 px-4 py-3 transition-all"
                  >
                    <span className="text-xl">{getIcon(drive)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{drive.name}</p>
                      <p className="text-xs text-[var(--secondary-text)] truncate">{drive.path}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* No drives detected - show guidance */}
        {!drivesLoading && !hasAccessibleDrives && (
          <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
            <p className="text-sm text-yellow-200 font-medium mb-2">No drives detected</p>
            <p className="text-xs text-yellow-200/70">
              {platform === 'windows' ? (
                <>
                  Make sure your NAS or external drive is:
                  <br />1. Mapped to a drive letter (e.g., Z:)
                  <br />2. Shared in Docker Desktop (Settings → Resources → File Sharing)
                </>
              ) : (
                <>
                  Mount your NAS or external drive via Finder. Mounted drives appear automatically.
                </>
              )}
            </p>
            <button
              onClick={fetchDrives}
              className="mt-3 text-xs text-yellow-400 hover:underline"
            >
              Refresh drives
            </button>
          </div>
        )}

        {/* Manual path entry */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="group relative">
            <label htmlFor="folder-path" className="block text-xs uppercase tracking-widest font-semibold mb-2 text-[var(--secondary-text)]">
              Or enter path manually
            </label>
            <div className="flex gap-3">
              <input
                id="folder-path"
                type="text"
                value={path}
                onChange={(e) => {
                  setPath(e.target.value)
                  setIsValid(true)
                }}
                placeholder="e.g. /Volumes/NAS/Photos"
                className={`flex-1 px-4 py-3 premium-input rounded-xl focus:outline-none transition-all font-mono text-sm ${
                  isValid ? 'border-white/10' : 'border-red-500/50 focus:border-red-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setIsBrowserOpen(true)}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-2"
                title="Browse folders"
              >
                <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="font-medium text-white hidden sm:inline">Browse</span>
              </button>
            </div>
            {!isValid && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-[10px] font-bold">!</span>
                {showUNCWarning ? 'Network share paths must be mapped to a drive letter first.' : 'Please enter a valid path'}
              </p>
            )}
            {showUNCWarning && (
              <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                Map the share in Windows first:
                <code className="block font-mono text-[11px] mt-1 text-amber-100">
                  net use Z: \\NAS\Photos /persistent:yes
                </code>
              </div>
            )}
            {!showUNCWarning && showDriveNotice && (
              <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--secondary-text)]">
                Ensure drive {driveLetter}: is shared in Docker Desktop.
              </div>
            )}
          </div>

          <button
            type="submit"
            className="font-tech w-full px-6 py-3 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] text-white font-bold tracking-wide rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={showUNCWarning || !path.trim()}
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
