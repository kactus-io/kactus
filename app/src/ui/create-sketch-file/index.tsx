import * as React from 'react'
import { IKactusFile } from '../../lib/kactus'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../../lib/dispatcher'
import { TextBox } from '../lib/text-box'
import { Row } from '../lib/row'
import { Button } from '../lib/button'
import { ButtonGroup } from '../lib/button-group'
import { Dialog, DialogError, DialogContent, DialogFooter } from '../dialog'

interface ICreateSketchFileProps {
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void
  readonly allFiles: ReadonlyArray<IKactusFile>
}

interface ICreateSketchFileState {
  readonly currentError: Error | null
  readonly proposedName: string

  /**
   * Whether or not the dialog is currently creating a file. This affects
   * the dialog loading state as well as the rendering of the branch selector.
   */
  readonly isCreatingFile: boolean
}

/** The Create Branch component. */
export class CreateSketchFile extends React.Component<
  ICreateSketchFileProps,
  ICreateSketchFileState
> {
  public constructor(props: ICreateSketchFileProps) {
    super(props)

    this.state = {
      currentError: null,
      proposedName: '',
      isCreatingFile: false,
    }
  }

  public render() {
    const proposedName = this.state.proposedName
    const disabled =
      !proposedName.length ||
      !!this.state.currentError ||
      /^\s*$/.test(this.state.proposedName)
    const error = this.state.currentError

    return (
      <Dialog
        id="create-sketch-file"
        title="Create a Sketch File"
        onSubmit={this.createFile}
        onDismissed={this.props.onDismissed}
        loading={this.state.isCreatingFile}
        disabled={this.state.isCreatingFile}
      >
        {error ? <DialogError>{error.message}</DialogError> : null}

        <DialogContent>
          <Row>
            <TextBox
              label="Name"
              autoFocus={true}
              onValueChanged={this.onFileNameChange}
            />
          </Row>
        </DialogContent>

        <DialogFooter>
          <ButtonGroup>
            <Button type="submit" disabled={disabled}>
              Create File
            </Button>
            <Button onClick={this.props.onDismissed}>Cancel</Button>
          </ButtonGroup>
        </DialogFooter>
      </Dialog>
    )
  }

  private onFileNameChange = (str: string) => {
    const alreadyExists = this.props.allFiles.findIndex(b => b.id === str) > -1
    let currentError: Error | null = null
    if (alreadyExists) {
      currentError = new Error(`A file named ${str} already exists`)
    }

    this.setState({
      currentError,
      proposedName: str,
    })
  }

  private createFile = async () => {
    const name = this.state.proposedName

    if (name.length > 0) {
      this.setState({ isCreatingFile: true })
      try {
        await this.props.dispatcher.createNewSketchFile(
          this.props.repository,
          name
        )
        this.props.onDismissed()
      } catch (err) {
        log.error('Could not create sketch file ' + name, err)
        this.setState({
          currentError: err,
          isCreatingFile: false,
        })
      }
    }
  }
}
