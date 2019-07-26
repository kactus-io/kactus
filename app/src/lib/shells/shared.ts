import { ChildProcess } from 'child_process'
import { pathExists } from 'fs-extra'
import { IFoundShell } from './found-shell'
import { ShellError } from './error'

import { Shell, Default, parse, getAvailableShells, launch } from './darwin'

export { Shell, Default, parse, getAvailableShells, launch }

export type FoundShell = IFoundShell<Shell>

let shellCache: ReadonlyArray<FoundShell> | null = null

/** Get the shells available for the user. */
export async function getCachedAvailableShells(): Promise<
  ReadonlyArray<FoundShell>
> {
  if (shellCache) {
    return shellCache
  }
  shellCache = await getAvailableShells()
  return shellCache
}

/** Find the given shell or the default if the given shell can't be found. */
export async function findShellOrDefault(shell: Shell): Promise<FoundShell> {
  const available = await getCachedAvailableShells()
  const found = available.find(s => s.shell === shell)
  if (found) {
    return found
  } else {
    return available.find(s => s.shell === Default)!
  }
}

/** Launch the given shell at the path. */
export async function launchShell(
  shell: FoundShell,
  path: string,
  onError: (error: Error) => void
): Promise<void> {
  // We have to manually cast the wider `Shell` type into the platform-specific
  // type. This is less than ideal, but maybe the best we can do without
  // platform-specific build targets.
  const exists = await pathExists(shell.path)
  if (!exists) {
    const label = 'Preferences'
    throw new ShellError(
      `Could not find executable for '${shell.shell}' at path '${
        shell.path
      }'.  Please open ${label} and select an available shell.`
    )
  }

  const cp = launch(shell as IFoundShell<Shell>, path)

  addErrorTracing(shell.shell, cp, onError)
  return Promise.resolve()
}

function addErrorTracing(
  shell: Shell,
  cp: ChildProcess,
  onError: (error: Error) => void
) {
  cp.stderr.on('data', chunk => {
    const text = chunk instanceof Buffer ? chunk.toString() : chunk
    log.debug(`[${shell}] stderr: '${text}'`)
  })

  cp.on('error', err => {
    log.debug(`[${shell}] an error was encountered`, err)
    onError(err)
  })

  cp.on('exit', code => {
    if (code !== 0) {
      log.debug(`[${shell}] exit code: ${code}`)
    }
  })
}
