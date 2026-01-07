"use client"

import { useState } from 'react'

interface FolderPickerProps {
  onPathSelected: (path: string) => void
}

export default function FolderPicker({ onPathSelected }: FolderPickerProps) {
  const [path, setPath] = useState('')
  const [isValid, setIsValid] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!path.trim()) {
      setIsValid(false)
      return
    }

    setIsValid(true)
    onPathSelected(path)
  }

  return (
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
          <input
            id="folder-path"
            type="text"
            value={path}
            onChange={(e) => {
              setPath(e.target.value)
              setIsValid(true)
            }}
            placeholder="/Volumes/Photos/2024"
            className={`w-full px-4 py-3 bg-white/5 border ${
              isValid ? 'border-white/10' : 'border-red-500'
            } rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors font-mono text-sm`}
          />
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
  )
}
