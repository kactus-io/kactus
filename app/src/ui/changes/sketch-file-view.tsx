import * as React from 'react'
import { UiView } from '../ui-view'
import { Button } from '../lib/button'
import { Octicon, OcticonSymbol } from '../octicons'
import { IKactusFile } from 'kactus-cli'
import { Loading } from '../lib/loading'

interface ISketchFileViewProps {
  readonly onExport: (path: string) => void
  readonly onImport: (path: string) => void
  readonly onOpenSketchFile: (file: IKactusFile) => void

  readonly sketchFile: IKactusFile

  readonly isImporting: boolean
  readonly isParsing: boolean
}

export class SketchFileView extends React.Component<
  ISketchFileViewProps,
  Readonly<{}>
> {
  private handleOpen = () => {
    this.props.onOpenSketchFile(this.props.sketchFile)
  }

  private handleImport = () => {
    this.props.onImport(this.props.sketchFile.path)
  }

  private handleExport = () => {
    this.props.onExport(this.props.sketchFile.path)
  }

  public render() {
    return (
      <UiView className="panel blankslate" id="blank-slate">
        <div className="title">
          {this.props.sketchFile.id}
        </div>
        <div className="content">
          <div className="callout">
            <Octicon symbol={OcticonSymbol.ruby} />
            <div>Open the file in Sketch</div>
            <Button
              onClick={this.handleOpen}
              disabled={!this.props.sketchFile.imported}
            >
              {__DARWIN__ ? 'Open File' : 'Open file'}
            </Button>
          </div>

          <div className="callout">
            <Octicon symbol={OcticonSymbol.fold} />
            <div>Regenerate Sketch file from JSON</div>
            <Button
              onClick={this.handleImport}
              disabled={!this.props.sketchFile.parsed}
            >
              {this.props.isImporting ? <Loading /> : null}{' '}
              {__DARWIN__ ? 'Regenerate Sketch File' : 'Regenerate Sketch file'}
            </Button>
          </div>

          <div className="callout">
            <Octicon symbol={OcticonSymbol.unfold} />
            <div>Export Sketch file to JSON</div>
            <Button
              onClick={this.handleExport}
              disabled={!this.props.sketchFile.imported}
            >
              {this.props.isParsing ? <Loading /> : null}{' '}
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
