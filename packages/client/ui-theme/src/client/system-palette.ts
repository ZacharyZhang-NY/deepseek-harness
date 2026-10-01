/**
 * Desktop system palette: maps the colors of the host desktop theme (Omarchy
 * on Linux) onto the `--dsw-alias-*` and `--dsw-specific-*` role tokens, so
 * the `system` appearance preference can follow the desktop theme instead of
 * only its light/dark scheme.
 */

/** Role colors of a desktop theme, each a lowercase `#rrggbb` value. */
export interface SystemPaletteColors {
  /** Accent for links, focus rings, and informational buttons. */
  accent: string
  /** Selected-item fill. */
  selection: string
  /** Inactive fill and disabled text. */
  muted: string
  /** Main window background. */
  background: string
  /** Recessed surface such as the sidebar. */
  darkBackground: string
  /** Most recessed surface. */
  darkerBackground: string
  /** Raised surface such as inputs and message bubbles. */
  lighterBackground: string
  /** Body text. */
  foreground: string
  /** Captions and placeholder text. */
  darkForeground: string
  /** Secondary text. */
  lightForeground: string
  /** Emphasized text. */
  brightForeground: string
  /** Error state. */
  red: string
  /** Success state. */
  green: string
  /** Warning state. */
  warning: string
}

/** A desktop theme published by the host shell. */
export interface SystemPalette {
  /** Desktop that supplied the palette. */
  source: 'omarchy'
  /** Theme name shown by the desktop. */
  name: string
  /** Base palette the theme builds on. */
  colorScheme: 'light' | 'dark'
  /** Role colors. */
  colors: SystemPaletteColors
}

/** Host bridge the Desktop preload exposes as `dshDesktop.systemPalette`. */
export interface SystemPaletteBridge {
  /** @returns the active desktop palette, or `null` when the desktop has none. */
  current(): Promise<unknown>
  /**
   * @param listener - receives each new palette, or `null` when the desktop theme goes away.
   * @returns unsubscribe function.
   */
  subscribe(listener: (palette: unknown) => void): () => void
}

/** Theme id under which the desktop palette is registered. */
export const SYSTEM_PALETTE_THEME_ID = 'desktop-system-palette'

const COLOR_ROLES = [
  'accent', 'selection', 'muted', 'background', 'darkBackground', 'darkerBackground', 'lighterBackground',
  'foreground', 'darkForeground', 'lightForeground', 'brightForeground', 'red', 'green', 'warning',
] as const satisfies readonly (keyof SystemPaletteColors)[]

/**
 * Validate a palette received over the Desktop IPC bridge; values become CSS,
 * so every color must be a plain `#rrggbb` literal.
 * @param value - bridge payload.
 * @returns the palette, or `undefined` for `null` and malformed payloads.
 */
export function parseSystemPalette(value: unknown): SystemPalette | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const candidate = value as Partial<Record<keyof SystemPalette, unknown>>
  if (candidate.source !== 'omarchy' || typeof candidate.name !== 'string') return undefined
  if (candidate.colorScheme !== 'light' && candidate.colorScheme !== 'dark') return undefined
  if (typeof candidate.colors !== 'object' || candidate.colors === null) return undefined
  const source = candidate.colors as Partial<Record<keyof SystemPaletteColors, unknown>>
  const colors = {} as SystemPaletteColors
  for (const role of COLOR_ROLES) {
    const color = source[role]
    if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/u.test(color)) return undefined
    colors[role] = color
  }
  return { source: 'omarchy', name: candidate.name, colorScheme: candidate.colorScheme, colors }
}

function mix(color: string, percent: number, other: string): string {
  return `color-mix(in srgb, ${color} ${String(percent)}%, ${other})`
}

/**
 * Map desktop role colors onto the alias token layer. Light themes keep the
 * built-in light design, where cards and inputs share the window background;
 * dark themes raise them onto `lighterBackground`.
 * @param palette - validated desktop palette.
 * @returns token-name → CSS value for the palette's color scheme.
 */
export function systemPaletteTokens(palette: SystemPalette): Record<string, string> {
  const c = palette.colors
  const dark = palette.colorScheme === 'dark'
  const translucent = (color: string, percent: number): string => mix(color, percent, 'transparent')
  const raised = dark ? c.lighterBackground : c.background
  const toast = dark ? c.selection : c.foreground
  return {
    '--dsw-alias-bg-base': c.background,
    '--dsw-alias-bg-document-preview': c.darkBackground,
    '--dsw-alias-label-document-preview': c.lightForeground,
    '--dsw-alias-bg-layer-1': dark ? mix(c.background, 50, c.lighterBackground) : c.background,
    '--dsw-alias-bg-layer-2': raised,
    '--dsw-alias-bg-layer-3': dark ? c.selection : c.background,
    '--dsw-alias-bg-module-platform': mix(c.lighterBackground, 60, c.background),
    '--dsw-alias-bg-multi-select': mix(c.lighterBackground, 60, c.background),
    '--dsw-alias-bg-overlay': dark ? c.muted : c.selection,
    '--dsw-alias-bg-skeleton': translucent(c.foreground, 8),
    '--dsw-alias-border-l1': translucent(c.foreground, 8),
    '--dsw-alias-border-l2-darkmode-thin': translucent(c.foreground, 8),
    '--dsw-alias-border-l2': translucent(c.foreground, 14),
    '--dsw-alias-border-l3': translucent(c.foreground, 18),
    '--dsw-alias-border-l4': translucent(c.foreground, 24),
    '--dsw-alias-brand-primary-invert': c.foreground,
    '--dsw-alias-brand-primary-new-colorprimary-new-color': c.accent,
    '--dsw-alias-brand-primary': c.foreground,
    '--dsw-alias-brand-text': c.foreground,
    '--dsw-alias-button-contrast-fill': c.foreground,
    '--dsw-alias-button-elevated-fill': dark ? c.selection : c.background,
    '--dsw-alias-button-floating-fill': raised,
    '--dsw-alias-button-floating-hover': dark ? c.selection : c.lighterBackground,
    '--dsw-alias-button-ghost-active-border': c.muted,
    '--dsw-alias-button-ghost-active-fill': c.selection,
    '--dsw-alias-button-ghost-active-hover': mix(c.selection, 70, c.muted),
    '--dsw-alias-button-info-fill': c.accent,
    '--dsw-alias-button-info-hover': mix(c.accent, 85, c.foreground),
    '--dsw-alias-button-primary-dimmed': c.selection,
    '--dsw-alias-button-primary-hover': mix(c.foreground, 85, c.background),
    '--dsw-alias-interactive-bg-active': translucent(c.foreground, 14),
    '--dsw-alias-interactive-bg-hover-accent': translucent(c.foreground, 22),
    '--dsw-alias-interactive-bg-hover-danger': translucent(c.red, 15),
    '--dsw-alias-interactive-bg-hover-solid': c.lighterBackground,
    '--dsw-alias-interactive-bg-hover': translucent(c.foreground, 8),
    '--dsw-alias-label-caption': c.darkForeground,
    '--dsw-alias-label-deep-diving': mix(c.accent, 70, c.lightForeground),
    '--dsw-alias-label-deep-diving-shimmer': mix(c.accent, 60, c.brightForeground),
    '--dsw-alias-label-dimmed': c.muted,
    '--dsw-alias-label-primary-bluish': c.brightForeground,
    '--dsw-alias-label-primary-dimmed': c.foreground,
    '--dsw-alias-label-primary-foreground': c.background,
    '--dsw-alias-label-primary-inverted': c.background,
    '--dsw-alias-label-primary': c.foreground,
    '--dsw-alias-label-secondary': c.lightForeground,
    '--dsw-alias-label-tertiary': mix(c.lightForeground, 50, c.darkForeground),
    '--dsw-alias-link': c.accent,
    '--dsw-alias-markdown-citation': c.selection,
    '--dsw-alias-markdown-code-block-banner': mix(c.darkBackground, 50, c.lighterBackground),
    '--dsw-alias-markdown-code-block': c.darkBackground,
    '--dsw-alias-markdown-code-segment-selected': c.lighterBackground,
    '--dsw-alias-markdown-code-segment-unselected': c.darkBackground,
    '--dsw-alias-markdown-inline-code': c.lighterBackground,
    '--dsw-alias-markdown-placeholder': c.lighterBackground,
    '--dsw-alias-markdown-tag': c.lighterBackground,
    '--dsw-alias-scrollbar-bg-l1': c.muted,
    '--dsw-alias-scrollbar-bg-l2': c.muted,
    '--dsw-alias-scrollbar-hover-l1': c.darkForeground,
    '--dsw-alias-scrollbar-hover-l2': c.darkForeground,
    '--dsw-alias-state-business-primary': c.accent,
    '--dsw-alias-state-business-tertiary': mix(c.accent, 25, c.background),
    '--dsw-alias-state-error-primary': c.red,
    '--dsw-alias-state-error-secondary': c.red,
    '--dsw-alias-state-idle-primary': c.muted,
    '--dsw-alias-state-success-primary': c.green,
    '--dsw-alias-state-success-secondary': c.green,
    '--dsw-alias-state-success-tertiary': mix(c.green, 25, c.background),
    '--dsw-alias-state-warn-label': c.warning,
    '--dsw-alias-state-warn-primary': c.warning,
    '--dsw-alias-state-warn-secondary': c.warning,
    '--dsw-alias-state-warn-tertiary': mix(c.warning, 25, c.background),
    '--dsw-alias-switch-thumb': dark ? c.lightForeground : c.background,
    '--dsw-alias-toast-bg': toast,
    '--dsw-alias-toast-label': dark ? c.brightForeground : c.background,
    '--dsw-alias-tooltip-bg': toast,
    '--dsw-specific-bubble-highlight': mix(c.accent, 25, raised),
    '--dsw-specific-bubble': dark ? c.lighterBackground : mix(c.accent, 12, c.background),
    '--dsw-specific-input-major': raised,
    '--dsw-specific-login-input': c.darkBackground,
    '--dsw-menu-surface-fill': translucent(c.lighterBackground, 92),
    '--dsw-alias-menu-group-header-fill': translucent(c.lighterBackground, 94),
    '--dsw-specific-selector': mix(c.lighterBackground, 60, c.background),
    '--dsw-specific-sidebar-fill': c.darkBackground,
    '--dsw-specific-sidebar-nav-item-active-accent': mix(c.accent, 20, c.darkBackground),
    '--dsw-specific-sidebar-nav-item-active': c.selection,
    '--dsw-specific-sidebar-nav-item-hover': mix(c.selection, 50, c.darkBackground),
    '--dsw-specific-tip': mix(c.lighterBackground, 60, c.background),
  }
}
