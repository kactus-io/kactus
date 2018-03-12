import * as React from 'react'
import { BinaryFile } from './binary-file'
import { ConflictedSketchDiff } from './conflicted-sketch-diff'
import { TextDiff } from './text-diff'
import { assertNever } from '../../lib/fatal-error'
import { ImageDiff } from './image-diffs'

import { Repository } from '../../models/repository'
import { encodePathAsUrl } from '../../lib/path'
import { ImageDiffType } from '../../lib/app-state'
import {
  CommittedFileChange,
  WorkingDirectoryFileChange,
  AppFileStatus,
} from '../../models/status'
import {
  DiffSelection,
  DiffType,
  IDiff,
  ISketchDiff,
  IKactusFileType,
  ITextDiffData,
  IVisualTextDiffData,
  ITextDiff,
  ILargeTextDiff,
} from '../../models/diff'
import { Dispatcher } from '../../lib/dispatcher/dispatcher'

import { Button } from '../lib/button'

import { LoadingOverlay } from '../lib/loading'

// image used when no diff is displayed
const NoDiffImage = encodePathAsUrl(__dirname, 'static/ufo-alert.svg')

/** The props for the Diff component. */
interface IDiffProps {
  readonly repository: Repository

  /**
   * Whether the diff is readonly, e.g., displaying a historical diff, or the
   * diff's lines can be selected, e.g., displaying a change in the working
   * directory.
   */
  readonly readOnly: boolean

  /** The file whose diff should be displayed. */
  readonly file: WorkingDirectoryFileChange | CommittedFileChange | null

  /** Called when the includedness of lines or a range of lines has changed. */
  readonly onIncludeChanged?: (diffSelection: DiffSelection) => void

  /** The diff that should be rendered */
  readonly diff: IDiff

  /** propagate errors up to the main application */
  readonly dispatcher: Dispatcher

  readonly openSketchFile?: () => void

  /** The type of image diff to display. */
  readonly imageDiffType: ImageDiffType

  readonly loading: boolean
}

interface IDiffState {
  readonly forceShowLargeDiff: boolean
}

/** A component which renders a diff for a file. */
export class Diff extends React.Component<IDiffProps, IDiffState> {
  public constructor(props: IDiffProps) {
    super(props)

    this.state = {
      forceShowLargeDiff: false,
    }
  }

  private onChangeImageDiffType = (type: ImageDiffType) => {
    this.props.dispatcher.changeImageDiffType(type)
  }

  private onPickOurs = () => {
    if (!this.props.file) {
      log.error('This can not be happening...')
      return
    }
    this.props.dispatcher.resolveConflict(
      this.props.repository,
      this.props.file.path,
      'ours'
    )
  }

  private onPickTheirs = () => {
    if (!this.props.file) {
      log.error('This can not be happening...')
      return
    }
    this.props.dispatcher.resolveConflict(
      this.props.repository,
      this.props.file.path,
      'theirs'
    )
  }

  private renderSketchConflictedDiff(diff: ISketchDiff) {
    return (
      <ConflictedSketchDiff
        onChangeDiffType={this.onChangeImageDiffType}
        diffType={this.props.imageDiffType}
        current={diff.current!}
        previous={diff.previous!}
        text={diff.text}
        hunks={diff.hunks}
        onPickOurs={this.onPickOurs}
        onPickTheirs={this.onPickTheirs}
        repository={this.props.repository}
        readOnly={this.props.readOnly}
        file={this.props.file}
      />
    )
  }

  private renderImage(diff: IVisualTextDiffData) {
    return (
      <ImageDiff
        repository={this.props.repository}
        readOnly={this.props.readOnly}
        file={this.props.file}
        current={diff.current!}
        previous={diff.previous!}
        text={diff.text}
        hunks={diff.hunks}
        onIncludeChanged={this.props.onIncludeChanged}
        onChangeImageDiffType={this.onChangeImageDiffType}
        imageDiffType={this.props.imageDiffType}
      />
    )
  }

  private renderBinaryFile() {
    if (!this.props.file) {
      return null
    }
    return (
      <BinaryFile
        path={this.props.file.path}
        repository={this.props.repository}
        dispatcher={this.props.dispatcher}
      />
    )
  }

  private renderLargeTextDiff() {
    return (
      <div className="panel empty large-diff">
        <img src={NoDiffImage} />
        <p>
          The diff is too large to be displayed by default.
          <br />
          You can try to show it anyways, but performance may be negatively
          impacted.
        </p>
        <Button onClick={this.showLargeDiff}>Show Diff</Button>
      </div>
    )
  }

  private renderUnrenderableDiff() {
    return (
      <div className="panel empty large-diff">
        <img src={NoDiffImage} />
        <p>The diff is too large to be displayed.</p>
      </div>
    )
  }

  private renderLargeText(diff: ILargeTextDiff) {
    // guaranteed to be set since this function won't be called if text or hunks are null
    const textDiff: ITextDiff = {
      text: diff.text!,
      hunks: diff.hunks!,
      kind: DiffType.Text,
      lineEndingsChange: diff.lineEndingsChange,
    }

    return this.renderTextDiff(textDiff)
  }

  private renderTextDiff(diff: ITextDiffData) {
    return (
      <TextDiff
        repository={this.props.repository}
        readOnly={this.props.readOnly}
        file={this.props.file}
        text={diff.text}
        hunks={diff.hunks}
        onIncludeChanged={this.props.onIncludeChanged}
      />
    )
  }

  private renderEmpty(diff: ISketchDiff | ITextDiff) {
    console.log(diff)
    if (diff.isDirectory) {
      return (
        <div className="panel empty">
          This is a new directory that contains too many files to show them all.
          This is probably a new Sketch file. Commit it, the diff will show
          nicely afterwards.
        </div>
      )
    }

    return <div className="panel empty">The file is empty</div>
  }

  private renderDiff(diff: IDiff): JSX.Element | null {
    switch (diff.kind) {
      case DiffType.Text: {
        if (diff.hunks.length === 0) {
          if (this.props.file && this.props.file.status === AppFileStatus.New) {
            return this.renderEmpty(diff)
          }

          if (
            this.props.file &&
            this.props.file.status === AppFileStatus.Renamed
          ) {
            return (
              <div className="panel renamed">
                The file was renamed but not changed
              </div>
            )
          }

          return <div className="panel empty">No content changes found</div>
        }
        return this.renderTextDiff(diff)
      }
      case DiffType.Binary:
        return this.renderBinaryFile()
      case DiffType.Image:
      case DiffType.VisualText:
        return this.renderImage(diff)
      case DiffType.Sketch: {
        if (diff.hunks.length === 0) {
          if (this.props.file && this.props.file.status === AppFileStatus.New) {
            return this.renderEmpty(diff)
          }

          if (
            this.props.file &&
            this.props.file.status === AppFileStatus.Renamed
          ) {
            return (
              <div className="panel renamed">
                The file was renamed but not changed
              </div>
            )
          }
        }

        if (diff.type === IKactusFileType.Style) {
          return this.renderTextDiff(diff)
        }

        let content
        if (
          this.props.file &&
          this.props.file.status === AppFileStatus.Conflicted
        ) {
          content = this.renderSketchConflictedDiff(diff)
        } else {
          content = this.renderImage(diff)
        }

        return (
          <div className="sketch-diff-wrapper">
            {this.props.file &&
              this.props.readOnly &&
              this.props.openSketchFile && (
                <div className="sketch-diff-checkbox">
                  <Button type="submit" onClick={this.props.openSketchFile}>
                    Open Sketch file
                  </Button>
                </div>
              )}
            {content}
          </div>
        )
      }
      case DiffType.LargeText:
        return this.state.forceShowLargeDiff
          ? this.renderLargeText(diff)
          : this.renderLargeTextDiff()
      case DiffType.Unrenderable:
        return this.renderUnrenderableDiff()
      default:
        return assertNever(diff, `Unsupported diff type: ${diff}`)
    }
  }

  private showLargeDiff = () => {
    this.setState({ forceShowLargeDiff: true })
  }

  public render() {
    return (
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexGrow: 1,
          position: 'relative',
        }}
      >
        {this.renderDiff(this.props.diff)}
        {this.props.loading && <LoadingOverlay />}
      </div>
    )
  }
}
