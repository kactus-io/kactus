import { spawnAndComplete } from './spawn'
import { getFilesWithConflictMarkers } from './diff-check'
import {
  WorkingDirectoryStatus,
  WorkingDirectoryFileChange,
  AppFileStatus,
  FileEntry,
  GitStatusEntry,
  AppFileStatusKind,
  UnmergedEntry,
  ConflictedFileStatus,
  UnmergedEntrySummary,
} from '../../models/status'
import {
  parsePorcelainStatus,
  mapStatus,
  IStatusEntry,
  IStatusHeader,
  isStatusHeader,
  isStatusEntry,
} from '../status-parser'
import { DiffSelectionType, DiffSelection } from '../../models/diff'
import { Repository } from '../../models/repository'
import { IAheadBehind } from '../../models/branch'
import { fatalError } from '../../lib/fatal-error'
import { IKactusFile } from '../../lib/kactus'
import { isMergeHeadSet } from './merge'
import { getBinaryPaths } from './diff'
import { getRebaseInternalState } from './rebase'
import { RebaseInternalState } from '../../models/rebase'
import { isCherryPickHeadFound } from './cherry-pick'

/**
 * V8 has a limit on the size of string it can create (~256MB), and unless we want to
 * trigger an unhandled exception we need to do the encoding conversion by hand.
 *
 * As we may be executing status often, we should keep this to a reasonable threshold.
 */
const MaxStatusBufferSize = 20e6 // 20MB in decimal

/** The encapsulation of the result from 'git status' */
export interface IStatusResult {
  /** The name of the current branch */
  readonly currentBranch?: string

  /** The name of the current upstream branch */
  readonly currentUpstreamBranch?: string

  /** The SHA of the tip commit of the current branch */
  readonly currentTip?: string

  /** How many commits ahead and behind
   *  the `currentBranch` is compared to the `currentUpstreamBranch`
   */
  readonly branchAheadBehind?: IAheadBehind

  /** true if the repository exists at the given location */
  readonly exists: boolean

  /** true if repository is in a conflicted state */
  readonly mergeHeadFound: boolean

  /** details about the rebase operation, if found */
  readonly rebaseInternalState: RebaseInternalState | null

  /** true if repository is in cherry pick state */
  readonly isCherryPickingHeadFound: boolean

  /** the absolute path to the repository's working directory */
  readonly workingDirectory: WorkingDirectoryStatus
}

interface IStatusHeadersData {
  currentBranch?: string
  currentUpstreamBranch?: string
  currentTip?: string
  branchAheadBehind?: IAheadBehind
  match: RegExpMatchArray | null
}

type ConflictFilesDetails = {
  conflictCountsByPath: ReadonlyMap<string, number>
  binaryFilePaths: ReadonlyArray<string>
}

function parseConflictedState(
  entry: UnmergedEntry,
  path: string,
  conflictDetails: ConflictFilesDetails
): ConflictedFileStatus {
  switch (entry.action) {
    case UnmergedEntrySummary.BothAdded: {
      const isBinary = conflictDetails.binaryFilePaths.includes(path)
      if (!isBinary) {
        return {
          kind: AppFileStatusKind.Conflicted,
          entry,
          conflictMarkerCount:
            conflictDetails.conflictCountsByPath.get(path) || 0,
        }
      } else {
        return { kind: AppFileStatusKind.Conflicted, entry }
      }
    }
    case UnmergedEntrySummary.BothModified: {
      const isBinary = conflictDetails.binaryFilePaths.includes(path)
      if (!isBinary) {
        return {
          kind: AppFileStatusKind.Conflicted,
          entry,
          conflictMarkerCount:
            conflictDetails.conflictCountsByPath.get(path) || 0,
        }
      } else {
        return {
          kind: AppFileStatusKind.Conflicted,
          entry,
        }
      }
    }
    default:
      return {
        kind: AppFileStatusKind.Conflicted,
        entry,
      }
  }
}

function convertToAppStatus(
  path: string,
  entry: FileEntry,
  conflictDetails: ConflictFilesDetails,
  oldPath?: string
): AppFileStatus {
  if (entry.kind === 'ordinary') {
    switch (entry.type) {
      case 'added':
        return { kind: AppFileStatusKind.New }
      case 'modified':
        return { kind: AppFileStatusKind.Modified }
      case 'deleted':
        return { kind: AppFileStatusKind.Deleted }
    }
  } else if (entry.kind === 'copied' && oldPath != null) {
    return { kind: AppFileStatusKind.Copied, oldPath }
  } else if (entry.kind === 'renamed' && oldPath != null) {
    return { kind: AppFileStatusKind.Renamed, oldPath }
  } else if (entry.kind === 'untracked') {
    return { kind: AppFileStatusKind.Untracked }
  } else if (entry.kind === 'conflicted') {
    return parseConflictedState(entry, path, conflictDetails)
  }

  return fatalError(`Unknown file status ${status}`)
}

// List of known conflicted index entries for a file, extracted from mapStatus
// inside `app/src/lib/status-parser.ts` for convenience
const conflictStatusCodes = ['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU']

/**
 *  Retrieve the status for a given repository,
 *  and fail gracefully if the location is not a Git repository
 */
export async function getStatus(
  repository: Repository,
  sketchFiles: ReadonlyArray<IKactusFile>
): Promise<IStatusResult | null> {
  const args = [
    '--no-optional-locks',
    'status',
    '--untracked-files=normal',
    '--branch',
    '--porcelain=2',
    '-z',
  ]

  const result = await spawnAndComplete(
    args,
    repository.path,
    'getStatus',
    new Set([0, 128])
  )

  if (result.exitCode === 128) {
    log.debug(
      `'git status' returned 128 for '${repository.path}' and is likely missing its .git directory`
    )
    return null
  }

  if (result.output.length > MaxStatusBufferSize) {
    log.error(
      `'git status' emitted ${result.output.length} bytes, which is beyond the supported threshold of ${MaxStatusBufferSize} bytes`
    )
    return null
  }

  const stdout = result.output.toString('utf8')
  const parsed = parsePorcelainStatus(stdout)
  const headers = parsed.filter(isStatusHeader)
  const entries = parsed.filter(isStatusEntry)

  const mergeHeadFound = await isMergeHeadSet(repository)
  const conflictedFilesInIndex = entries.some(
    e => conflictStatusCodes.indexOf(e.statusCode) > -1
  )
  const rebaseInternalState = await getRebaseInternalState(repository)

  const conflictDetails = await getConflictDetails(
    repository,
    mergeHeadFound,
    conflictedFilesInIndex,
    rebaseInternalState
  )

  // Map of files keyed on their paths.
  const files = entries.reduce(
    (files, entry) =>
      buildStatusMap(files, entry, conflictDetails, sketchFiles),
    new Map<string, WorkingDirectoryFileChange>()
  )

  const {
    currentBranch,
    currentUpstreamBranch,
    currentTip,
    branchAheadBehind,
  } = headers.reduce(parseStatusHeader, {
    currentBranch: undefined,
    currentUpstreamBranch: undefined,
    currentTip: undefined,
    branchAheadBehind: undefined,
    match: null,
  })

  const workingDirectory = WorkingDirectoryStatus.fromFiles([...files.values()])

  const isCherryPickingHeadFound = await isCherryPickHeadFound(repository)

  return {
    currentBranch,
    currentTip,
    currentUpstreamBranch,
    branchAheadBehind,
    exists: true,
    mergeHeadFound,
    rebaseInternalState,
    workingDirectory,
    isCherryPickingHeadFound,
  }
}

/**
 *
 * Update map of working directory changes with a file status entry.
 * Reducer(ish).
 *
 * (Map is used here to maintain insertion order.)
 */
function buildStatusMap(
  files: Map<string, WorkingDirectoryFileChange>,
  entry: IStatusEntry,
  conflictDetails: ConflictFilesDetails,
  sketchFiles: ReadonlyArray<IKactusFile>
): Map<string, WorkingDirectoryFileChange> {
  const status = mapStatus(entry.statusCode)

  if (status.kind === 'ordinary') {
    // when a file is added in the index but then removed in the working
    // directory, the file won't be part of the commit, so we can skip
    // displaying this entry in the changes list
    if (
      status.index === GitStatusEntry.Added &&
      status.workingTree === GitStatusEntry.Deleted
    ) {
      return files
    }
  }

  if (status.kind === 'untracked') {
    // when a delete has been staged, but an untracked file exists with the
    // same path, we should ensure that we only draw one entry in the
    // changes list - see if an entry already exists for this path and
    // remove it if found
    files.delete(entry.path)
  }

  // for now we just poke at the existing summary
  const appStatus = convertToAppStatus(
    entry.path,
    status,
    conflictDetails,
    entry.oldPath
  )

  const selection = DiffSelection.fromInitialSelection(DiffSelectionType.All)

  const sketchFile = sketchFiles.find(f => entry.path.indexOf(`${f.id}/`) === 0)

  files.set(
    entry.path,
    new WorkingDirectoryFileChange(entry.path, appStatus, selection, sketchFile)
  )
  return files
}

/**
 * Update status header based on the current header entry.
 * Reducer.
 */
function parseStatusHeader(results: IStatusHeadersData, header: IStatusHeader) {
  let {
    currentBranch,
    currentUpstreamBranch,
    currentTip,
    branchAheadBehind,
    match,
  } = results
  const value = header.value

  // This intentionally does not match branch.oid initial
  if ((match = value.match(/^branch\.oid ([a-f0-9]+)$/))) {
    currentTip = match[1]
  } else if ((match = value.match(/^branch.head (.*)/))) {
    if (match[1] !== '(detached)') {
      currentBranch = match[1]
    }
  } else if ((match = value.match(/^branch.upstream (.*)/))) {
    currentUpstreamBranch = match[1]
  } else if ((match = value.match(/^branch.ab \+(\d+) -(\d+)$/))) {
    const ahead = parseInt(match[1], 10)
    const behind = parseInt(match[2], 10)

    if (!isNaN(ahead) && !isNaN(behind)) {
      branchAheadBehind = { ahead, behind }
    }
  }
  return {
    currentBranch,
    currentUpstreamBranch,
    currentTip,
    branchAheadBehind,
    match,
  }
}

async function getMergeConflictDetails(repository: Repository) {
  const conflictCountsByPath = await getFilesWithConflictMarkers(
    repository.path
  )
  const binaryFilePaths = await getBinaryPaths(repository, 'MERGE_HEAD')
  return {
    conflictCountsByPath,
    binaryFilePaths,
  }
}

async function getRebaseConflictDetails(repository: Repository) {
  const conflictCountsByPath = await getFilesWithConflictMarkers(
    repository.path
  )
  const binaryFilePaths = await getBinaryPaths(repository, 'REBASE_HEAD')
  return {
    conflictCountsByPath,
    binaryFilePaths,
  }
}

/**
 * We need to do these operations to detect conflicts that were the result
 * of popping a stash into the index
 */
async function getWorkingDirectoryConflictDetails(repository: Repository) {
  const conflictCountsByPath = await getFilesWithConflictMarkers(
    repository.path
  )
  let binaryFilePaths: ReadonlyArray<string> = []
  try {
    // its totally fine if HEAD doesn't exist, which throws an error
    binaryFilePaths = await getBinaryPaths(repository, 'HEAD')
  } catch (error) {}

  return {
    conflictCountsByPath,
    binaryFilePaths,
  }
}

/**
 * gets the conflicted files count and binary file paths in a given repository.
 * for computing an `IStatusResult`.
 *
 * @param repository to get details from
 * @param mergeHeadFound whether a merge conflict has been detected
 * @param lookForStashConflicts whether it looks like a stash has introduced conflicts
 * @param rebaseInternalState details about the current rebase operation (if found)
 */
async function getConflictDetails(
  repository: Repository,
  mergeHeadFound: boolean,
  lookForStashConflicts: boolean,
  rebaseInternalState: RebaseInternalState | null
): Promise<ConflictFilesDetails> {
  try {
    if (mergeHeadFound) {
      return await getMergeConflictDetails(repository)
    }

    if (rebaseInternalState !== null) {
      return await getRebaseConflictDetails(repository)
    }

    if (lookForStashConflicts) {
      return await getWorkingDirectoryConflictDetails(repository)
    }
  } catch (error) {
    log.error(
      'Unexpected error from git operations in getConflictDetails',
      error
    )
  }
  return {
    conflictCountsByPath: new Map<string, number>(),
    binaryFilePaths: new Array<string>(),
  }
}
