import * as React from 'react'
import { UiView } from '../ui-view'
import { Button } from '../lib/button'
import { Octicon, OcticonSymbol } from '../octicons'
import { IKactusFile } from 'kactus-cli'

interface ISketchFileViewProps {
  /** A function to call when the user chooses to create a repository. */
  readonly onExport: (path: string) => void

  /** A function to call when the user chooses to clone a repository. */
  readonly onImport: (path: string) => void

  readonly sketchFile: IKactusFile

  /** A function to call when the user chooses to add a local repository. */
  // readonly onAdd: () => void
}

export class SketchFileView extends React.Component<ISketchFileViewProps, void> {
  public render() {
    return (
      <UiView className='panel blankslate' id='blank-slate'>
        <div className='title'>
          {this.props.sketchFile.id}
        </div>
        <div className='content'>

          <div className='callout'>
            <Octicon symbol={OcticonSymbol.fold} />
            <div>Regenerate Sketch file from JSON</div>
            <Button onClick={() => this.props.onImport(this.props.sketchFile.path)} disabled={!this.props.sketchFile.parsed}>
              {__DARWIN__ ? 'Regenerate Sketch File' : 'Regenerate Sketch file'}
            </Button>
          </div>

          <div className='callout'>
            <Octicon symbol={OcticonSymbol.unfold} />
            <div>Export Sketch file to JSON</div>
            <Button onClick={() => this.props.onExport(this.props.sketchFile.path)} disabled={!this.props.sketchFile.imported}>
              {__DARWIN__ ? 'Export Sketch File' : 'Export Sketch file'}
            </Button>
          </div>

        </div>

        {/*<p className='footer'>
          Alternatively, you can drag and drop a local repository here
          to add it.
        </p>*/}
      </UiView>
    )
  }
}
