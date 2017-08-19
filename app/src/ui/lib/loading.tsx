import * as React from 'react'
import { Octicon, OcticonSymbol } from '../octicons'

/** A Loading component. */
export class Loading extends React.Component<{}, {}> {
  public render() {
    return <Octicon className="spin" symbol={OcticonSymbol.sync} />
  }
}

export class LoadingOverlay extends React.Component<{}, { mounted: boolean }> {
  public componentDidMount() {
    setTimeout(
      () =>
        this.setState({
          mounted: true,
        }),
      0
    )
  }

  public render() {
    return (
      <div
        className={
          'loading-overlay' +
          ((this.state || {}).mounted ? ' loading-overlay-mounted' : '')
        }
      >
        <Loading />
      </div>
    )
  }
}
