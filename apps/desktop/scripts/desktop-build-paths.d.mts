import type { DesktopAutoUpdateTarget } from './desktop-auto-update-environment.mjs'

/** Every target Desktop can be packaged for; Linux is packaged locally and never published to an update feed. */
export type DesktopBuildTarget = DesktopAutoUpdateTarget | 'linux-x64'

/** Mutable target directories plus the shared immutable download cache. */
export interface DesktopTargetBuildPaths {
  readonly root: string
  readonly artifacts: string
  readonly unsignedArtifacts: string
  readonly runtime: string
  readonly packageSet: string
  readonly dsh: string
  readonly dshPnpm: string
  readonly electron: string
  readonly packedDsh: string
  readonly packedVendor: string
  readonly packedLandlock: string
  readonly downloads: string
}

/**
 * Resolve the fixed build target selected by a packaging environment.
 * @param env - Packaging environment.
 * @param hostPlatform - Build-host platform used when no target override exists.
 * @param hostArch - Build-host architecture used when no target override exists.
 * @returns Supported Desktop target name.
 */
export function resolveDesktopBuildTarget(
  env?: NodeJS.ProcessEnv,
  hostPlatform?: NodeJS.Platform,
  hostArch?: string,
): DesktopBuildTarget

/**
 * Return the mutable preparation and artifact directories owned by one release target.
 * @param target - Supported Desktop target name.
 * @returns Target paths plus the shared immutable download cache.
 */
export function desktopTargetBuildPaths(target: DesktopBuildTarget): DesktopTargetBuildPaths

/**
 * Return the platform and architecture of the payload one release target prepares.
 * Windows is prepared as x64 only, so this differs from the build host on an arm64 Windows machine.
 * @param target - Supported Desktop target name.
 * @returns Platform and architecture of the prepared payload.
 */
export function desktopTargetPlatform(target: DesktopBuildTarget): {
  readonly platform: 'darwin' | 'win32' | 'linux'
  readonly arch: 'arm64' | 'x64'
}

/**
 * Locate the Electron executable inside an extracted Electron distribution.
 * @param electronRoot - Directory the target's Electron archive was extracted into.
 * @param platform - Platform the distribution was built for.
 * @returns Absolute executable path.
 */
export function desktopElectronExecutable(electronRoot: string, platform: NodeJS.Platform): string

/**
 * Locate the Node executable that runs the Host, package scripts, and the terminal command.
 * Electron's Node mode serves macOS and Windows; Linux uses the primary runtime's standalone Node
 * because Electron exposes the system GLib to native modules there (electron/electron#46323).
 * @param platform - Target platform.
 * @param electronRoot - Directory the target's Electron archive was extracted into.
 * @param runtimeRoot - Target runtime directory containing `primary-runtime/`.
 * @returns Absolute executable path.
 */
export function desktopHostNodeExecutable(platform: NodeJS.Platform, electronRoot: string, runtimeRoot: string): string

/**
 * Resolve the paths owned by the target selected in a packaging environment.
 * @param env - Packaging environment.
 * @param hostPlatform - Build-host platform used when no target override exists.
 * @param hostArch - Build-host architecture used when no target override exists.
 * @returns Selected target paths.
 */
export function resolveDesktopTargetBuildPaths(
  env?: NodeJS.ProcessEnv,
  hostPlatform?: NodeJS.Platform,
  hostArch?: string,
): DesktopTargetBuildPaths

/**
 * Resolve the primary-runtime directory an unpackaged development launch uses.
 * @param env - Packaging environment.
 * @param hostPlatform - Build-host platform used when no target override exists.
 * @param hostArch - Build-host architecture used when no target override exists.
 * @returns Primary-runtime directory prepared for the selected target.
 */
export function developmentRuntimeDirectory(
  env?: NodeJS.ProcessEnv,
  hostPlatform?: NodeJS.Platform,
  hostArch?: string,
): string
