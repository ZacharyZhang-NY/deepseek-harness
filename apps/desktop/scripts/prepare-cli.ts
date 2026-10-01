/** Package terminal launch scripts that reuse the installed Electron runtime. */

import { chmodSync, copyFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Copy the platform launcher into the application's public command directory.
 * @param destination - Physical runtime/cli directory prepared for the application.
 * @param platform - Target Desktop operating system.
 */
export function prepareDesktopCli(destination: string, platform: 'darwin' | 'win32' | 'linux'): void {
  const name = platform === 'win32' ? 'dsh.cmd' : 'dsh'
  const command = join(destination, 'bin', name)
  mkdirSync(join(destination, 'bin'), { recursive: true })
  // The Linux launcher finds the executable beside resources/ instead of inside an app bundle.
  copyFileSync(join(import.meta.dirname, '..', 'cli', platform === 'linux' ? 'dsh-linux' : name), command)
  if (platform !== 'win32') chmodSync(command, 0o755)
}
