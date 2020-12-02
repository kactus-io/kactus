import { compare } from 'compare-versions'
import memoizeOne from 'memoize-one'

function getSystemVersionSafe() {
  return 'getSystemVersion' in process ? process.getSystemVersion() : undefined
}

function systemVersionGreaterThanOrEqualTo(version: string) {
  const sysver = getSystemVersionSafe()
  return sysver === undefined ? false : compare(sysver, version, '>=')
}

/** Get the OS we're currently running on. */
export function getOS() {
  const version = getSystemVersionSafe()
  return `Mac OS ${version}`
}

/** We're currently running macOS and it is at least Mojave. */
export const isMacOSMojaveOrLater = memoizeOne(() =>
  systemVersionGreaterThanOrEqualTo('10.13.0')
)

/** We're currently running macOS and it is at least Big Sur. */
export const isMacOSBigSurOrLater = memoizeOne(
  // We're using 10.16 rather than 11.0 here due to
  // https://github.com/electron/electron/issues/26419
  () => systemVersionGreaterThanOrEqualTo('10.16')
)
