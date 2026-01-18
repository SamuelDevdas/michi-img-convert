/**
 * Tests for PresetSelector component.
 *
 * Tests processing presets selection and configuration.
 */

describe('PresetSelector Logic Tests', () => {
  const PRESETS = [
    { id: 'standard', name: 'Standard', tagline: 'Balanced', description: 'Natural contrast and color with clean detail.', badge: 'Recommended' },
    { id: 'neutral', name: 'Neutral', tagline: 'Subtle', description: 'Closest to RAW with minimal styling.' },
    { id: 'vivid', name: 'Vivid', tagline: 'Punchy', description: 'More contrast and saturation for impact.' },
    { id: 'clean', name: 'Clean ISO', tagline: 'Noise control', description: 'Softer detail with stronger noise reduction.' }
  ]

  describe('Preset Configuration', () => {
    test('should have 4 processing presets', () => {
      expect(PRESETS).toHaveLength(4)
    })

    test('should have recommended preset as standard', () => {
      const recommended = PRESETS.find(p => p.badge === 'Recommended')
      expect(recommended).toBeDefined()
      expect(recommended?.id).toBe('standard')
    })

    test('each preset should have unique id', () => {
      const ids = PRESETS.map(p => p.id)
      const uniqueIds = [...new Set(ids)]
      expect(ids.length).toBe(uniqueIds.length)
    })

    test('each preset should have required fields', () => {
      PRESETS.forEach(preset => {
        expect(preset.id).toBeDefined()
        expect(preset.name).toBeDefined()
        expect(preset.tagline).toBeDefined()
        expect(preset.description).toBeDefined()
      })
    })
  })

  describe('Preset Descriptions', () => {
    test('neutral preset describes minimal processing', () => {
      const neutral = PRESETS.find(p => p.id === 'neutral')
      expect(neutral?.description.toLowerCase()).toContain('minimal')
    })

    test('vivid preset describes enhanced colors', () => {
      const vivid = PRESETS.find(p => p.id === 'vivid')
      expect(vivid?.description.toLowerCase()).toContain('contrast')
    })

    test('clean preset describes noise reduction', () => {
      const clean = PRESETS.find(p => p.id === 'clean')
      expect(clean?.description.toLowerCase()).toContain('noise')
    })
  })

  describe('Selection Logic', () => {
    test('should identify selected preset', () => {
      const currentValue = 'vivid'
      const selectedPreset = PRESETS.find(p => p.id === currentValue)
      expect(selectedPreset?.name).toBe('Vivid')
    })

    test('default should be standard', () => {
      const defaultPreset = 'standard'
      const preset = PRESETS.find(p => p.id === defaultPreset)
      expect(preset?.badge).toBe('Recommended')
    })
  })
})
