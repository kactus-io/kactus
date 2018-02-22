import * as React from 'react'
import { UiView } from '../ui-view'
import { Button } from '../lib/button'
import { Octicon, OcticonSymbol } from '../octicons'
import { IKactusFile } from '../../lib/kactus'
import { Loading } from '../lib/loading'

interface ISketchFileViewProps {
  readonly onGetPreview: (file: IKactusFile) => void
  readonly onExport: (file: IKactusFile) => void
  readonly onImport: (file: IKactusFile) => void
  readonly onOpenSketchFile: (file: IKactusFile) => void

  readonly sketchFile: IKactusFile
}

export class SketchFileView extends React.Component<
  ISketchFileViewProps,
  Readonly<{}>
> {
  public constructor(props: ISketchFileViewProps) {
    super(props)
    if (!props.sketchFile.preview) {
      props.onGetPreview(props.sketchFile)
    }
  }

  public componentWillReceiveProps(nextProps: ISketchFileViewProps) {
    if (!nextProps.sketchFile.preview) {
      nextProps.onGetPreview(nextProps.sketchFile)
    }
  }

  private handleOpen = () => {
    this.props.onOpenSketchFile(this.props.sketchFile)
  }

  private handleImport = () => {
    this.props.onImport(this.props.sketchFile)
  }

  private handleExport = () => {
    this.props.onExport(this.props.sketchFile)
  }

  public render() {
    const preview = this.props.sketchFile.preview

    return (
      <UiView className="panel blankslate" id="blank-slate">
        <div className="preview">
          {preview && (
            <img src={`data:${preview.mediaType};base64,${preview.contents}`} />
          )}
        </div>

        <div className="content">
          <div className="title">{this.props.sketchFile.id}</div>
          <div className="callouts">
            <div className="callout">
              <Octicon symbol={OcticonSymbol.ruby} />
              <div>Open the file in Sketch</div>
              <Button
                onClick={this.handleOpen}
                disabled={!this.props.sketchFile.imported}
              >
                Open File
              </Button>
            </div>

            <div className="callout">
              <Octicon symbol={OcticonSymbol.fold} />
              <div>Regenerate Sketch file from JSON</div>
              <Button
                onClick={this.handleImport}
                disabled={!this.props.sketchFile.parsed}
              >
                {this.props.sketchFile.isImporting ? <Loading /> : null}{' '}
                Regenerate Sketch File
              </Button>
            </div>

            <div className="callout">
              <Octicon symbol={OcticonSymbol.unfold} />
              <div>Export Sketch file to JSON</div>
              <Button
                onClick={this.handleExport}
                disabled={!this.props.sketchFile.imported}
              >
                {this.props.sketchFile.isParsing ? <Loading /> : null} Export
                Sketch File
              </Button>
            </div>
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
