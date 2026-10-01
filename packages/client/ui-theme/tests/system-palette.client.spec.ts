// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { stubConfigForm } from '@deepseek-ai/dsh-client-test-runtime'
import type { SystemPalette, ThemeSettings, ThemeSnapshot } from '@deepseek-ai/dsh-client-ui-theme/client'
import { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client'
import { parseSystemPalette, systemPaletteTokens } from '../src/client/system-palette.ts'

const PALETTE: SystemPalette = {
  source: 'omarchy',
  name: 'tokyo-night',
  colorScheme: 'dark',
  colors: {
    accent: '#7aa2f7', selection: '#292e42', muted: '#414868',
    background: '#1a1b26', darkBackground: '#13141c', darkerBackground: '#0e0e14', lighterBackground: '#24283b',
    foreground: '#a9b1d6', darkForeground: '#565f89', lightForeground: '#b4bee6', brightForeground: '#c0caf5',
    red: '#f7768e', green: '#9ece6a', warning: '#ff9e64',
  },
}

describe('parseSystemPalette', () => {
  it('accepts a well-formed bridge payload', () => {
    expect(parseSystemPalette(structuredClone(PALETTE))).toEqual(PALETTE)
  })

  it('rejects null and payloads whose values could not be used as CSS colors', () => {
    expect(parseSystemPalette(null)).toBeUndefined()
    expect(parseSystemPalette({ ...PALETTE, source: 'gnome' })).toBeUndefined()
    expect(parseSystemPalette({ ...PALETTE, colorScheme: 'dim' })).toBeUndefined()
    expect(parseSystemPalette({ ...PALETTE, colors: { ...PALETTE.colors, accent: 'red; background: url(x)' } })).toBeUndefined()
    expect(parseSystemPalette({ ...PALETTE, colors: { ...PALETTE.colors, warning: undefined } })).toBeUndefined()
  })
})

describe('systemPaletteTokens', () => {
  it('maps desktop roles onto the base, sidebar, text, accent, and state tokens', () => {
    const tokens = systemPaletteTokens(PALETTE)
    expect(tokens).toMatchObject({
      '--dsw-alias-bg-base': '#1a1b26',
      '--dsw-specific-sidebar-fill': '#13141c',
      '--dsw-alias-label-primary': '#a9b1d6',
      '--dsw-alias-label-secondary': '#b4bee6',
      '--dsw-alias-link': '#7aa2f7',
      '--dsw-alias-state-business-primary': '#7aa2f7',
      '--dsw-alias-state-error-primary': '#f7768e',
      '--dsw-alias-state-success-primary': '#9ece6a',
      '--dsw-alias-state-warn-primary': '#ff9e64',
      '--dsw-specific-input-major': '#24283b',
    })
    for (const value of Object.values(tokens)) expect(value).toMatch(/^(?:#[0-9a-f]{6}|color-mix\(in srgb, [^;{}]+\))$/u)
  })

  it('keeps raised surfaces on the window background for light themes', () => {
    const tokens = systemPaletteTokens({ ...PALETTE, colorScheme: 'light' })
    expect(tokens['--dsw-specific-input-major']).toBe('#1a1b26')
    expect(tokens['--dsw-alias-bg-layer-2']).toBe('#1a1b26')
  })
})

describe('ThemeRuntime.setSystemTheme', () => {
  const desktop = { id: 'desktop-system-palette', colorScheme: 'dark' as const, tokens: { '--dsw-alias-bg-base': '#1a1b26' } }
  const make = (): { theme: ThemeRuntime; events: ThemeSnapshot[] } => {
    const ctx = new Context()
    const events: ThemeSnapshot[] = []
    ctx.on('theme/change', (snapshot) => { events.push(snapshot) })
    return { theme: new ThemeRuntime(ctx, stubConfigForm<ThemeSettings>().scope), events }
  }

  it('resolves the system preference to the desktop theme until it is cleared', () => {
    const { theme, events } = make()
    theme.setSystemTheme(desktop)
    expect(theme.getTheme()).toMatchObject({ preference: 'system', active: desktop })
    theme.setSystemTheme(desktop)
    expect(events).toHaveLength(1)
    theme.setSystemTheme(undefined)
    expect(theme.getTheme().active.id).toBe('light')
    expect(events).toHaveLength(2)
  })

  it('leaves fixed preferences on the built-in palettes and folds override layers over the desktop theme', () => {
    const { theme } = make()
    theme.setSystemTheme(desktop)
    theme.setTheme('light')
    expect(theme.getTheme().active.id).toBe('light')
    theme.setTheme('system')
    theme.overrideTokens('plugin', { '--dsw-alias-link': { light: '#000000', dark: '#ffffff' } })
    expect(theme.getTheme().active.tokens).toEqual({ '--dsw-alias-bg-base': '#1a1b26', '--dsw-alias-link': '#ffffff' })
  })
})
