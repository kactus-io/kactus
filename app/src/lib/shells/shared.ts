import { spawn, ChildProcess } from 'child_process'
import { pathExists } from '../file-system'
import { assertNever } from '../fatal-error'
import { IFoundShell } from './found-shell'
import { ShellError } from './error'

const appPath: (bundleId: string) => Promise<string> = require('app-path')

export enum Shell {
  Terminal = 'Terminal',
  Hyper = 'Hyper',
  iTerm2 = 'iTerm2',
  PowerShellCore = 'PowerShell Core',
}

export const Default = Shell.Terminal

export function parse(label: string): Shell {
  if (label === Shell.Terminal) {
    return Shell.Terminal
  }

  if (label === Shell.Hyper) {
    return Shell.Hyper
  }

  if (label === Shell.iTerm2) {
    return Shell.iTerm2
  }

  if (label === Shell.PowerShellCore) {
    return Shell.PowerShellCore
  }

  return Default
}

function getBundleID(shell: Shell): string {
  switch (shell) {
    case Shell.Terminal:
      return 'com.apple.Terminal'
    case Shell.iTerm2:
      return 'com.googlecode.iterm2'
    case Shell.Hyper:
      return 'co.zeit.hyper'
    case Shell.PowerShellCore:
      return 'com.microsoft.powershell'
    default:
      return assertNever(shell, `Unknown shell: ${shell}`)
  }
}

async function getShellPath(shell: Shell): Promise<string | null> {
  const bundleId = getBundleID(shell)
  try {
    return await appPath(bundleId)
  } catch (e) {
    // `appPath` will raise an error if it cannot find the program.
    return null
  }
}

export async function getAvailableShells(): Promise<
  ReadonlyArray<IFoundShell<Shell>>
> {
  const [terminalPath, hyperPath, iTermPath] = await Promise.all([
    getShellPath(Shell.Terminal),
    getShellPath(Shell.Hyper),
    getShellPath(Shell.iTerm2),
  ])

  const shells: Array<IFoundShell<Shell>> = []
  if (terminalPath) {
    shells.push({ shell: Shell.Terminal, path: terminalPath })
  }

  if (hyperPath) {
    shells.push({ shell: Shell.Hyper, path: hyperPath })
  }

  if (iTermPath) {
    shells.push({ shell: Shell.iTerm2, path: iTermPath })
  }

  return shells
}

export function launch(
  foundShell: IFoundShell<Shell>,
  path: string
): ChildProcess {
  const bundleID = getBundleID(foundShell.shell)
  const commandArgs = ['-b', bundleID, path]
  return spawn('open', commandArgs)
}

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
