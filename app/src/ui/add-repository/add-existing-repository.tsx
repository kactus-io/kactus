import { remote } from 'electron'
import * as Path from 'path'
import * as React from 'react'

import { Dispatcher } from '../../lib/dispatcher'
import { isGitRepository } from '../../lib/git'
import { isBareRepository } from '../../lib/git'
import { Button } from '../lib/button'
import { ButtonGroup } from '../lib/button-group'
import { TextBox } from '../lib/text-box'
import { Row } from '../lib/row'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Octicon, OcticonSymbol } from '../octicons'
import { LinkButton } from '../lib/link-button'
import { PopupType } from '../../lib/app-state'
import { Checkbox, CheckboxValue } from '../lib/checkbox'

import untildify = require('untildify')

interface IAddExistingRepositoryProps {
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void

  /** An optional path to prefill the path text box with.
   * Defaults to the empty string if not defined.
   */
  readonly path?: string
}

interface IAddExistingRepositoryState {
  readonly path: string

  /**
   * Indicates whether or not the path provided in the path state field exists and
   * is a valid Git repository. This value is immediately switched
   * to false when the path changes and updated (if necessary) by the
   * function, checkIfPathIsRepository.
   *
   * If set to false the user will be prevented from submitting this dialog
   * and given the option to create a new repository instead.
   */
  readonly isRepository: boolean

  /**
   * Indicates whether or not to render a warning message about the entered path
   * not containing a valid Git repository. This value differs from `isGitRepository` in that it holds
   * its value when the path changes until we've gotten a definitive answer from the asynchronous
   * method that the path is, or isn't, a valid repository path. Separating the two means that
   * we don't toggle visibility of the warning message until it's really necessary, preventing
   * flickering for our users as they type in a path.
   */
  readonly showNonGitRepositoryWarning: boolean

  readonly ignoresSketchFiles: boolean
  readonly showNonIgnoresSketchFilesyWarning: boolean
  readonly modifyGitignoreToIgnoreSketchFiles: boolean

  readonly isRepositoryBare: boolean
}

/** The component for adding an existing local repository. */
export class AddExistingRepository extends React.Component<
  IAddExistingRepositoryProps,
  IAddExistingRepositoryState
> {
  public constructor(props: IAddExistingRepositoryProps) {
    super(props)

    const path = this.props.path ? this.props.path : ''

    this.state = {
      path,
      isRepository: false,
      showNonGitRepositoryWarning: false,
      ignoresSketchFiles: false,
      showNonIgnoresSketchFilesyWarning: false,
      modifyGitignoreToIgnoreSketchFiles: true,
      isRepositoryBare: false,
    }
  }

  public async componentDidMount() {
    const pathToCheck = this.state.path
    // We'll only have a path at this point if the dialog was opened with a path
    // to prefill.
    if (pathToCheck.length < 1) {
      return
    }

    const { isRepository, ignoresSketchFiles } = await isGitRepository(
      pathToCheck
    )
    // The path might have changed while we were checking, in which case we
    // don't care about the result anymore.
    if (this.state.path !== pathToCheck) {
      return
    }

    this.setState({
      ignoresSketchFiles,
      showNonIgnoresSketchFilesyWarning: !ignoresSketchFiles,
    })

    const isBare = await isBareRepository(this.state.path)
    if (isBare === true) {
      this.setState({ isRepositoryBare: true })
      return
    }

    this.setState({ isRepository, showNonGitRepositoryWarning: !isRepository })
    this.setState({ isRepositoryBare: false })
  }

  private renderWarning() {
    if (
      !this.state.path.length ||
      (!this.state.showNonGitRepositoryWarning &&
        !this.state.showNonIgnoresSketchFilesyWarning &&
        !this.state.isRepositoryBare)
    ) {
      return null
    }

    if (this.state.isRepositoryBare) {
      return (
        <Row className="warning-helper-text">
          <Octicon symbol={OcticonSymbol.alert} />
          <p>
            This directory appears to be a bare repository. Bare repositories
            are not currently supported.
          </p>
        </Row>
      )
    }

    if (this.state.showNonGitRepositoryWarning) {
      return (
        <Row className="warning-helper-text">
          <Octicon symbol={OcticonSymbol.alert} />
          <p>
            This directory does not appear to be a Git repository.
            <br />
            Would you like to{' '}
            <LinkButton onClick={this.onCreateRepositoryClicked}>
              create a repository
            </LinkButton>{' '}
            here instead?
          </p>
        </Row>
      )
    }

    return (
      <Row className="warning-helper-text">
        <Octicon symbol={OcticonSymbol.alert} />
        <div>
          This directory does not appear to ignore sketch files.
          <br />
          <Checkbox
            label="Would you like to ignore them? (recommended)"
            value={
              this.state.modifyGitignoreToIgnoreSketchFiles
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onModifyGitignoreChanged}
          />
        </div>
      </Row>
    )
  }

  public render() {
    const disabled =
      this.state.path.length === 0 ||
      !this.state.isRepository ||
      this.state.isRepositoryBare

    return (
      <Dialog
        id="add-existing-repository"
        title="Add Local Repository"
        onSubmit={this.addRepository}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <Row>
            <TextBox
              value={this.state.path}
              label="Local Path"
              placeholder="repository path"
              onValueChanged={this.onPathChanged}
              autoFocus={true}
            />
            <Button onClick={this.showFilePicker}>Choose…</Button>
          </Row>
          {this.renderWarning()}
        </DialogContent>

        <DialogFooter>
          <ButtonGroup>
            <Button disabled={disabled} type="submit">
              Add Repository
            </Button>
            <Button onClick={this.props.onDismissed}>Cancel</Button>
          </ButtonGroup>
        </DialogFooter>
      </Dialog>
    )
  }

  private onPathChanged = async (path: string) => {
    const { isRepository, ignoresSketchFiles } = await isGitRepository(path)

    this.setState({ path, isRepository, ignoresSketchFiles })
  }

  private showFilePicker = async () => {
    const directory: string[] | null = remote.dialog.showOpenDialog({
      properties: ['createDirectory', 'openDirectory'],
    })
    if (!directory) {
      return
    }

    const path = directory[0]
    const { isRepository, ignoresSketchFiles } = await isGitRepository(path)
    const isRepositoryBare = await isBareRepository(path)

    this.setState({
      path,
      isRepository,
      ignoresSketchFiles,
      showNonGitRepositoryWarning: !isRepository,
      showNonIgnoresSketchFilesyWarning: !ignoresSketchFiles,
      isRepositoryBare,
    })
  }

  private resolvedPath(path: string): string {
    return Path.resolve('/', untildify(path))
  }

  private addRepository = async () => {
    this.props.onDismissed()

    const resolvedPath = this.resolvedPath(this.state.path)
    const repositories = await this.props.dispatcher.addRepositories(
      [resolvedPath],
      !this.state.ignoresSketchFiles &&
        this.state.modifyGitignoreToIgnoreSketchFiles
    )

    if (repositories && repositories.length) {
      const repository = repositories[0]
      this.props.dispatcher.selectRepository(repository)
    }
  }

  private onCreateRepositoryClicked = () => {
    const resolvedPath = this.resolvedPath(this.state.path)

    return this.props.dispatcher.showPopup({
      type: PopupType.CreateRepository,
      path: resolvedPath,
    })
  }

  private onModifyGitignoreChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ modifyGitignoreToIgnoreSketchFiles: value })
  }
}
