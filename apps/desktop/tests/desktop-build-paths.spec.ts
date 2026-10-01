import { join, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  desktopElectronExecutable,
  desktopHostNodeExecutable,
  desktopTargetBuildPaths,
  desktopTargetPlatform,
  developmentRuntimeDirectory,
  resolveDesktopBuildTarget,
} from '../scripts/desktop-build-paths.mjs'

describe('desktop build paths', () => {
  it('isolates every mutable build directory by complete target', () => {
    const arm64 = desktopTargetBuildPaths('mac-arm64')
    const x64 = desktopTargetBuildPaths('mac-x64')
    const windows = desktopTargetBuildPaths('win-x64')
    const mutableKeys = [
      'root',
      'artifacts',
      'unsignedArtifacts',
      'runtime',
      'packageSet',
      'dsh',
      'dshPnpm',
      'electron',
      'packedDsh',
      'packedVendor',
      'packedLandlock',
    ] as const

    for (const key of mutableKeys) {
      expect(new Set([arm64[key], x64[key], windows[key]]).size).toBe(3)
    }
    expect(arm64.artifacts).toContain(join('targets', 'mac-arm64', 'artifacts'))
    expect(x64.dsh).toContain(join('targets', 'mac-x64', 'dsh'))
    expect(windows.runtime).toContain(join('targets', 'win-x64', 'runtime'))
  })

  it('shares only the immutable upstream download cache', () => {
    const arm64 = desktopTargetBuildPaths('mac-arm64')
    const x64 = desktopTargetBuildPaths('mac-x64')
    expect(arm64.downloads).toBe(x64.downloads)
    expect(arm64.downloads).not.toContain(`${sep}targets${sep}`)
  })

  it('resolves the development primary runtime from the build target rather than the host architecture', () => {
    expect(developmentRuntimeDirectory({}, 'darwin', 'arm64'))
      .toContain(join('targets', 'mac-arm64', 'runtime', 'primary-runtime'))
    expect(developmentRuntimeDirectory({}, 'darwin', 'x64'))
      .toContain(join('targets', 'mac-x64', 'runtime', 'primary-runtime'))
    expect(developmentRuntimeDirectory({}, 'win32', 'arm64'))
      .toContain(join('targets', 'win-x64', 'runtime', 'primary-runtime'))
  })

  it('maps every target to the platform and architecture of the payload it prepares', () => {
    expect(desktopTargetPlatform('mac-arm64')).toEqual({ platform: 'darwin', arch: 'arm64' })
    expect(desktopTargetPlatform('mac-x64')).toEqual({ platform: 'darwin', arch: 'x64' })
    expect(desktopTargetPlatform('win-x64')).toEqual({ platform: 'win32', arch: 'x64' })
    expect(desktopTargetPlatform('linux-x64')).toEqual({ platform: 'linux', arch: 'x64' })
    expect(() => desktopTargetPlatform('linux-arm64' as 'mac-x64')).toThrow(/unsupported target/u)
  })

  it('locates the Electron executable inside each platform distribution', () => {
    expect(desktopElectronExecutable('/electron', 'win32')).toBe(join('/electron', 'electron.exe'))
    expect(desktopElectronExecutable('/electron', 'linux')).toBe(join('/electron', 'electron'))
    expect(desktopElectronExecutable('/electron', 'darwin')).toBe(join('/electron', 'Electron.app', 'Contents', 'MacOS', 'Electron'))
  })

  it('runs the Linux Host on the primary runtime Node and other Hosts on Electron', () => {
    expect(desktopHostNodeExecutable('linux', '/electron', '/runtime'))
      .toBe(join('/runtime', 'primary-runtime', 'dependencies', 'node', 'bin', 'node'))
    expect(desktopHostNodeExecutable('win32', '/electron', '/runtime')).toBe(join('/electron', 'electron.exe'))
  })

  it('resolves environment overrides and rejects unsupported targets', () => {
    expect(resolveDesktopBuildTarget({
      DSH_DESKTOP_TARGET_PLATFORM: 'darwin',
      DSH_DESKTOP_TARGET_ARCH: 'x64',
    }, 'darwin', 'arm64')).toBe('mac-x64')
    expect(resolveDesktopBuildTarget({}, 'win32', 'x64')).toBe('win-x64')
    expect(resolveDesktopBuildTarget({}, 'linux', 'x64')).toBe('linux-x64')
    expect(() => resolveDesktopBuildTarget({}, 'linux', 'arm64')).toThrow(/unsupported target/u)
    expect(() => desktopTargetBuildPaths('linux-arm64' as 'mac-x64')).toThrow(/unsupported target/u)
  })
})
