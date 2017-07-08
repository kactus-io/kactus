import * as React from 'react'
import { LinkButton } from '../lib/link-button'
import { Octicon, OcticonSymbol } from '../octicons'
import { Dispatcher } from '../../lib/dispatcher'

interface ISketchVersionOutdatedProps {
  readonly found?: string
  readonly dispatcher: Dispatcher
}

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
      ? `Kactus is only compatible with Sketch >= 43. We found ${this.props
          .found}.`
      : "Kactus needs Sketch to function properly and we couldn't find it."
    return (
      <div id="update-available" className="active">
        <Octicon className="icon" symbol={OcticonSymbol.ruby} />

        <span>
          {copy}{' '}
          <LinkButton onClick={this.downloadNow}>
            Download Sketch now
          </LinkButton>
        </span>
      </div>
    )
  }

  private downloadNow = () => {
    this.props.dispatcher.openInBrowser('https://www.sketchapp.com/updates/')
  }
}
