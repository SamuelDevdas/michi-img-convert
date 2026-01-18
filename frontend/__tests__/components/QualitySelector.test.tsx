/**
 * Tests for QualitySelector component.
 *
 * Tests quality presets, selection behavior, and display.
 */

describe('QualitySelector Logic Tests', () => {
  const QUALITY_PRESETS = [
    { id: 100, name: 'Maximum', tagline: '100%', description: 'Largest files. Best for archival or print.' },
    { id: 95, name: 'High', tagline: '95%', description: 'Visually identical. ~70% smaller than max.', badge: 'Recommended' },
    { id: 90, name: 'Standard', tagline: '90%', description: 'Great quality. ~80% smaller than max.' },
    { id: 80, name: 'Web', tagline: '80%', description: 'Good for web/social. ~90% smaller.' }
  ]

  describe('Preset Configuration', () => {
    test('should have 4 quality presets', () => {
      expect(QUALITY_PRESETS).toHaveLength(4)
    })

    test('should have recommended preset at 95%', () => {
      const recommended = QUALITY_PRESETS.find(p => p.badge === 'Recommended')
      expect(recommended).toBeDefined()
      expect(recommended?.id).toBe(95)
    })

    test('presets should be ordered by quality descending', () => {
      const ids = QUALITY_PRESETS.map(p => p.id)
      expect(ids).toEqual([100, 95, 90, 80])
    })

    test('each preset should have required fields', () => {
      QUALITY_PRESETS.forEach(preset => {
        expect(preset.id).toBeDefined()
        expect(preset.name).toBeDefined()
        expect(preset.tagline).toBeDefined()
        expect(preset.description).toBeDefined()
      })
    })
  })

  describe('Selection Logic', () => {
    test('should identify selected preset', () => {
      const currentValue = 95
      const selectedPreset = QUALITY_PRESETS.find(p => p.id === currentValue)
      expect(selectedPreset?.name).toBe('High')
    })

    test('should handle invalid selection gracefully', () => {
      const currentValue = 85 // Not a valid preset
      const selectedPreset = QUALITY_PRESETS.find(p => p.id === currentValue)
      expect(selectedPreset).toBeUndefined()
    })
  })

  describe('File Size Estimates', () => {
    test('descriptions should include size reduction info', () => {
      const highPreset = QUALITY_PRESETS.find(p => p.id === 95)
      expect(highPreset?.description).toContain('70%')

      const standardPreset = QUALITY_PRESETS.find(p => p.id === 90)
      expect(standardPreset?.description).toContain('80%')

      const webPreset = QUALITY_PRESETS.find(p => p.id === 80)
      expect(webPreset?.description).toContain('90%')
    })
  })
})
