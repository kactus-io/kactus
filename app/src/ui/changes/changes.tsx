import * as React from 'react'
import { ChangedFileDetails } from './changed-file-details'
import { SketchFileView } from './sketch-file-view'
import {
  DiffSelection,
  IDiff,
  ImageDiffType,
  ITextDiffData,
} from '../../models/diff'
import { WorkingDirectoryFileChange } from '../../models/status'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { SeamlessDiffSwitcher } from '../diff/seamless-diff-switcher'
import { PopupType } from '../../models/popup'
import { ManualConflictResolution } from '../../models/manual-conflict-resolution'
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

  /** Whether a commit is in progress */
  readonly isCommitting: boolean
  readonly hideWhitespaceInDiff: boolean

  /**
   * Called when the user requests to open a binary file in an the
   * system-assigned application for said file type.
   */
  readonly onOpenBinaryFile: (fullPath: string) => void

  /**
   * Called when the user is viewing an image diff and requests
   * to change the diff presentation mode.
   */
  readonly onChangeImageDiffType: (type: ImageDiffType) => void

  /**
   * Whether we should show a confirmation dialog when the user
   * discards changes
   */
  readonly askForConfirmationOnDiscardChanges: boolean

  /**
   * Whether we should display side by side diffs.
   */
  readonly showSideBySideDiff: boolean

  /** Called when the user opens the diff options popover */
  readonly onDiffOptionsOpened: () => void
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

  private onDeleteSketchFile = (file: IKactusFile) => {
    this.props.dispatcher.deleteSketchFile(this.props.repository, file)
  }

  private onGetPreview = (file: IKactusFile) => {
    this.props.dispatcher.getSketchFilePreview(this.props.repository, file)
  }

  private onResolveConflict = (
    repository: Repository,
    file: WorkingDirectoryFileChange,
    option: ManualConflictResolution
  ) => {
    this.props.dispatcher.resolveConflict(repository, file, option)
  }

  private onDiscardChanges = (
    diff: ITextDiffData,
    diffSelection: DiffSelection
  ) => {
    if (!this.props.file) {
      return
    }
    if (this.props.askForConfirmationOnDiscardChanges) {
      this.props.dispatcher.showPopup({
        type: PopupType.ConfirmDiscardSelection,
        repository: this.props.repository,
        file: this.props.file,
        diff,
        selection: diffSelection,
      })
    } else {
      this.props.dispatcher.discardChangesFromSelection(
        this.props.repository,
        this.props.file.path,
        diff,
        diffSelection
      )
    }
  }

  public render() {
    const diff = this.props.diff
    const file = this.props.file

    const isCommitting = this.props.isCommitting

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
          onDelete={this.onDeleteSketchFile}
        />
      )
    }

    if (file && diff) {
      return (
        <div className="changed-file">
          <ChangedFileDetails
            path={file.path}
            status={file.status}
            diff={diff}
            showSideBySideDiff={this.props.showSideBySideDiff}
            onShowSideBySideDiffChanged={this.onShowSideBySideDiffChanged}
            onDiffOptionsOpened={this.props.onDiffOptionsOpened}
          />
          <SeamlessDiffSwitcher
            repository={this.props.repository}
            imageDiffType={this.props.imageDiffType}
            file={file}
            readOnly={isCommitting}
            onIncludeChanged={this.onDiffLineIncludeChanged}
            onDiscardChanges={this.onDiscardChanges}
            diff={diff}
            loading={this.props.loadingDiff}
            hideWhitespaceInDiff={this.props.hideWhitespaceInDiff}
            showSideBySideDiff={this.props.showSideBySideDiff}
            askForConfirmationOnDiscardChanges={
              this.props.askForConfirmationOnDiscardChanges
            }
            onOpenBinaryFile={this.props.onOpenBinaryFile}
            onChangeImageDiffType={this.props.onChangeImageDiffType}
            onResolveConflict={this.onResolveConflict}
          />
        </div>
      )
    }

    if (sketchPart && diff) {
      return (
        <div className="changed-file">
          <SeamlessDiffSwitcher
            repository={this.props.repository}
            imageDiffType={this.props.imageDiffType}
            file={file}
            readOnly={false}
            onIncludeChanged={this.onDiffLineIncludeChanged}
            onDiscardChanges={this.onDiscardChanges}
            diff={diff}
            loading={this.props.loadingDiff}
            hideWhitespaceInDiff={this.props.hideWhitespaceInDiff}
            showSideBySideDiff={this.props.showSideBySideDiff}
            askForConfirmationOnDiscardChanges={
              this.props.askForConfirmationOnDiscardChanges
            }
            onOpenBinaryFile={this.props.onOpenBinaryFile}
            onChangeImageDiffType={this.props.onChangeImageDiffType}
            onResolveConflict={this.onResolveConflict}
          />
        </div>
      )
    }

    return null
  }

  private onShowSideBySideDiffChanged = (showSideBySideDiff: boolean) => {
    this.props.dispatcher.onShowSideBySideDiffChanged(showSideBySideDiff)
  }
}
