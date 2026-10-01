import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OmarchyThemeSource, parseOmarchyColors } from '../src/omarchy-theme.ts'
import type { DesktopSystemPalette } from '../src/ipc.ts'

const colors = (mode: 'light' | 'dark', accent = '#8AADF4', orange = '\norange = "#f5a97f"   # peach'): string => `# Catppuccin
mode = "${mode}"
accent = "${accent}"        # blue
selection = "#494d64"
muted = "#5b6078"

[extra]
background = "#24273a"
dark_background = "#1e2030"
darker_background = "#181926"
lighter_background = "#363a4f"
foreground = "#cad3f5"
dark_foreground = "#6e738d"
light_foreground = "#b8c0e0"
bright_foreground = "#cad3f5"
red = "#ed8796"
yellow = "#eed49f"${orange}
green = "#a6da95"
`

describe('parseOmarchyColors', () => {
  it('reads the role colors, lowercases them, and prefers orange for warnings', () => {
    expect(parseOmarchyColors(colors('dark'), 'catppuccin-macchiato')).toEqual({
      source: 'omarchy',
      name: 'catppuccin-macchiato',
      colorScheme: 'dark',
      colors: {
        accent: '#8aadf4', selection: '#494d64', muted: '#5b6078',
        background: '#24273a', darkBackground: '#1e2030', darkerBackground: '#181926', lighterBackground: '#363a4f',
        foreground: '#cad3f5', darkForeground: '#6e738d', lightForeground: '#b8c0e0', brightForeground: '#cad3f5',
        red: '#ed8796', green: '#a6da95', warning: '#f5a97f',
      },
    })
  })

  it('falls back to yellow when a theme declares no orange', () => {
    expect(parseOmarchyColors(colors('light', '#1e66f5', ''), 'latte')).toMatchObject({ colorScheme: 'light', colors: { warning: '#eed49f' } })
  })

  it('rejects an unknown mode and colors that are not #rrggbb', () => {
    expect(() => parseOmarchyColors(colors('dark').replace('mode = "dark"', 'mode = "dim"'), 'x')).toThrow(/mode must be/u)
    expect(() => parseOmarchyColors(colors('dark', 'blue'), 'x')).toThrow(/accent must be a #rrggbb color/u)
    expect(() => parseOmarchyColors(colors('dark').replace(/^green = .*$/mu, ''), 'x')).toThrow(/green must be/u)
  })
})

describe('OmarchyThemeSource', () => {
  let directory: string | undefined
  let source: OmarchyThemeSource | undefined
  afterEach(async () => {
    source?.dispose()
    if (directory !== undefined) await rm(directory, { recursive: true, force: true })
  })

  async function install(root: string, folder: string, contents: string): Promise<void> {
    await mkdir(join(root, folder), { recursive: true })
    await writeFile(join(root, folder, 'colors.toml'), contents)
  }

  it('reports the active theme, a theme switch by rename, and the theme going away', async () => {
    directory = await mkdtemp(join(tmpdir(), 'omarchy-current-'))
    await install(directory, 'theme', colors('dark'))
    await writeFile(join(directory, 'theme.name'), 'catppuccin-macchiato\n')
    const changes: (DesktopSystemPalette | undefined)[] = []
    source = new OmarchyThemeSource(directory, (palette) => { changes.push(palette) }, () => {})
    await source.start()
    expect(source.current).toMatchObject({ name: 'catppuccin-macchiato', colorScheme: 'dark' })

    // omarchy-theme-set stages next-theme/, removes theme/, renames, then rewrites theme.name.
    await install(directory, 'next-theme', colors('light', '#1e66f5'))
    await rm(join(directory, 'theme'), { recursive: true })
    await rename(join(directory, 'next-theme'), join(directory, 'theme'))
    await writeFile(join(directory, 'theme.name'), 'catppuccin-latte\n')
    await vi.waitFor(() => { expect(source?.current).toMatchObject({ name: 'catppuccin-latte', colorScheme: 'light' }) }, { timeout: 5_000 })

    await rm(join(directory, 'theme'), { recursive: true })
    await vi.waitFor(() => { expect(source?.current).toBeUndefined() }, { timeout: 5_000 })
    expect(changes.map(palette => palette?.name)).toEqual(['catppuccin-macchiato', 'catppuccin-latte', undefined])
  })

  it('keeps the last palette when colors.toml becomes malformed and follows edits in place', async () => {
    directory = await mkdtemp(join(tmpdir(), 'omarchy-current-'))
    await install(directory, 'theme', colors('dark'))
    const log = vi.fn()
    source = new OmarchyThemeSource(directory, () => {}, log)
    await source.start()
    expect(source.current?.name).toBe('omarchy')

    await writeFile(join(directory, 'theme', 'colors.toml'), 'mode = "dark"\n')
    await vi.waitFor(() => { expect(log).toHaveBeenCalledWith(expect.stringMatching(/keeping the current palette/u)) }, { timeout: 5_000 })
    expect(source.current?.colors.accent).toBe('#8aadf4')

    await writeFile(join(directory, 'theme', 'colors.toml'), colors('dark', '#ff0000'))
    await vi.waitFor(() => { expect(source?.current?.colors.accent).toBe('#ff0000') }, { timeout: 5_000 })
  })

  it('publishes nothing outside Omarchy', async () => {
    const onChange = vi.fn()
    source = new OmarchyThemeSource(join(tmpdir(), 'omarchy-absent', String(process.pid)), onChange, () => {})
    await source.start()
    expect(source.current).toBeUndefined()
    expect(onChange).not.toHaveBeenCalled()
  })
})
