import * as React from 'react'
import { Button } from '../lib/button'
import { ButtonGroup } from '../lib/button-group'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { getGlobalConfigPath } from '../../lib/git'
import { shell } from '../../lib/app-shell'

interface IAttributeMismatchProps {
  /** Called when the dialog should be dismissed. */
  readonly onDismissed: () => void

  /** Called when the user has chosen to replace the update filters. */
  readonly onUpdateExistingFilters: () => void
}

interface IAttributeMismatchState {
  readonly globalGitConfigPath: string | null
}

export class AttributeMismatch extends React.Component<
  IAttributeMismatchProps,
  IAttributeMismatchState
> {
  public constructor(props: IAttributeMismatchProps) {
    super(props)

    this.state = {
      globalGitConfigPath: null,
    }
  }

  public async componentDidMount() {
    try {
      const path = await getGlobalConfigPath()
      this.setState({ globalGitConfigPath: path })
    } catch (error) {
      log.warn(`Couldn't get the global git config path`, error)
    }
  }

  private renderGlobalGitConfigLink() {
    const path = this.state.globalGitConfigPath
    const msg = 'your global git config'
    if (path) {
      return <LinkButton onClick={this.showGlobalGitConfig}>{msg}</LinkButton>
    } else {
      return msg
    }
  }

  private showGlobalGitConfig = () => {
    const path = this.state.globalGitConfigPath
    if (path) {
      shell.openItem(path)
    }
  }

  public render() {
    return (
      <Dialog
        id="lfs-attribute-mismatch"
        title="Update Existing Git LFS Filters?"
        onDismissed={this.props.onDismissed}
        onSubmit={this.props.onUpdateExistingFilters}
      >
        <DialogContent>
          <p>
            Git LFS filters are already configured in{' '}
            {this.renderGlobalGitConfigLink()} but are not the values it
            expects. Would you like to update them now?
          </p>
        </DialogContent>

        <DialogFooter>
          <ButtonGroup>
            <Button type="submit">Update Existing Filters</Button>
            <Button onClick={this.props.onDismissed}>Not Now</Button>
          </ButtonGroup>
        </DialogFooter>
      </Dialog>
    )
  }
}
