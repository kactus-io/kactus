import * as React from 'react'
import { Button } from '../lib/button'
import { Octicon, OcticonSymbol } from '../octicons'

const BlankSlateImage = `file:///${__dirname}/static/empty-no-file-selected.svg`

interface INoChangesProps {
  /** Called when the user chooses to open the repository. */
  readonly onOpenRepository: () => void

  /** Called when the user chooses to create a new sketch file */
  readonly onCreateSketchFile: () => void
}

/** The component to display when there are no local changes. */
export class NoChanges extends React.Component<INoChangesProps, {}> {
  public render() {
    const opener = __DARWIN__ ? 'Finder' : 'Explorer'
    return (
      <div className="panel blankslate" id="blank-slate">
        <img src={BlankSlateImage} className="blankslate-image" />
        <div>No local changes</div>

        <div className="content">
          <div className="callout">
            <Octicon symbol={OcticonSymbol.ruby} />
            <div>Create a new Sketch File in Sketch</div>
            <Button
              onClick={this.props.onCreateSketchFile}
            >
              {__DARWIN__ ? 'Create File' : 'create file'}
            </Button>
          </div>

          <div className="callout">
            <Octicon symbol={OcticonSymbol.fileDirectory} />
            <div>Open this repository in {opener}</div>
            <Button
              onClick={this.props.onOpenRepository}
            >
              Open {opener}
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
