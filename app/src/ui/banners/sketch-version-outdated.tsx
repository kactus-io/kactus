import { remote } from 'electron'
import * as React from 'react'
import { Button } from '../lib/button'
import { Octicon, OcticonSymbol } from '../octicons'
import { Dispatcher } from '../dispatcher'
import { Banner } from './banner'

interface ISketchVersionOutdatedProps {
  readonly found?: string
  readonly dispatcher: Dispatcher
}

function noOp() {}

/**
 * A component which tells the user an update is available and gives them the
 * option of moving into the future or being a luddite.
 */
export class SketchVersionOutdated extends React.Component<
  ISketchVersionOutdatedProps,
  {}
> {
  public render() {
    const copy = this.props.found
      ? `Kactus is only compatible with Sketch >= 43. We found ${
          this.props.found
        }.`
      : "Kactus needs Sketch to function properly and we couldn't find it."
    return (
      <Banner id="sketch-outdated" dismissable={false} onDismissed={noOp}>
        <Octicon className="icon" symbol={OcticonSymbol.ruby} />

        <span>
          {copy}
          <Button onClick={this.downloadNow}>Download Sketch</Button>
          <Button onClick={this.locateSketch}>Locate Sketch</Button>
        </span>
      </Banner>
    )
  }

  private locateSketch = () => {
    const sketchPath: string[] | null = remote.dialog.showOpenDialog({
      buttonLabel: 'Select',
      defaultPath: '/Applications/',
      filters: [
        {
          name: 'App',
          extensions: ['app'],
        },
      ],
    })

    if (!sketchPath || !sketchPath.length) {
      return
    }

    this.props.dispatcher.changeSketchLocation(sketchPath[0])
  }

  private downloadNow = () => {
    this.props.dispatcher.openInBrowser('https://www.sketchapp.com/updates/')
  }
}
