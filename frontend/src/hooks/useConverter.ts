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
  skipped: number
  results: Array<{
    src: string
    dst: string
    success: boolean
    error?: string
    size_bytes?: number
    skipped?: boolean
    metadata_copied?: boolean
    metadata_error?: string | null
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
    quality: number = 100,
    preset: string = 'standard'
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
          preserve_exif: true,
          preset
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

  const convertWithProgress = async (
    files: string[],
    outputDir: string,
    onProgress: (update: {
      processed: number
      successful: number
      failed: number
      skipped: number
      total: number
    }) => void,
    quality: number = 100,
    preset: string = 'standard'
  ): Promise<ConversionResponse | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/convert/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          output_dir: outputDir,
          quality,
          preserve_exif: true,
          preset
        })
      })

      if (!response.ok || !response.body) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Conversion failed')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finalSummary: ConversionResponse | null = null
      const results: ConversionResponse['results'] = []
      const seen = new Set<string>()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          const data = JSON.parse(line)

          if (data.type === 'start') {
            onProgress({
              processed: 0,
              successful: 0,
              failed: 0,
              skipped: 0,
              total: data.total || files.length
            })
          }

          if (data.type === 'progress') {
            if (data.result) {
              const key = data.result.src || data.result.dst || JSON.stringify(data.result)
              if (!seen.has(key)) {
                seen.add(key)
                results.push(data.result)
              }
            }
            onProgress({
              processed: data.processed ?? 0,
              successful: data.successful ?? 0,
              failed: data.failed ?? 0,
              skipped: data.skipped ?? 0,
              total: files.length
            })
          }

          if (data.type === 'complete') {
            finalSummary = {
              total: data.total || files.length,
              successful: data.successful ?? 0,
              failed: data.failed ?? 0,
              skipped: data.skipped ?? 0,
              results
            }
          }

          if (data.type === 'error') {
            throw new Error(data.message || 'Conversion failed')
          }
        }
      }

      return finalSummary
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { scan, convert, convertWithProgress, isLoading, error }
}
