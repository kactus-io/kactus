import * as React from 'react'
import { Diff } from '../diff'
import { ChangedFileDetails } from './changed-file-details'
import { SketchFileView } from './sketch-file-view'
import { ImageDiffType } from '../../lib/app-state'
import { DiffSelection, IDiff } from '../../models/diff'
import { WorkingDirectoryFileChange } from '../../models/status'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../../lib/dispatcher'
import { IKactusFile } from '../../lib/kactus'

interface IChangesProps {
  readonly repository: Repository
  readonly sketchFile: IKactusFile | null
  readonly file: WorkingDirectoryFileChange | null
  readonly diff: IDiff | null
  readonly dispatcher: Dispatcher
  readonly imageDiffType: ImageDiffType
  readonly loadingDiff: number | null
  readonly selectedSketchPartID: string | null
}

export class Changes extends React.Component<IChangesProps, {}> {
  private onDiffLineIncludeChanged = (diffSelection: DiffSelection) => {
    const file = this.props.file
    this.props.dispatcher.changeFileLineSelection(
      this.props.repository,
      file!,
      diffSelection
    )
  }

  private onSketchParse = (file: IKactusFile) => {
    this.props.dispatcher.parseSketchFile(this.props.repository, file)
  }

  private onSketchImport = (file: IKactusFile) => {
    this.props.dispatcher.importSketchFile(this.props.repository, file)
  }

  private onOpenSketchFile = (file: IKactusFile) => {
    this.props.dispatcher.openSketchFile(file)
  }

  private onGetPreview = (file: IKactusFile) => {
    this.props.dispatcher.getSketchFilePreview(this.props.repository, file)
  }

  public render() {
    const diff = this.props.diff
    const file = this.props.file
    const sketchFile = this.props.sketchFile
    const sketchPart = this.props.selectedSketchPartID

    if (sketchFile) {
      return (
        <SketchFileView
          sketchFile={sketchFile}
          onGetPreview={this.onGetPreview}
          onExport={this.onSketchParse}
          onImport={this.onSketchImport}
          onOpenSketchFile={this.onOpenSketchFile}
        />
      )
    }

    if (file && diff) {
      return (
        <div className="changed-file">
          <ChangedFileDetails
            path={file.path}
            oldPath={file.oldPath}
            status={file.status}
            diff={diff}
            onOpenMergeTool={this.onOpenMergeTool}
          />

          <div className="diff-wrapper">
            <Diff
              repository={this.props.repository}
              imageDiffType={this.props.imageDiffType}
              file={file}
              readOnly={false}
              onIncludeChanged={this.onDiffLineIncludeChanged}
              diff={diff}
              dispatcher={this.props.dispatcher}
              loading={this.props.loadingDiff}
            />
          </div>
        </div>
      )
    }

    if (sketchPart && diff) {
      return (
        <div className="changed-file">
          <div className="diff-wrapper">
            <Diff
              repository={this.props.repository}
              imageDiffType={this.props.imageDiffType}
              file={file}
              readOnly={false}
              onIncludeChanged={this.onDiffLineIncludeChanged}
              diff={diff}
              dispatcher={this.props.dispatcher}
              loading={this.props.loadingDiff}
            />
          </div>
        </div>
      )
    }

    return null
  }

  private onOpenMergeTool = (path: string) => {
    this.props.dispatcher.openMergeTool(this.props.repository, path)
  }
}
