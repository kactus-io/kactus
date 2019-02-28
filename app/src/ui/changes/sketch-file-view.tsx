import * as React from 'react'
import { Octicon, OcticonSymbol } from '../octicons'
import { IKactusFile } from '../../lib/kactus'
import { Loading } from '../lib/loading'
import { BlankslateAction } from './blankslate-action'

interface ISketchFileViewProps {
  readonly onGetPreview: (file: IKactusFile) => void
  readonly onExport: (file: IKactusFile) => void
  readonly onImport: (file: IKactusFile) => void
  readonly onOpenSketchFile: (file: IKactusFile) => void
  readonly onDelete: (file: IKactusFile) => void

  readonly sketchFile: IKactusFile
}

export class SketchFileView extends React.Component<
  ISketchFileViewProps,
  Readonly<{}>
> {
  public constructor(props: ISketchFileViewProps) {
    super(props)
    if (!props.sketchFile.preview && props.sketchFile.imported) {
      props.onGetPreview(props.sketchFile)
    }
  }

  public componentWillReceiveProps(nextProps: ISketchFileViewProps) {
    if (
      !nextProps.sketchFile.preview &&
      !nextProps.sketchFile.previewError &&
      nextProps.sketchFile.imported
    ) {
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

  private handleDelete = () => {
    this.props.onDelete(this.props.sketchFile)
  }

  public render() {
    const {
      preview,
      previewError,
      id,
      imported,
      isImporting,
      parsed,
      isParsing,
    } = this.props.sketchFile
    return (
      <div id="no-changes">
        <div className="content">
          <div className="header">
            <div className="text">
              <h1>{id}</h1>
            </div>
            {preview && (
              <img
                src={`data:${preview.mediaType};base64,${preview.contents}`}
                className="blankslate-image"
              />
            )}
            {previewError && (
              <div>
                <Octicon symbol={OcticonSymbol.alert} />
                <div>
                  Couldn't generate the preview for the file. Be careful, this
                  could indicate that the file cannot be opened by Sketch.
                </div>
              </div>
            )}
          </div>
          <div className="actions primary">
            <BlankslateAction
              onClick={this.handleOpen}
              title="Open the file in Sketch"
              description={''}
              discoverabilityContent={''}
              buttonText={'Open File'}
              disabled={!imported}
              type={'primary'}
            />
          </div>
          <div className="actions">
            <BlankslateAction
              onClick={this.handleImport}
              title="Regenerate Sketch file from JSON"
              description={''}
              discoverabilityContent={''}
              buttonText={
                <span>
                  {isImporting ? <Loading /> : null} Regenerate Sketch File
                </span>
              }
              disabled={!parsed}
            />
            <BlankslateAction
              onClick={this.handleExport}
              title="Export Sketch file to JSON"
              description={''}
              discoverabilityContent={''}
              buttonText={
                <span>{isParsing ? <Loading /> : null} Export Sketch File</span>
              }
              disabled={!imported}
            />
            <BlankslateAction
              onClick={this.handleDelete}
              title="Delete Sketch file from the repository"
              description={''}
              discoverabilityContent={''}
              buttonText={'Delete Sketch File'}
            />
          </div>
        </div>
      </div>
    )
  }
}
