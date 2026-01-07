/**
 * API client hook for Spectrum backend communication.
 * 
 * Provides React hooks for scanning directories and converting files.
 */
import { useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ScanResponse {
  total_files: number
  already_converted: number
  pending_conversion: number
  total_size_mb: number
  files: Array<{
    path: string
    size: number
    already_converted: boolean
  }>
}

interface ConversionResponse {
  total: number
  successful: number
  failed: number
  results: Array<{
    src: string
    dst: string
    success: boolean
    error?: string
    size_bytes?: number
  }>
}

export function useConverter() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scan = async (path: string, recursive: boolean = true): Promise<ScanResponse | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, recursive, output_subdir: 'converted' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Scan failed')
      }

      const data: ScanResponse = await response.json()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const convert = async (
    files: string[],
    outputDir: string,
    quality: number = 90
  ): Promise<ConversionResponse | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          output_dir: outputDir,
          quality,
          preserve_exif: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Conversion failed')
      }

      const data: ConversionResponse = await response.json()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { scan, convert, isLoading, error }
}
