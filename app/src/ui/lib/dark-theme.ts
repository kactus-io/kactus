import { remote } from 'electron'
import { isMacOSMojaveOrLater } from '../../lib/get-os'

export function supportsDarkMode() {
  return isMacOSMojaveOrLater()
}

export function isDarkModeEnabled() {
  if (!supportsDarkMode()) {
    return false
  }

  // remote is an IPC call, so if we know there's no point making this call
  // we should avoid paying the IPC tax
  return remote.nativeTheme.shouldUseDarkColors
}
