import * as React from 'react'
import { Octicon, syncClockwise } from '../octicons'

/** A Loading component. */
export class Loading extends React.Component<{}, {}> {
  public render() {
    return <Octicon className="spin" symbol={syncClockwise} />
  }
}

export class LoadingOverlay extends React.Component<{}, { mounted: boolean }> {
  public constructor(props: {}) {
    super(props)

    this.state = {
      mounted: false,
    }
  }

  public componentDidMount() {
    this.setState({
      mounted: true,
    })
  }

  public render() {
    return (
      <div
        className={
          'loading-overlay' +
          (this.state.mounted ? ' loading-overlay-mounted' : '')
        }
      >
        <Loading />
      </div>
    )
  }
}
