import * as React from 'react'
import * as Path from 'path'

import { Dispatcher } from '../dispatcher'
import { IMenuItem } from '../../lib/menu-item'
import { revealInFileManager } from '../../lib/app-shell'
import {
  AppFileStatus,
  WorkingDirectoryStatus,
  WorkingDirectoryFileChange,
  FileType,
  SketchFileType,
  TSketchPartChange,
  AppFileStatusKind,
} from '../../models/status'
import { DiffSelectionType } from '../../models/diff'
import { CommitIdentity } from '../../models/commit-identity'
import { ICommitMessage } from '../../models/commit-message'
import { Repository } from '../../models/repository'
import { IAuthor } from '../../models/author'
import { List, ClickSource } from '../lib/list'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import {
  DefaultEditorLabel,
  CopyFilePathLabel,
  RevealInFileManagerLabel,
  OpenWithDefaultProgramLabel,
} from '../lib/context-menu'
import { CommitMessage } from './commit-message'
import { ChangedFile } from './changed-file'
import { ChangedSketchPart } from './changed-sketch-part'
import { IKactusFile } from '../../lib/kactus'
import { IAutocompletionProvider } from '../autocompletion'
import { showContextualMenu } from '../main-process-proxy'
import { arrayEquals } from '../../lib/equality'
import { clipboard } from 'electron'
import { basename } from 'path'
import { ICommitContext } from '../../models/commit'
import { RebaseConflictState, ConflictState } from '../../lib/app-state'
import { ContinueRebase } from './continue-rebase'
import { Octicon, OcticonSymbol } from '../octicons'
import { IStashEntry } from '../../models/stash-entry'
import classNames from 'classnames'
import { hasWritePermission } from '../../models/github-repository'
import { hasConflictedFiles } from '../../lib/status'

const RowHeight = 29

const StashIcon = new OcticonSymbol(
  16,
  16,
  'M10.5 1.286h-9a.214.214 0 0 0-.214.214v9a.214.214 0 0 0 .214.214h9a.214.214 0 0 0 ' +
    '.214-.214v-9a.214.214 0 0 0-.214-.214zM1.5 0h9A1.5 1.5 0 0 1 12 1.5v9a1.5 1.5 0 0 1-1.5 ' +
    '1.5h-9A1.5 1.5 0 0 1 0 10.5v-9A1.5 1.5 0 0 1 1.5 0zm5.712 7.212a1.714 1.714 0 1 ' +
    '1-2.424-2.424 1.714 1.714 0 0 1 2.424 2.424zM2.015 12.71c.102.729.728 1.29 1.485 ' +
    '1.29h9a1.5 1.5 0 0 0 1.5-1.5v-9a1.5 1.5 0 0 0-1.29-1.485v1.442a.216.216 0 0 1 ' +
    '.004.043v9a.214.214 0 0 1-.214.214h-9a.216.216 0 0 1-.043-.004H2.015zm2 2c.102.729.728 ' +
    '1.29 1.485 1.29h9a1.5 1.5 0 0 0 1.5-1.5v-9a1.5 1.5 0 0 0-1.29-1.485v1.442a.216.216 0 0 1 ' +
    '.004.043v9a.214.214 0 0 1-.214.214h-9a.216.216 0 0 1-.043-.004H4.015z',
  'evenodd'
)

const GitIgnoreFileName = '.gitignore'

type TFakeSketchPartChange = {
  opened: boolean
  shown: boolean
  index: number
  type: SketchFileType
  id: string
  parts: Array<string>
  name: string
  status?: AppFileStatus
  fakePart: true
}

type TFileOrSketchPartChange =
  | (WorkingDirectoryFileChange & { index: number; shown: boolean })
  | TFakeSketchPartChange

/** Compute the 'Include All' checkbox value from the repository state */
function getIncludeAllValue(
  workingDirectory: WorkingDirectoryStatus,
  rebaseConflictState: RebaseConflictState | null
) {
  if (rebaseConflictState !== null) {
    if (workingDirectory.files.length === 0) {
      // the current commit will be skipped in the rebase
      return CheckboxValue.Off
    }

    // untracked files will be skipped by the rebase, so we need to ensure that
    // the "Include All" checkbox matches this state
    const onlyUntrackedFilesFound = workingDirectory.files.every(
      f => f.status.kind === AppFileStatusKind.Untracked
    )

    if (onlyUntrackedFilesFound) {
      return CheckboxValue.Off
    }

    const onlyTrackedFilesFound = workingDirectory.files.every(
      f => f.status.kind !== AppFileStatusKind.Untracked
    )

    // show "Mixed" if we have a mixture of tracked and untracked changes
    return onlyTrackedFilesFound ? CheckboxValue.On : CheckboxValue.Mixed
  }

  const { includeAll } = workingDirectory
  if (includeAll === true) {
    return CheckboxValue.On
  } else if (includeAll === false) {
    return CheckboxValue.Off
  } else {
    return CheckboxValue.Mixed
  }
}

interface IChangesListProps {
  readonly repository: Repository
  readonly workingDirectory: WorkingDirectoryStatus
  /**
   * An object containing the conflicts in the working directory.
   * When null it means that there are no conflicts.
   */
  readonly conflictState: ConflictState | null
  readonly rebaseConflictState: RebaseConflictState | null
  readonly selectedFileIDs: ReadonlyArray<string>
  readonly selectedSketchFileID: string | null
  readonly selectedSketchPartID: string | null
  readonly sketchFiles: ReadonlyArray<IKactusFile>
  readonly onFileSelectionChanged: (file: WorkingDirectoryFileChange) => void
  readonly onSketchPartSelectionChanged: (file: TSketchPartChange) => void
  readonly onSketchFileSelectionChanged: (file: IKactusFile) => void
  readonly onIncludeChanged: (path: string, include: boolean) => void
  readonly onSelectAll: (selectAll: boolean) => void
  readonly onCreateCommit: (context: ICommitContext) => Promise<boolean>
  readonly onDiscardChanges: (file: WorkingDirectoryFileChange) => void
  readonly askForConfirmationOnDiscardChanges: boolean
  readonly focusCommitMessage: boolean
  readonly onDiscardChangesFromFiles: (
    files: ReadonlyArray<WorkingDirectoryFileChange>,
    isDiscardingAllChanges: boolean
  ) => void

  /** Callback that fires on page scroll to pass the new scrollTop location */
  readonly onChangesListScrolled: (scrollTop: number) => void

  /* The scrollTop of the compareList. It is stored to allow for scroll position persistence */
  readonly changesListScrollTop?: number

  /**
   * Called to open a file it its default application
   *
   * @param path The path of the file relative to the root of the repository
   */
  readonly onOpenItem: (path: string) => void
  /**
   * The currently checked out branch (null if no branch is checked out).
   */
  readonly branch: string | null
  readonly commitAuthor: CommitIdentity | null
  readonly dispatcher: Dispatcher
  readonly availableWidth: number
  readonly isCommitting: boolean
  readonly currentBranchProtected: boolean

  /**
   * Click event handler passed directly to the onRowClick prop of List, see
   * List Props for documentation.
   */
  readonly onRowClick?: (row: number, source: ClickSource) => void
  readonly commitMessage: ICommitMessage

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

  readonly stashEntry: IStashEntry | null

  readonly isShowingStashEntry: boolean

  /**
   * Whether we should show the onboarding tutorial nudge
   * arrow pointing at the commit summary box
   */
  readonly shouldNudgeToCommit: boolean
}

function getFileList(
  files: ReadonlyArray<WorkingDirectoryFileChange>,
  oldList?: { [id: string]: TFileOrSketchPartChange }
) {
  const acc: { [id: string]: TFileOrSketchPartChange } = {}
  const fakePartsAcc: { [id: string]: TFakeSketchPartChange } = {}
  let parentPartChange: TFakeSketchPartChange | undefined = undefined
  let index = 0
  return files.reduce((prev, f, i) => {
    if (f.parts && f.sketchFile) {
      if (f.parts.length === 1 && `${f.parts[0]}/` === f.path) {
        // if we add a new sketch file
        f.shown = true
        f.index = index
        prev[f.id] = f
        index += 1
        return prev
      }

      const previousFile = files[i - 1] || {}

      const conflicted = f.status.kind === AppFileStatusKind.Conflicted

      f.parts.forEach((part, i, arr) => {
        if (i <= 1) {
          parentPartChange = undefined
        }
        const parts = arr.slice(0, i)
        const parentId = parts.join('/')
        const id = parentId ? parentId + '/' + part : part
        if (part === (previousFile.parts || [])[i]) {
          if (conflicted) {
            const correspondingPart = prev[id]
            if (
              correspondingPart &&
              !correspondingPart.status &&
              correspondingPart.fakePart
            ) {
              correspondingPart.status = f.status
            }
          }
          return
        }

        const oldSketchPart = oldList && oldList[id]

        const opened =
          oldSketchPart && oldSketchPart.fakePart
            ? oldSketchPart.opened
            : i === 0

        if (!parentPartChange || (i > 1 && parentPartChange.id !== parentId)) {
          parentPartChange = fakePartsAcc[parentId]
        }

        const partChange: TFakeSketchPartChange = {
          opened,
          shown:
            opened || !parentPartChange || parentPartChange.opened || false,
          type:
            i === 0
              ? FileType.SketchFile
              : i === 1
              ? FileType.PageFile
              : FileType.LayerFile,
          id,
          name: part,
          parts,
          status: conflicted ? f.status : undefined,
          index,
          fakePart: true,
        }
        prev[id] = partChange
        fakePartsAcc[id] = partChange
        parentPartChange = partChange
        index += 1
      })
      const parentId = f.parts.join('/')
      if (
        !parentPartChange ||
        (f.parts.length > 1 && parentPartChange.id !== parentId)
      ) {
        parentPartChange = fakePartsAcc[parentId]
      } else if (f.parts.length <= 1) {
        parentPartChange = undefined
      }
      f.shown =
        (parentPartChange && parentPartChange.opened) ||
        f.parts.length === 0 ||
        false
    } else {
      f.shown = true
    }
    f.index = index
    prev[f.id] = f
    index += 1
    return prev
  }, acc)
}

function getOpenedFilesList(files: { [id: string]: TFileOrSketchPartChange }) {
  const shownFiles = Object.values(files).filter(f => f.shown)
  shownFiles.sort((a, b) => (a.index > b.index ? 1 : -1))
  return shownFiles
}

interface IChangesState {
  readonly files: { [id: string]: TFileOrSketchPartChange }
  readonly visibleFileList: ReadonlyArray<TFileOrSketchPartChange>
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
    const {
      rebaseConflictState,
      isCommitting,
      onIncludeChanged,
      availableWidth,
    } = this.props

    const file = this.state.visibleFileList[row]

    if (file instanceof WorkingDirectoryFileChange) {
      const selection = file.selection.getSelectionType()

      const includeAll =
        selection === DiffSelectionType.All
          ? true
          : selection === DiffSelectionType.None
          ? false
          : null

      const include =
        rebaseConflictState !== null
          ? file.status.kind !== AppFileStatusKind.Untracked
          : includeAll

      const disableSelection = isCommitting || rebaseConflictState !== null

      return (
        <ChangedFile
          file={file}
          include={include}
          key={file.id}
          onContextMenu={this.onItemContextMenu}
          onIncludeChanged={onIncludeChanged}
          availableWidth={availableWidth}
          disableSelection={disableSelection}
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
          status={file.status}
        />
      )
    }
  }

  private onOpenChanged = (id: string, opened: boolean) => {
    const files = this.state.files
    if (!files[id].fakePart) {
      return
    }
    files[id].opened = opened
    const newFiles = getFileList(this.props.workingDirectory.files, files)
    this.setState({
      files: newFiles,
      visibleFileList: getOpenedFilesList(newFiles),
    })
  }

  private onDiscardAllChanges = () => {
    this.props.onDiscardChangesFromFiles(
      this.props.workingDirectory.files,
      true
    )
  }

  private onStashChanges = () => {
    this.props.dispatcher.createStashForCurrentBranch(this.props.repository)
  }

  private onDiscardChanges = (files: ReadonlyArray<string>) => {
    const workingDirectory = this.props.workingDirectory

    if (files.length === 1) {
      const modifiedFile = workingDirectory.files.find(f => f.path === files[0])

      if (modifiedFile != null) {
        this.props.onDiscardChanges(modifiedFile)
      }
    } else {
      const modifiedFiles = new Array<WorkingDirectoryFileChange>()

      files.forEach(file => {
        const modifiedFile = workingDirectory.files.find(f => f.path === file)

        if (modifiedFile != null) {
          modifiedFiles.push(modifiedFile)
        }
      })

      if (modifiedFiles.length > 0) {
        // DiscardAllChanges can also be used for discarding several selected changes.
        // Therefore, we update the pop up to reflect whether or not it is "all" changes.
        const discardingAllChanges =
          modifiedFiles.length === workingDirectory.files.length

        this.props.onDiscardChangesFromFiles(
          modifiedFiles,
          discardingAllChanges
        )
      }
    }
  }

  private getDiscardChangesMenuItemLabel = (files: ReadonlyArray<string>) => {
    const label =
      files.length === 1
        ? `Discard Changes`
        : `Discard ${files.length} Selected Changes`

    return this.props.askForConfirmationOnDiscardChanges ? `${label}…` : label
  }

  private onContextMenu = (event: React.MouseEvent<any>) => {
    event.preventDefault()

    // need to preserve the working directory state while dealing with conflicts
    if (this.props.rebaseConflictState !== null || this.props.isCommitting) {
      return
    }

    const hasLocalChanges = this.props.workingDirectory.files.length > 0
    const hasStash = this.props.stashEntry !== null
    const hasConflicts =
      this.props.conflictState !== null ||
      hasConflictedFiles(this.props.workingDirectory)

    const stashAllChangesLabel = 'Stash All Changes'
    const confirmStashAllChangesLabel = 'Stash All Changes…'

    const items: IMenuItem[] = [
      {
        label: 'Discard All Changes…',
        action: this.onDiscardAllChanges,
        enabled: hasLocalChanges,
      },
      {
        label: hasStash ? confirmStashAllChangesLabel : stashAllChangesLabel,
        action: this.onStashChanges,
        enabled: hasLocalChanges && this.props.branch !== null && !hasConflicts,
      },
    ]

    showContextualMenu(items)
  }

  private getDiscardChangesMenuItem = (
    paths: ReadonlyArray<string>
  ): IMenuItem => {
    return {
      label: this.getDiscardChangesMenuItemLabel(paths),
      action: () => this.onDiscardChanges(paths),
    }
  }

  private getCopyPathMenuItem = (
    file: WorkingDirectoryFileChange
  ): IMenuItem => {
    return {
      label: CopyFilePathLabel,
      action: () => {
        const fullPath = Path.join(this.props.repository.path, file.path)
        clipboard.writeText(fullPath)
      },
    }
  }

  private getRevealInFileManagerMenuItem = (
    file: WorkingDirectoryFileChange
  ): IMenuItem => {
    return {
      label: RevealInFileManagerLabel,
      action: () => revealInFileManager(this.props.repository, file.path),
      enabled: file.status.kind !== AppFileStatusKind.Deleted,
    }
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
        this.props.onSketchPartSelectionChanged(file as TSketchPartChange)
        return
      }
    }
  }

  private getOpenInExternalEditorMenuItem = (
    file: WorkingDirectoryFileChange,
    enabled: boolean
  ): IMenuItem => {
    const { externalEditorLabel, repository } = this.props

    const openInExternalEditor = externalEditorLabel
      ? `Open in ${externalEditorLabel}`
      : DefaultEditorLabel

    return {
      label: openInExternalEditor,
      action: () => {
        const fullPath = Path.join(repository.path, file.path)
        this.props.onOpenInExternalEditor(fullPath)
      },
      enabled,
    }
  }

  private getDefaultContextMenu(
    file: WorkingDirectoryFileChange
  ): ReadonlyArray<IMenuItem> {
    const { id, path, status } = file

    const { workingDirectory, selectedFileIDs } = this.props

    const selectedFiles = new Array<WorkingDirectoryFileChange>()
    const paths = new Array<string>()
    const extensions = new Set<string>()

    const addItemToArray = (fileID: string) => {
      const newFile = workingDirectory.findFileWithID(fileID)
      if (newFile) {
        selectedFiles.push(newFile)
        paths.push(newFile.path)

        const extension = Path.extname(newFile.path)
        if (extension.length) {
          extensions.add(extension)
        }
      }
    }

    if (selectedFileIDs.includes(id)) {
      // user has selected a file inside an existing selection
      // -> context menu entries should be applied to all selected files
      selectedFileIDs.forEach(addItemToArray)
    } else {
      // this is outside their previous selection
      // -> context menu entries should be applied to just this file
      addItemToArray(id)
    }

    const items: IMenuItem[] = [
      this.getDiscardChangesMenuItem(paths),
      { type: 'separator' },
    ]
    if (paths.length === 1) {
      items.push({
        label: 'Ignore File (Add to .gitignore)',
        action: () => this.props.onIgnore(path),
        enabled: Path.basename(path) !== GitIgnoreFileName,
      })
    } else if (paths.length > 1) {
      items.push({
        label: `Ignore ${paths.length} Selected Files (Add to .gitignore)`,
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
          label: `Ignore All ${extension} Files (Add to .gitignore)`,
          action: () => this.props.onIgnore(`*${extension}`),
        })
      })

    const enabled = status.kind !== AppFileStatusKind.Deleted

    items.push(
      { type: 'separator' },
      this.getCopyPathMenuItem(file),
      this.getRevealInFileManagerMenuItem(file),
      this.getOpenInExternalEditorMenuItem(file, enabled),
      {
        label: OpenWithDefaultProgramLabel,
        action: () => this.props.onOpenItem(path),
        enabled,
      }
    )

    return items
  }

  private getRebaseContextMenu(
    file: WorkingDirectoryFileChange
  ): ReadonlyArray<IMenuItem> {
    const { path, status } = file

    const items = new Array<IMenuItem>()

    if (file.status.kind === AppFileStatusKind.Untracked) {
      items.push(this.getDiscardChangesMenuItem([file.path]), {
        type: 'separator',
      })
    }

    const enabled = status.kind !== AppFileStatusKind.Deleted

    items.push(
      this.getCopyPathMenuItem(file),
      this.getRevealInFileManagerMenuItem(file),
      this.getOpenInExternalEditorMenuItem(file, enabled),
      {
        label: OpenWithDefaultProgramLabel,
        action: () => this.props.onOpenItem(path),
        enabled,
      }
    )

    return items
  }

  private onRowKeyDown = (
    row: number,
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    // The commit is already in-flight but this check prevents the
    // user from changing selection.
    if (
      this.props.isCommitting &&
      (event.key === 'Enter' ||
        event.key === ' ' ||
        event.key === 'ArrowRight' ||
        event.key === 'ArrowLeft')
    ) {
      event.preventDefault()
      return
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const file = this.state.visibleFileList[row]
      if (file.type !== FileType.NormalFile) {
        return this.onOpenChanged(file.id, event.key === 'ArrowRight')
      }
    }
  }

  private onItemContextMenu = (
    file: WorkingDirectoryFileChange,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (this.props.isCommitting) {
      return
    }

    event.preventDefault()

    const items =
      this.props.rebaseConflictState === null
        ? this.getDefaultContextMenu(file)
        : this.getRebaseContextMenu(file)

    showContextualMenu(items)
  }

  private getPlaceholderMessage(
    files: ReadonlyArray<WorkingDirectoryFileChange>,
    prepopulateCommitSummary: boolean
  ) {
    if (!prepopulateCommitSummary) {
      return 'Summary (required)'
    }

    const firstFile = files[0]
    const fileName = basename(firstFile.path)

    switch (firstFile.status.kind) {
      case AppFileStatusKind.New:
      case AppFileStatusKind.Untracked:
        return `Create ${fileName}`
      case AppFileStatusKind.Deleted:
        return `Delete ${fileName}`
      default:
        // TODO:
        // this doesn't feel like a great message for AppFileStatus.Copied or
        // AppFileStatus.Renamed but without more insight (and whether this
        // affects other parts of the flow) we can just default to this for now
        return `Update ${fileName}`
    }
  }

  private onScroll = (scrollTop: number, clientHeight: number) => {
    this.props.onChangesListScrolled(scrollTop)
  }

  private renderCommitMessageForm = (): JSX.Element => {
    const {
      rebaseConflictState,
      workingDirectory,
      repository,
      dispatcher,
      isCommitting,
      currentBranchProtected,
    } = this.props

    if (rebaseConflictState !== null) {
      const hasUntrackedChanges = workingDirectory.files.some(
        f => f.status.kind === AppFileStatusKind.Untracked
      )

      return (
        <ContinueRebase
          dispatcher={dispatcher}
          repository={repository}
          rebaseConflictState={rebaseConflictState}
          workingDirectory={workingDirectory}
          isCommitting={isCommitting}
          hasUntrackedChanges={hasUntrackedChanges}
        />
      )
    }

    const fileCount = workingDirectory.files.length

    const includeAllValue = getIncludeAllValue(
      workingDirectory,
      rebaseConflictState
    )

    const anyFilesSelected =
      fileCount > 0 && includeAllValue !== CheckboxValue.Off

    const filesSelected = workingDirectory.files.filter(
      f => f.selection.getSelectionType() !== DiffSelectionType.None
    )

    // When a single file is selected, we use a default commit summary
    // based on the file name and change status.
    // However, for onboarding tutorial repositories, we don't want to do this.
    // See https://github.com/desktop/desktop/issues/8354
    const prepopulateCommitSummary =
      filesSelected.length === 1 && !repository.isTutorialRepository

    // if this is not a github repo, we don't want to
    // restrict what the user can do at all
    const hasWritePermissionForRepository =
      this.props.repository.gitHubRepository === null ||
      hasWritePermission(this.props.repository.gitHubRepository)

    return (
      <CommitMessage
        onCreateCommit={this.props.onCreateCommit}
        branch={this.props.branch}
        commitAuthor={this.props.commitAuthor}
        anyFilesSelected={anyFilesSelected}
        repository={repository}
        dispatcher={dispatcher}
        commitMessage={this.props.commitMessage}
        focusCommitMessage={this.props.focusCommitMessage}
        autocompletionProviders={this.props.autocompletionProviders}
        isCommitting={isCommitting}
        showCoAuthoredBy={this.props.showCoAuthoredBy}
        coAuthors={this.props.coAuthors}
        placeholder={this.getPlaceholderMessage(
          filesSelected,
          prepopulateCommitSummary
        )}
        prepopulateCommitSummary={prepopulateCommitSummary}
        key={repository.id}
        showBranchProtected={fileCount > 0 && currentBranchProtected}
        showNoWriteAccess={fileCount > 0 && !hasWritePermissionForRepository}
        shouldNudge={this.props.shouldNudgeToCommit}
      />
    )
  }

  private onStashEntryClicked = () => {
    const { isShowingStashEntry, dispatcher, repository } = this.props

    if (isShowingStashEntry) {
      dispatcher.selectWorkingDirectoryFiles(repository)
    } else {
      dispatcher.selectStashedFile(repository)
    }
  }

  private renderStashedChanges() {
    if (this.props.stashEntry === null) {
      return null
    }

    const className = classNames(
      'stashed-changes-button',
      this.props.isShowingStashEntry ? 'selected' : null
    )

    return (
      <button
        className={className}
        onClick={this.onStashEntryClicked}
        tabIndex={0}
        aria-selected={this.props.isShowingStashEntry}
      >
        <Octicon className="stack-icon" symbol={StashIcon} />
        <div className="text">Stashed Changes</div>
        <Octicon symbol={OcticonSymbol.chevronRight} />
      </button>
    )
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

    const selectedChangeCount = this.props.workingDirectory.files.filter(
      file => file.selection.getSelectionType() !== DiffSelectionType.None
    ).length
    const selectedFilesPlural = selectedChangeCount === 1 ? 'file' : 'files'
    const selectedChangesDescription = `${selectedChangeCount} changed ${selectedFilesPlural} selected`

    const includeAllValue = getIncludeAllValue(
      this.props.workingDirectory,
      this.props.rebaseConflictState
    )

    const disableAllCheckbox =
      fileCount === 0 ||
      this.props.isCommitting ||
      this.props.rebaseConflictState !== null

    return (
      <div className="changes-list-container file-list">
        <div
          className="header"
          onContextMenu={this.onContextMenu}
          title={selectedChangesDescription}
        >
          <Checkbox
            label={filesDescription}
            value={includeAllValue}
            onChange={this.onIncludeAllChanged}
            disabled={disableAllCheckbox}
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
          onScroll={this.onScroll}
          setScrollTop={this.props.changesListScrollTop}
        />
        {this.renderStashedChanges()}
        {this.renderCommitMessageForm()}
      </div>
    )
  }
}
