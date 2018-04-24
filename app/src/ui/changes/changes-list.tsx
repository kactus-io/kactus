import * as React from 'react'
import * as Path from 'path'

import { CommitMessage } from './commit-message'
import { ChangedFile } from './changed-file'
import { ChangedSketchPart } from './changed-sketch-part'
import { List, ClickSource } from '../lib/list'
import {
  AppFileStatus,
  WorkingDirectoryStatus,
  WorkingDirectoryFileChange,
  FileType,
  TFileOrSketchPartChange,
  TSketchPartChange,
} from '../../models/status'
import { DiffSelectionType } from '../../models/diff'
import { CommitIdentity } from '../../models/commit-identity'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { ICommitMessage } from '../../lib/app-state'
import { IGitHubUser } from '../../lib/databases'
import { Dispatcher } from '../../lib/dispatcher'
import { IAutocompletionProvider } from '../autocompletion'
import { Repository } from '../../models/repository'
import { showContextualMenu } from '../main-process-proxy'
import { IKactusFile } from '../../lib/kactus'
import { IAuthor } from '../../models/author'
import { ITrailer } from '../../lib/git/interpret-trailers'
import { IMenuItem } from '../../lib/menu-item'
import { arrayEquals } from '../../lib/equality'

const RowHeight = 29
const GitIgnoreFileName = '.gitignore'

interface IChangesListProps {
  readonly repository: Repository
  readonly workingDirectory: WorkingDirectoryStatus
  readonly selectedFileIDs: string[]
  readonly selectedSketchFileID: string | null
  readonly selectedSketchPartID: string | null
  readonly sketchFiles: Array<IKactusFile>
  readonly onFileSelectionChanged: (file: WorkingDirectoryFileChange) => void
  readonly onSketchPartSelectionChanged: (file: TSketchPartChange) => void
  readonly onSketchFileSelectionChanged: (file: IKactusFile) => void
  readonly onIncludeChanged: (path: string, include: boolean) => void
  readonly onSelectAll: (selectAll: boolean) => void
  readonly onCreateCommit: (
    summary: string,
    description: string | null,
    trailers?: ReadonlyArray<ITrailer>
  ) => Promise<boolean>
  readonly onDiscardChanges: (file: WorkingDirectoryFileChange) => void
  readonly onDiscardAllChanges: (
    files: ReadonlyArray<WorkingDirectoryFileChange>
  ) => void

  /**
   * Called to reveal a file in the native file manager.
   * @param path The path of the file relative to the root of the repository
   */
  readonly onRevealInFileManager: (path: string) => void

  /**
   * Called to open a file it its default application
   * @param path The path of the file relative to the root of the repository
   */
  readonly onOpenItem: (path: string) => void
  readonly branch: string | null
  readonly commitAuthor: CommitIdentity | null
  readonly gitHubUser: IGitHubUser | null
  readonly dispatcher: Dispatcher
  readonly availableWidth: number
  readonly isCommitting: boolean

  /**
   * Click event handler passed directly to the onRowClick prop of List, see
   * List Props for documentation.
   */
  readonly onRowClick?: (row: number, source: ClickSource) => void

  readonly commitMessage: ICommitMessage | null
  readonly contextualCommitMessage: ICommitMessage | null

  /** The autocompletion providers available to the repository. */
  readonly autocompletionProviders: ReadonlyArray<IAutocompletionProvider<any>>

  /** Called when the given pattern should be ignored. */
  readonly onIgnore: (pattern: string | string[]) => void

  readonly isLoadingStatus: boolean

  /**
   * Whether or not to show a field for adding co-authors to
   * a commit (currently only supported for GH/GHE repositories)
   */
  readonly showCoAuthoredBy: boolean

  /**
   * A list of authors (name, email pairs) which have been
   * entered into the co-authors input box in the commit form
   * and which _may_ be used in the subsequent commit to add
   * Co-Authored-By commit message trailers depending on whether
   * the user has chosen to do so.
   */
  readonly coAuthors: ReadonlyArray<IAuthor>

  /** The name of the currently selected external editor */
  readonly externalEditorLabel?: string

  /**
   * Callback to open a selected file using the configured external editor
   *
   * @param fullPath The full path to the file on disk
   */
  readonly onOpenInExternalEditor: (fullPath: string) => void
}

function getFileList(
  files: ReadonlyArray<WorkingDirectoryFileChange>,
  oldList?: Array<TFileOrSketchPartChange>
) {
  const acc: Array<TFileOrSketchPartChange> = []
  return files.reduce((prev, f, i) => {
    if (!f.parts || !f.sketchFile) {
      prev.push(f)
    } else {
      const previousFile = files[i - 1] || {}

      const conflicted = f.status === AppFileStatus.Conflicted

      f.parts.forEach((part, i, arr) => {
        if (part === (previousFile.parts || [])[i]) {
          if (conflicted) {
            const correspondingPart = prev.find(
              p => !(p instanceof WorkingDirectoryFileChange) && p.name === part
            )
            if (
              correspondingPart &&
              !correspondingPart.status &&
              !(correspondingPart instanceof WorkingDirectoryFileChange)
            ) {
              correspondingPart.status = AppFileStatus.Conflicted
            }
          }
          return
        }
        const parts = arr.slice(0, i)

        let id = parts.join('/')
        if (id) {
          id += '/' + part
        } else {
          id = part
        }

        const oldSketchPart = oldList && oldList.find(f => f.id === id)
        prev.push({
          opened:
            oldSketchPart &&
            !(oldSketchPart instanceof WorkingDirectoryFileChange)
              ? oldSketchPart.opened
              : i === 0,
          type:
            i === 0
              ? FileType.SketchFile
              : i === 1 ? FileType.PageFile : FileType.LayerFile,
          id,
          name: part,
          parts,
          status: conflicted ? AppFileStatus.Conflicted : undefined,
        })
      })

      prev.push(f)
    }
    return prev
  }, acc)
}

function getOpenedFilesList(files: Array<TFileOrSketchPartChange>) {
  const res: Array<TFileOrSketchPartChange> = []
  return files.reduce((prev, f, i, arr) => {
    if (!f.parts || !f.parts.length) {
      prev.push(f)
    } else {
      const id = f.parts.join('/')
      const parent = arr.find(a => a.id === id)
      const parents = arr.filter(a => id.indexOf(a.id) === 0)
      if (
        parent &&
        (parent.type === FileType.NormalFile ||
          parents.every(
            p => p instanceof WorkingDirectoryFileChange || p.opened
          ))
      ) {
        prev.push(f)
      }
    }
    return prev
  }, res)
}

interface IChangesState {
  readonly files: Array<TFileOrSketchPartChange>
  readonly visibleFileList: Array<TFileOrSketchPartChange>
}

export class ChangesList extends React.Component<
  IChangesListProps,
  IChangesState
> {
  public constructor(props: IChangesListProps) {
    super(props)

    const fileList = getFileList(props.workingDirectory.files)

    this.state = {
      files: fileList,
      visibleFileList: getOpenedFilesList(fileList),
    }
  }

  public componentWillReceiveProps(nextProps: IChangesListProps) {
    if (
      !arrayEquals(nextProps.selectedFileIDs, this.props.selectedFileIDs) ||
      nextProps.selectedSketchFileID !== this.props.selectedSketchFileID ||
      nextProps.selectedSketchPartID !== this.props.selectedSketchPartID
    ) {
      return
    }

    const fileList = getFileList(
      nextProps.workingDirectory.files,
      this.state.files
    )

    this.setState({
      files: fileList,
      visibleFileList: getOpenedFilesList(fileList),
    })
  }

  private onIncludeAllChanged = (event: React.FormEvent<HTMLInputElement>) => {
    const include = event.currentTarget.checked
    this.props.onSelectAll(include)
  }

  private renderRow = (row: number): JSX.Element => {
    const file = this.state.visibleFileList[row]

    if (file instanceof WorkingDirectoryFileChange) {
      const selection = file.selection.getSelectionType()

      const includeAll =
        selection === DiffSelectionType.All
          ? true
          : selection === DiffSelectionType.None ? false : null

      return (
        <ChangedFile
          path={file.path}
          status={file.status}
          parts={file.parts}
          oldPath={file.oldPath}
          include={includeAll}
          key={file.id}
          onIncludeChanged={this.props.onIncludeChanged}
          availableWidth={this.props.availableWidth}
          onContextMenu={this.onItemContextMenu}
        />
      )
    } else {
      return (
        <ChangedSketchPart
          name={file.name}
          parts={file.parts}
          id={file.id}
          key={file.id}
          opened={file.opened}
          availableWidth={this.props.availableWidth}
          onOpenChanged={this.onOpenChanged}
          conflicted={file.status === AppFileStatus.Conflicted}
        />
      )
    }
  }

  private get includeAllValue(): CheckboxValue {
    const includeAll = this.props.workingDirectory.includeAll
    if (includeAll === true) {
      return CheckboxValue.On
    } else if (includeAll === false) {
      return CheckboxValue.Off
    } else {
      return CheckboxValue.Mixed
    }
  }

  private onDiscardAllChanges = () => {
    this.props.onDiscardAllChanges(this.props.workingDirectory.files)
  }

  private onOpenChanged = (id: string, opened: boolean) => {
    const fileList = this.state.files.map(f => {
      if (f.id === id && !(f instanceof WorkingDirectoryFileChange)) {
        return {
          ...f,
          opened,
        }
      }
      return f
    })
    this.setState({
      files: fileList,
      visibleFileList: getOpenedFilesList(fileList),
    })
  }

  private onDiscardChanges = (paths: string | string[]) => {
    const workingDirectory = this.props.workingDirectory

    if (paths instanceof Array) {
      const files: WorkingDirectoryFileChange[] = []
      paths.forEach(path => {
        const file = workingDirectory.files.find(f => f.path === path)
        if (file) {
          files.push(file)
        }
      })
      if (files.length) {
        this.props.onDiscardAllChanges(files)
      }
    } else {
      const file = workingDirectory.files.find(f => f.path === paths)
      if (!file) {
        return
      }

      this.props.onDiscardChanges(file)
    }
  }

  private onContextMenu = (event: React.MouseEvent<any>) => {
    event.preventDefault()

    const items: IMenuItem[] = [
      {
        label: 'Discard All Changes…',
        action: this.onDiscardAllChanges,
        enabled: this.props.workingDirectory.files.length > 0,
      },
    ]

    showContextualMenu(items)
  }

  private onFileSelectionChanged = (rows: ReadonlyArray<number>) => {
    const file = this.state.visibleFileList[rows[0]]
    switch (file.type) {
      case FileType.SketchFile: {
        const sketchFile = this.props.sketchFiles.find(f => f.id === file.id)
        this.props.onSketchFileSelectionChanged(sketchFile!)
        return
      }
      case FileType.NormalFile: {
        this.props.onFileSelectionChanged(file)
        return
      }
      case FileType.LayerFile:
      case FileType.PageFile: {
        // @ts-ignore
        this.props.onSketchPartSelectionChanged(file)
        return
      }
    }
  }

  private onRowKeyDown = (row: number, e: React.KeyboardEvent<any>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const file = this.state.visibleFileList[row]
      if (file.type !== FileType.NormalFile) {
        const fileList = this.state.files.map(f => {
          if (f.id === file.id && !(f instanceof WorkingDirectoryFileChange)) {
            return {
              ...f,
              opened: e.key === 'ArrowRight',
            }
          }
          return f
        })
        this.setState({
          files: fileList,
          visibleFileList: getOpenedFilesList(fileList),
        })
      }
    }
  }

  private onItemContextMenu = (
    path: string,
    status: AppFileStatus,
    event: React.MouseEvent<any>
  ) => {
    event.preventDefault()

    const wd = this.props.workingDirectory
    const selectedFiles = new Array<WorkingDirectoryFileChange>()
    const paths = new Array<string>()
    const extensions = new Set<string>()

    this.props.selectedFileIDs.forEach(fileID => {
      const newFile = wd.findFileWithID(fileID)
      if (newFile) {
        selectedFiles.push(newFile)
        paths.push(newFile.path)

        const extension = Path.extname(newFile.path)
        if (extension.length) {
          extensions.add(extension)
        }
      }
    })

    const items: IMenuItem[] = [
      {
        label:
          paths.length === 1
            ? `Discard Changes…`
            : `Discard ${paths.length} Selected Changes…`,
        action: () => this.onDiscardChanges(paths),
      },
      {
        label: 'Discard All Changes…',
        action: () => this.onDiscardAllChanges(),
      },
      { type: 'separator' },
    ]

    if (paths.length === 1) {
      items.push({
        label: 'Ignore File',
        action: () => this.props.onIgnore(path),
        enabled: Path.basename(path) !== GitIgnoreFileName,
      })
    } else if (paths.length > 1) {
      items.push({
        label: `Ignore ${paths.length} selected files`,
        action: () => {
          // Filter out any .gitignores that happens to be selected, ignoring
          // those doesn't make sense.
          this.props.onIgnore(
            paths.filter(path => Path.basename(path) !== GitIgnoreFileName)
          )
        },
        // Enable this action as long as there's something selected which isn't
        // a .gitignore file.
        enabled: paths.some(path => Path.basename(path) !== GitIgnoreFileName),
      })
    }

    // Five menu items should be enough for everyone
    Array.from(extensions)
      .slice(0, 5)
      .forEach(extension => {
        items.push({
          label: `Ignore All ${extension} Files`,
          action: () => this.props.onIgnore(`*${extension}`),
        })
      })

    const revealInFileManagerLabel = 'Reveal in Finder'

    const openInExternalEditor = this.props.externalEditorLabel
      ? `Open in ${this.props.externalEditorLabel}`
      : 'Open in External Editor'

    items.push(
      { type: 'separator' },
      {
        label: revealInFileManagerLabel,
        action: () => this.props.onRevealInFileManager(path),
        enabled: status !== AppFileStatus.Deleted,
      },
      {
        label: openInExternalEditor,
        action: () => {
          const fullPath = Path.join(this.props.repository.path, path)
          this.props.onOpenInExternalEditor(fullPath)
        },
        enabled: status !== AppFileStatus.Deleted,
      },
      {
        label: 'Open with Default Program',
        action: () => this.props.onOpenItem(path),
        enabled: status !== AppFileStatus.Deleted,
      }
    )

    showContextualMenu(items)
  }

  public render() {
    const fileList = this.props.workingDirectory.files
    const { visibleFileList } = this.state
    const selectedRow = visibleFileList.findIndex(
      file =>
        this.props.selectedFileIDs.includes(file.id) ||
        file.id === this.props.selectedSketchFileID ||
        file.id === this.props.selectedSketchPartID
    )
    const fileCount = fileList.length
    const filesPlural = fileCount === 1 ? 'file' : 'files'
    const filesDescription = `${fileCount} changed ${filesPlural}`
    const anyFilesSelected =
      fileCount > 0 && this.includeAllValue !== CheckboxValue.Off

    return (
      <div className="changes-list-container file-list">
        <div className="header" onContextMenu={this.onContextMenu}>
          <Checkbox
            label={filesDescription}
            value={this.includeAllValue}
            onChange={this.onIncludeAllChanged}
            disabled={fileCount === 0}
          />
        </div>

        <List
          id="changes-list"
          rowCount={visibleFileList.length}
          rowHeight={RowHeight}
          rowRenderer={this.renderRow}
          selectedRows={[selectedRow]}
          onSelectionChanged={this.onFileSelectionChanged}
          invalidationProps={this.props.workingDirectory}
          onRowClick={this.props.onRowClick}
          loading={this.props.isLoadingStatus}
          onRowKeyDown={this.onRowKeyDown}
        />

        <CommitMessage
          onCreateCommit={this.props.onCreateCommit}
          branch={this.props.branch}
          gitHubUser={this.props.gitHubUser}
          commitAuthor={this.props.commitAuthor}
          anyFilesSelected={anyFilesSelected}
          repository={this.props.repository}
          dispatcher={this.props.dispatcher}
          commitMessage={this.props.commitMessage}
          contextualCommitMessage={this.props.contextualCommitMessage}
          autocompletionProviders={this.props.autocompletionProviders}
          isCommitting={this.props.isCommitting}
          showCoAuthoredBy={this.props.showCoAuthoredBy}
          coAuthors={this.props.coAuthors}
        />
      </div>
    )
  }
}
