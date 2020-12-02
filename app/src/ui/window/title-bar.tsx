import * as React from 'react'
import memoizeOne from 'memoize-one'
import { remote } from 'electron'
import { Octicon, OcticonSymbol } from '../octicons'
import { isMacOSBigSurOrLater } from '../../lib/get-os'

/** Get the height (in pixels) of the title bar depending on the platform */
export function getTitleBarHeight() {
  // Big Sur has taller title bars, see #10980
  return isMacOSBigSurOrLater() ? 26 : 22
}

interface ITitleBarProps {
  /** Whether we should hide the toolbar (and show inverted window controls) */
  readonly titleBarStyle: 'light' | 'dark'

  /** Whether or not to render the app icon */
  readonly showAppIcon: boolean

  /**
   * The current zoom factor of the Window represented as a fractional number
   * where 1 equals 100% (ie actual size) and 2 represents 200%.
   *
   * This is used on macOS to scale back the title bar to its original size
   * regardless of the zoom factor.
   */
  readonly windowZoomFactor?: number
}

export class TitleBar extends React.Component<ITitleBarProps> {
  private getStyle = memoizeOne((windowZoomFactor: number | undefined) => {
    const style: React.CSSProperties = { height: getTitleBarHeight() }

    // See windowZoomFactor in ITitleBarProps, this is only applicable on macOS.
    if (windowZoomFactor !== undefined) {
      style.zoom = 1 / windowZoomFactor
    }

    return style
  })

  private onTitlebarDoubleClick = () => {
    const actionOnDoubleClick = remote.systemPreferences.getUserDefault(
      'AppleActionOnDoubleClick',
      'string'
    )
    const mainWindow = remote.getCurrentWindow()

    switch (actionOnDoubleClick) {
      case 'Maximize':
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize()
        } else {
          mainWindow.maximize()
        }
        break
      case 'Minimize':
        mainWindow.minimize()
        break
    }
  }

  public render() {
    const titleBarClass =
      this.props.titleBarStyle === 'light' ? 'light-title-bar' : ''

    const appIcon = this.props.showAppIcon ? (
      <Octicon className="app-icon" symbol={OcticonSymbol.markGithub} />
    ) : null

    return (
      <div
        className={titleBarClass}
        id="kactus-app-title-bar"
        onDoubleClick={this.onTitlebarDoubleClick}
        style={this.getStyle(this.props.windowZoomFactor)}
      >
        {appIcon}
        {this.props.children}
      </div>
    )
  }
}
