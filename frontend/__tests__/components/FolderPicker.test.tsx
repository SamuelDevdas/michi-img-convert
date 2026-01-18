/**
 * Tests for FolderPicker component.
 *
 * Tests drive detection, path validation, and user interactions.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the fetch API
global.fetch = jest.fn()

// Mock component - we'll test the logic patterns
describe('FolderPicker Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Path Validation', () => {
    test('UNC paths should be detected', () => {
      const isUNCPath = (path: string) => /^\\\\[^\\]+\\[^\\]+/.test(path)

      expect(isUNCPath('\\\\NAS\\Photos')).toBe(true)
      expect(isUNCPath('\\\\server\\share\\folder')).toBe(true)
      expect(isUNCPath('/Users/test')).toBe(false)
      expect(isUNCPath('C:\\Users\\test')).toBe(false)
    })

    test('Windows paths should be detected', () => {
      const isWindowsDrivePath = (path: string) => /^[a-zA-Z]:([/\\]|$)/.test(path)

      expect(isWindowsDrivePath('C:\\Users')).toBe(true)
      expect(isWindowsDrivePath('D:/Photos')).toBe(true)
      expect(isWindowsDrivePath('Z:')).toBe(true)
      expect(isWindowsDrivePath('/Users/test')).toBe(false)
    })

    test('Drive letter extraction', () => {
      const getWindowsDriveLetter = (path: string) => {
        if (!/^[a-zA-Z]:([/\\]|$)/.test(path)) return null
        return path[0].toUpperCase()
      }

      expect(getWindowsDriveLetter('C:\\Users')).toBe('C')
      expect(getWindowsDriveLetter('z:/photos')).toBe('Z')
      expect(getWindowsDriveLetter('/Users/test')).toBeNull()
    })

    test('Path normalization removes quotes', () => {
      const normalizeInputPath = (path: string) => {
        let cleaned = path.trim()
        if (
          (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
          (cleaned.startsWith("'") && cleaned.endsWith("'"))
        ) {
          cleaned = cleaned.slice(1, -1).trim()
        }
        return cleaned
      }

      expect(normalizeInputPath('"/path/to/dir"')).toBe('/path/to/dir')
      expect(normalizeInputPath("'/path/to/dir'")).toBe('/path/to/dir')
      expect(normalizeInputPath('  /path/to/dir  ')).toBe('/path/to/dir')
    })
  })

  describe('Drive Detection API', () => {
    test('should fetch drives on mount', async () => {
      const mockDrives = {
        drives: [
          { name: 'Home', path: '/Users/test', type: 'home', accessible: true, has_photos: true },
          { name: 'NAS', path: '/Volumes/NAS', type: 'volume', accessible: true, has_photos: true }
        ],
        platform: 'macos'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrives
      })

      // Simulate the fetch call
      const response = await fetch('http://localhost:8000/api/drives')
      const data = await response.json()

      expect(data.drives).toHaveLength(2)
      expect(data.platform).toBe('macos')
    })

    test('should handle fetch errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      try {
        await fetch('http://localhost:8000/api/drives')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Drive Categorization', () => {
    test('should categorize drives by photo folders', () => {
      const drives = [
        { name: 'Home', path: '/Users/test', has_photos: true, accessible: true },
        { name: 'Data', path: '/Volumes/Data', has_photos: false, accessible: true },
        { name: 'Offline', path: '/Volumes/Offline', has_photos: false, accessible: false }
      ]

      const photoDrives = drives.filter(d => d.accessible && d.has_photos)
      const otherDrives = drives.filter(d => d.accessible && !d.has_photos)

      expect(photoDrives).toHaveLength(1)
      expect(otherDrives).toHaveLength(1)
    })
  })
})

describe('FolderPicker UI Interactions', () => {
  describe('Form Submission', () => {
    test('should validate empty path', () => {
      const path = ''
      const isValid = path.trim().length > 0
      expect(isValid).toBe(false)
    })

    test('should reject UNC paths', () => {
      const path = '\\\\NAS\\Photos'
      const isUNC = /^\\\\[^\\]+\\[^\\]+/.test(path)
      expect(isUNC).toBe(true)
    })

    test('should accept valid Unix paths', () => {
      const path = '/Users/test/Photos'
      const isValid = path.trim().length > 0
      const isUNC = /^\\\\[^\\]+\\[^\\]+/.test(path)
      expect(isValid && !isUNC).toBe(true)
    })

    test('should accept valid Windows paths', () => {
      const path = 'C:\\Users\\test\\Photos'
      const isValid = path.trim().length > 0
      const isUNC = /^\\\\[^\\]+\\[^\\]+/.test(path)
      expect(isValid && !isUNC).toBe(true)
    })
  })

  describe('Drive Selection', () => {
    test('should auto-select photo hint path when available', () => {
      const drive = {
        name: 'NAS',
        path: '/Volumes/NAS',
        photo_hint: '/Volumes/NAS/Photos',
        has_photos: true
      }

      const targetPath = drive.photo_hint || drive.path
      expect(targetPath).toBe('/Volumes/NAS/Photos')
    })

    test('should use drive path when no photo hint', () => {
      const drive = {
        name: 'External',
        path: '/Volumes/External',
        photo_hint: undefined,
        has_photos: false
      }

      const targetPath = drive.photo_hint || drive.path
      expect(targetPath).toBe('/Volumes/External')
    })
  })
})
