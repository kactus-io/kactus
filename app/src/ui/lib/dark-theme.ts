import { remote } from 'electron'
import { isMojaveOrLater } from '../../lib/get-os'

export function supportsDarkMode() {
  return isMojaveOrLater()
}

export function isDarkModeEnabled() {
  if (!supportsDarkMode()) {
    return false
  }

  // remote is an IPC call, so if we know there's no point making this call
  // we should avoid paying the IPC tax
  return remote.systemPreferences.isDarkMode()
}
