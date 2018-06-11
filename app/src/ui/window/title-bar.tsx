import * as React from 'react'

import { remote } from 'electron'
import { Octicon, OcticonSymbol } from '../octicons'

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

interface ITitleBarState {
  readonly style?: React.CSSProperties
}

function getState(props: ITitleBarProps): ITitleBarState {
  return {
    style: props.windowZoomFactor
      ? { zoom: 1 / props.windowZoomFactor }
      : undefined,
  }
}

export class TitleBar extends React.Component<ITitleBarProps, ITitleBarState> {
  public constructor(props: ITitleBarProps) {
    super(props)
    this.state = getState(props)
  }

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

  public componentWillReceiveProps(nextProps: ITitleBarProps) {
    if (this.props.windowZoomFactor !== nextProps.windowZoomFactor) {
      this.setState(getState(nextProps))
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
        style={this.state.style}
      >
        {appIcon}
        {this.props.children}
      </div>
    )
  }
}
