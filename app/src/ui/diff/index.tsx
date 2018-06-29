import * as React from 'react'
import { Editor } from 'codemirror'

import { assertNever } from '../../lib/fatal-error'
import { encodePathAsUrl } from '../../lib/path'
import { ImageDiffType } from '../../lib/app-state'
import { Dispatcher } from '../../lib/dispatcher/dispatcher'

import { Repository } from '../../models/repository'
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

import { Button } from '../lib/button'

import { ImageDiff } from './image-diffs'
import { BinaryFile } from './binary-file'
import { ConflictedSketchDiff } from './conflicted-sketch-diff'
import { diffLineForIndex } from './diff-explorer'
import { DiffLineGutter } from './diff-line-gutter'
import { DiffSyntaxMode } from './diff-syntax-mode'

import { ISelectionStrategy } from './selection/selection-strategy'
import { TextDiff } from './text-diff'

import { LoadingOverlay } from '../lib/loading'

// image used when no diff is displayed
const NoDiffImage = encodePathAsUrl(__dirname, 'static/ufo-alert.svg')

type ChangedFile = WorkingDirectoryFileChange | CommittedFileChange

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
  readonly file: ChangedFile | null

  /** Called when the includedness of lines or a range of lines has changed. */
  readonly onIncludeChanged?: (diffSelection: DiffSelection) => void

  /** The diff that should be rendered */
  readonly diff: IDiff

  /** propagate errors up to the main application */
  readonly dispatcher: Dispatcher

  readonly openSketchFile?: () => void

  /** The type of image diff to display. */
  readonly imageDiffType: ImageDiffType

  readonly loading: number | null
}

interface IDiffState {
  readonly forceShowLargeDiff: boolean
}

/** A component which renders a diff for a file. */
export class Diff extends React.Component<IDiffProps, IDiffState> {
  private codeMirror: Editor | null = null

  /**
   * Maintain the current state of the user interacting with the diff gutter
   */
  private selection: ISelectionStrategy | null = null

  /**
   *  a local cache of gutter elements, keyed by the row in the diff
   */
  private cachedGutterElements = new Map<number, DiffLineGutter>()

  public constructor(props: IDiffProps) {
    super(props)

    this.state = {
      forceShowLargeDiff: false,
    }
  }

  public componentWillReceiveProps(nextProps: IDiffProps) {
    const codeMirror = this.codeMirror

    if (
      codeMirror &&
      nextProps.diff.kind === DiffType.Text &&
      (this.props.diff.kind !== DiffType.Text ||
        this.props.diff.text !== nextProps.diff.text)
    ) {
      codeMirror.setOption('mode', { name: DiffSyntaxMode.ModeName })
    }

    // HACK: This entire section is a hack. Whenever we receive
    // props we update all currently visible gutter elements with
    // the selection state from the file.
    if (nextProps.file instanceof WorkingDirectoryFileChange) {
      const selection = nextProps.file.selection
      const oldSelection =
        this.props.file instanceof WorkingDirectoryFileChange
          ? this.props.file.selection
          : null

      // Nothing has changed
      if (oldSelection === selection) {
        return
      }

      const diff = nextProps.diff
      this.cachedGutterElements.forEach((element, index) => {
        if (!element) {
          console.error('expected DOM element for diff gutter not found')
          return
        }

        if (diff.kind === DiffType.Text) {
          const line = diffLineForIndex(diff.hunks, index)
          const isIncludable = line ? line.isIncludeableLine() : false
          const isSelected = selection.isSelected(index) && isIncludable
          element.setSelected(isSelected)
        }
      })
    }
  }

  /**
   * Helper event listener, registered when starting a selection by
   * clicking anywhere on or near the gutter. Immediately removes itself
   * from the mouseup event on the document element and ends any current
   * selection.
   *
   * TODO: Once Electron upgrades to Chrome 55 we can drop this in favor
   * of the 'once' option in addEventListener, see
   * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
   */
  private onDocumentMouseUp = (ev: MouseEvent) => {
    ev.preventDefault()
    document.removeEventListener('mouseup', this.onDocumentMouseUp)
    this.endSelection()
  }

  /**
   * complete the selection gesture and apply the change to the diff
   */
  private endSelection = () => {
    if (!this.props.onIncludeChanged || !this.selection) {
      return
    }

    this.props.onIncludeChanged(this.selection.done())

    // operation is completed, clean this up
    this.selection = null
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
        loading={this.props.loading}
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
        <img src={NoDiffImage} className="blankslate-image" />
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
      text: diff.text,
      hunks: diff.hunks,
      kind: DiffType.Text,
      lineEndingsChange: diff.lineEndingsChange,
    }

    return this.renderTextDiff(textDiff)
  }

  private renderTextDiff(diff: ITextDiffData) {
    if (!this.props.file) {
      return null
    }
    return (
      <TextDiff
        repository={this.props.repository}
        file={this.props.file}
        readOnly={this.props.readOnly}
        onIncludeChanged={this.props.onIncludeChanged}
        text={diff.text}
        hunks={diff.hunks}
      />
    )
  }

  private renderEmpty(diff: ISketchDiff | ITextDiff) {
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
