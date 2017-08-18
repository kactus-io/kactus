import * as React from 'react'
import { CommitMessage } from './commit-message'
import { ChangedFile } from './changed-file'
import { ChangedSketchPart } from './changed-sketch-part'
import { List, ClickSource } from '../list'

import {
  WorkingDirectoryStatus,
  WorkingDirectoryFileChange,
  FileType,
  SketchFileType,
} from '../../models/status'
import { DiffSelectionType } from '../../models/diff'
import { CommitIdentity } from '../../models/commit-identity'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { ICommitMessage } from '../../lib/app-state'
import { IGitHubUser } from '../../lib/dispatcher'
import { IAutocompletionProvider } from '../autocompletion'
import { Dispatcher } from '../../lib/dispatcher'
import { Repository } from '../../models/repository'
import { showContextualMenu, IMenuItem } from '../main-process-proxy'

const RowHeight = 29

interface IChangesListProps {
  readonly repository: Repository
  readonly workingDirectory: WorkingDirectoryStatus
  readonly selectedFileID: string | null
  readonly onFileSelectionChanged: (file: WorkingDirectoryFileChange) => void
  readonly onIncludeChanged: (path: string, include: boolean) => void
  readonly onSelectAll: (selectAll: boolean) => void
  readonly onCreateCommit: (message: ICommitMessage) => Promise<boolean>
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
  readonly onIgnore: (pattern: string) => void

  readonly isLoadingStatus: boolean
}

type TFileInList =
  | WorkingDirectoryFileChange
  | {
      opened: boolean
      type: SketchFileType
      id: string
      parts: Array<string>
      name: string
    }

function getFileList(
  files: ReadonlyArray<WorkingDirectoryFileChange>,
  oldList?: Array<TFileInList>
) {
  const acc: Array<TFileInList> = []
  return files.reduce((prev, f, i) => {
    if (!f.parts || !f.sketchFile) {
      prev.push(f)
    } else {
      const previousFile = files[i - 1] || {}

      f.parts.forEach((part, i, arr) => {
        if (part === (previousFile.parts || [])[i]) {
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
            oldSketchPart && oldSketchPart.type !== FileType.NormalFile
              ? oldSketchPart.opened
              : i === 0,
          type:
            i === 0
              ? FileType.SketchFile
              : i === 1 ? FileType.PageFile : FileType.LayerFile,
          id,
          name: part,
          parts,
        })
      })

      prev.push(f)
    }
    return prev
  }, acc)
}

function getOpenedFilesList(files: Array<TFileInList>) {
  const res: Array<TFileInList> = []
  return files.reduce((prev, f, i, arr) => {
    if (!f.parts || !f.parts.length) {
      prev.push(f)
    } else {
      const id = f.parts.join('/')
      const parent = arr.find(a => a.id === id)
      if (parent && (parent.type === FileType.NormalFile || parent.opened)) {
        prev.push(f)
      }
    }
    return prev
  }, res)
}

export class ChangesList extends React.Component<
  IChangesListProps,
  { files: Array<TFileInList>; visibleFileList: Array<TFileInList> }
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
      nextProps.workingDirectory.files.length !==
      this.props.workingDirectory.files.length
    ) {
      const fileList = getFileList(
        nextProps.workingDirectory.files,
        this.state.files
      )

      this.setState({
        files: fileList,
        visibleFileList: getOpenedFilesList(fileList),
      })
    }
  }

  private onIncludeAllChanged = (event: React.FormEvent<HTMLInputElement>) => {
    const include = event.currentTarget.checked
    this.props.onSelectAll(include)
  }

  private renderRow = (row: number): JSX.Element => {
    const file = this.state.visibleFileList[row]

    if (file.type === FileType.NormalFile) {
      const selection = file.selection.getSelectionType()

      const includeAll =
        selection === DiffSelectionType.All
          ? true
          : selection === DiffSelectionType.None ? false : null

      return (
        <ChangedFile
          path={file.path}
          status={file.status}
          oldPath={file.oldPath}
          include={includeAll}
          key={file.id}
          onIncludeChanged={this.props.onIncludeChanged}
          onDiscardChanges={this.onDiscardChanges}
          onRevealInFileManager={this.props.onRevealInFileManager}
          onOpenItem={this.props.onOpenItem}
          availableWidth={this.props.availableWidth}
          onIgnore={this.props.onIgnore}
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
      if (f.id === id && f.type !== FileType.NormalFile) {
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

  private onDiscardChanges = (path: string) => {
    const workingDirectory = this.props.workingDirectory
    const file = workingDirectory.files.find(f => f.path === path)
    if (!file) {
      return
    }

    this.props.onDiscardChanges(file)
  }

  private onContextMenu = (event: React.MouseEvent<any>) => {
    event.preventDefault()

    const items: IMenuItem[] = [
      {
        label: __DARWIN__ ? 'Discard All Changes…' : 'Discard all changes…',
        action: this.onDiscardAllChanges,
        enabled: this.props.workingDirectory.files.length > 0,
      },
    ]

    showContextualMenu(items)
  }

  private onFileSelectionChanged = (row: number) => {
    const file = this.state.visibleFileList[row]
    if (file && file.type === FileType.NormalFile) {
      this.props.onFileSelectionChanged(file)
    }
  }

  public render() {
    const fileList = this.props.workingDirectory.files
    const { visibleFileList } = this.state
    const selectedRow = visibleFileList.findIndex(
      file => file.id === this.props.selectedFileID
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
          selectedRow={selectedRow}
          onSelectionChanged={this.onFileSelectionChanged}
          invalidationProps={this.props.workingDirectory}
          onRowClick={this.props.onRowClick}
          loading={this.props.isLoadingStatus}
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
        />
      </div>
    )
  }
}
