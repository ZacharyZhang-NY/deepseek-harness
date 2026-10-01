/** Read the active Omarchy theme palette on Linux and report every theme switch. */

import { watch, type FSWatcher } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { DesktopSystemPalette, DesktopSystemPaletteColors } from './ipc.ts'

/** Palette roles every Omarchy `colors.toml` declares. */
const REQUIRED_COLORS = [
  'accent', 'selection', 'muted',
  'background', 'dark_background', 'darker_background', 'lighter_background',
  'foreground', 'dark_foreground', 'light_foreground', 'bright_foreground',
  'red', 'green', 'yellow',
] as const

/** Delay after the last file event; a theme switch removes, renames, and writes in quick succession. */
const SETTLE_MS = 150

/**
 * Directory that `omarchy-theme-set` maintains: it replaces `theme/` by renaming
 * `next-theme/` over it and then rewrites `theme.name`.
 * @returns `~/.local/state/omarchy/current` for the current user.
 */
export function defaultOmarchyThemeDirectory(): string {
  return join(homedir(), '.local', 'state', 'omarchy', 'current')
}

/**
 * Parse the flat `key = "value"` lines of an Omarchy `colors.toml`.
 * Tables, comments, and unknown keys are ignored; `orange` falls back to `yellow`
 * because some themes omit it.
 * @param toml - File contents.
 * @param name - Theme name reported to the renderer.
 * @returns The validated palette.
 * @throws {Error} When `mode` is not `light` or `dark`, or a required color is missing or not `#rrggbb`.
 */
export function parseOmarchyColors(toml: string, name: string): DesktopSystemPalette {
  const values = new Map<string, string>()
  for (const raw of toml.split('\n')) {
    const [, key, , value] = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(["'])(.*?)\2\s*(?:#.*)?$/u.exec(raw) ?? []
    if (key !== undefined && value !== undefined) values.set(key, value)
  }
  const mode = values.get('mode')
  if (mode !== 'light' && mode !== 'dark') throw new Error(`colors.toml: mode must be "light" or "dark", not ${JSON.stringify(mode)}`)
  const color = (key: string): string => {
    const value = values.get(key)
    if (value === undefined || !/^#[0-9a-fA-F]{6}$/u.test(value)) {
      throw new Error(`colors.toml: ${key} must be a #rrggbb color, not ${JSON.stringify(value)}`)
    }
    return value.toLowerCase()
  }
  const colors = Object.fromEntries(REQUIRED_COLORS.map(key => [key, color(key)])) as Record<typeof REQUIRED_COLORS[number], string>
  const palette: DesktopSystemPaletteColors = {
    accent: colors.accent,
    selection: colors.selection,
    muted: colors.muted,
    background: colors.background,
    darkBackground: colors.dark_background,
    darkerBackground: colors.darker_background,
    lighterBackground: colors.lighter_background,
    foreground: colors.foreground,
    darkForeground: colors.dark_foreground,
    lightForeground: colors.light_foreground,
    brightForeground: colors.bright_foreground,
    red: colors.red,
    green: colors.green,
    warning: values.has('orange') ? color('orange') : colors.yellow,
  }
  return { source: 'omarchy', name, colorScheme: mode, colors: palette }
}

function errorCode(error: unknown): string | undefined {
  return error instanceof Error && 'code' in error && typeof error.code === 'string' ? error.code : undefined
}

/**
 * Follows `~/.local/state/omarchy/current` and publishes the parsed palette.
 * A missing theme publishes `undefined`, so the renderer returns to its built-in
 * palettes; an unreadable or malformed file keeps the last palette.
 */
export class OmarchyThemeSource {
  private palette: DesktopSystemPalette | undefined
  private readonly watchers = new Map<string, FSWatcher>()
  private timer: NodeJS.Timeout | undefined
  private disposed = false

  /**
   * @param directory - Omarchy's `current` state directory.
   * @param onChange - Called with each palette that differs from the previous one.
   * @param log - Receives load diagnostics.
   */
  constructor(
    private readonly directory: string,
    private readonly onChange: (palette: DesktopSystemPalette | undefined) => void,
    private readonly log: (message: string) => void = (message) => { console.info(message) },
  ) {}

  /** The last palette read, or `undefined` when no Omarchy theme is active. */
  get current(): DesktopSystemPalette | undefined {
    return this.palette
  }

  /**
   * Read the theme once and start watching for switches.
   * @returns Resolves after the first read.
   */
  async start(): Promise<void> {
    await this.load()
  }

  /** Stop watching; no further `onChange` calls follow. */
  dispose(): void {
    this.disposed = true
    clearTimeout(this.timer)
    for (const watcher of this.watchers.values()) watcher.close()
    this.watchers.clear()
  }

  private schedule(): void {
    clearTimeout(this.timer)
    this.timer = setTimeout(() => { void this.load() }, SETTLE_MS)
  }

  /** Watch `current/` for the rename that swaps themes and `theme/` for edits in place. */
  private rewatch(): void {
    for (const path of [this.directory, join(this.directory, 'theme')]) {
      // A watch follows the inode, and a theme switch replaces theme/; renew it each load.
      this.watchers.get(path)?.close()
      this.watchers.delete(path)
      try {
        const watcher = watch(path, { persistent: false }, () => { this.schedule() })
        watcher.on('error', () => { this.watchers.delete(path); this.schedule() })
        this.watchers.set(path, watcher)
      } catch (error) {
        // ENOENT: the directory appears with the next theme switch, which current/ reports.
        if (errorCode(error) !== 'ENOENT') this.log(`omarchy theme: cannot watch ${path}: ${String(error)}`)
      }
    }
  }

  private async load(): Promise<void> {
    this.rewatch()
    const path = join(this.directory, 'theme', 'colors.toml')
    let next: DesktopSystemPalette | undefined
    try {
      const toml = await readFile(path, 'utf8')
      const name = await readFile(join(this.directory, 'theme.name'), 'utf8').then(text => text.trim(), () => 'omarchy')
      next = parseOmarchyColors(toml, name)
    } catch (error) {
      const code = errorCode(error)
      if (code !== 'ENOENT' && code !== 'ENOTDIR') {
        this.log(`omarchy theme: keeping the current palette; ${error instanceof Error ? error.message : String(error)}`)
        return
      }
      next = undefined
    }
    if (this.disposed || JSON.stringify(next) === JSON.stringify(this.palette)) return
    this.palette = next
    this.log(next === undefined ? 'omarchy theme: none active' : `omarchy theme: ${next.name} (${next.colorScheme})`)
    this.onChange(next)
  }
}
