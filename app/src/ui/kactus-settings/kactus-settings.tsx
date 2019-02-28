import * as React from 'react'
import { IFullKactusConfig } from '../../lib/kactus'
import { KactusConfig } from './kactus-config'
import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { Button } from '../lib/button'
import { ButtonGroup } from '../lib/button-group'
import { Dialog, DialogError, DialogFooter } from '../dialog'

interface IKactusSettingsProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly onDismissed: () => void
  readonly kactusConfig: IFullKactusConfig
}

interface IKactusSettingsState {
  readonly disabled: boolean
  readonly errors?: ReadonlyArray<JSX.Element | string>
  readonly kactusConfig: IFullKactusConfig
  readonly kactusHasChanged: boolean
}

export class KactusSettings extends React.Component<
  IKactusSettingsProps,
  IKactusSettingsState
> {
  public constructor(props: IKactusSettingsProps) {
    super(props)

    this.state = {
      disabled: false,
      kactusConfig: props.kactusConfig,
      kactusHasChanged: false,
    }
  }

  private renderErrors(): JSX.Element[] | null {
    const errors = this.state.errors

    if (!errors || !errors.length) {
      return null
    }

    return errors.map((err, ix) => {
      const key = `err-${ix}`
      return <DialogError key={key}>{err}</DialogError>
    })
  }

  public render() {
    return (
      <Dialog
        id="kactus-settings"
        title="Kactus Settings"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
        disabled={this.state.disabled}
        loading={this.state.disabled}
      >
        {this.renderErrors()}
        {this.renderKactusConfig()}
        {this.renderFooter()}
      </Dialog>
    )
  }

  private renderFooter() {
    return (
      <DialogFooter>
        <ButtonGroup>
          <Button type="submit">Save</Button>
          <Button onClick={this.props.onDismissed}>Cancel</Button>
        </ButtonGroup>
      </DialogFooter>
    )
  }

  private renderKactusConfig() {
    return (
      <KactusConfig
        config={this.state.kactusConfig}
        onKactusChanged={this.onKactusChanged}
        onShowKactusDoc={this.onShowKactusDoc}
      />
    )
  }

  private onShowKactusDoc = () => {
    this.props.dispatcher.openInBrowser(
      'http://kactus.io/help/#kactus-dot-json'
    )
  }

  private onSubmit = async () => {
    this.setState({ disabled: true, errors: undefined })
    const errors = new Array<JSX.Element | string>()

    if (this.state.kactusHasChanged) {
      try {
        try {
          await this.props.dispatcher.saveKactusConfig(
            this.props.repository,
            this.state.kactusConfig
          )
        } catch (e) {
          log.error(
            `KactusSettings: unable to save kactus config at ${
              this.props.repository.path
            }`,
            e
          )
          errors.push(`Failed saving the kactus.json file: ${e}`)
        }
      } catch (e) {
        log.error(`KactusSettings: unable to parse kactus config`, e)
        errors.push(`Couldn't parse the kactus config: ${e}`)
      }
    }

    if (!errors.length) {
      this.props.onDismissed()
    } else {
      this.setState({ disabled: false, errors })
    }
  }

  private onKactusChanged = (config: IFullKactusConfig) => {
    this.setState({ kactusConfig: config, kactusHasChanged: true })
  }
}
