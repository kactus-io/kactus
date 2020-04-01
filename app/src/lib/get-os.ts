import { compare } from 'compare-versions'
import { UAParser } from 'ua-parser-js'

/** Get the OS we're currently running on. */
export function getOS() {
  // On macOS, OS.release() gives us the kernel version which isn't terribly
  // meaningful to any human being, so we'll parse the User Agent instead.
  // See https://github.com/desktop/desktop/issues/1130.
  const parser = new UAParser()
  const os = parser.getOS()
  return `${os.name} ${os.version}`
}

/** See the OS we're currently running on is at least Mojave. */
export function isMojaveOrLater() {
  const parser = new UAParser()
  const os = parser.getOS()

  if (os.version === undefined) {
    return false
  }

  return compare(os.version, '10.13.0', '>=')
}
