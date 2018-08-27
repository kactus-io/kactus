import * as React from 'react'
import { Loading } from './loading'
import { Form } from './form'
import { TextBox } from './text-box'
import { Button } from './button'
import { Errors } from './errors'
import { LinkButton } from './link-button'

interface IEnterpriseServerEntryProps {
  /**
   * An error which, if present, is presented to the
   * user in close proximity to the actions or input fields
   * related to the current step.
   */
  readonly error: Error | null

  /**
   * A value indicating whether or not the sign in store is
   * busy processing a request. While this value is true all
   * form inputs and actions save for a cancel action will
   * be disabled.
   */
  readonly loading: boolean

  /**
   * A callback which is invoked once the user has entered an
   * endpoint url and submitted it either by clicking on the submit
   * button or by submitting the form through other means (ie hitting Enter).
   */
  readonly onSubmit: (
    url: string,
    clientId: string,
    clientSecret: string
  ) => void

  /** An array of additional buttons to render after the "Continue" button. */
  readonly additionalButtons?: ReadonlyArray<JSX.Element>
}

interface IEnterpriseServerEntryState {
  readonly serverAddress: string
  readonly clientId: string
  readonly clientSecret: string
}

/** An entry form for an Enterprise server address. */
export class EnterpriseServerEntry extends React.Component<
  IEnterpriseServerEntryProps,
  IEnterpriseServerEntryState
> {
  public constructor(props: IEnterpriseServerEntryProps) {
    super(props)
    this.state = { serverAddress: '', clientId: '', clientSecret: '' }
  }

  private renderInstructionForGE(endpoint: string) {
    return (
      <ol>
        <li>
          Login to your{' '}
          {endpoint ? (
            <LinkButton uri={endpoint}>GitHub Enterprise appliance</LinkButton>
          ) : (
            'GitHub Enterprise appliance'
          )}
        </li>
        <li>Click on Settings, OAuth Applications</li>
        <li>
          If there is already a Kactus application, click on it and note Client
          ID, and Client Secret. Otherwise click on Register a new OAuth
          application.
        </li>
        <li>
          <p>Fill in the requested information:</p>
          <ul>
            <li>Application Name: Kactus</li>
            <li>Homepage URL: {'https://kactus.io'}</li>
            <li>Authorization callback URL: {'x-kactus-auth://oauth'}</li>
          </ul>
        </li>
        <li>
          Create the application and take note of the values Client ID, and
          Client Secret.
        </li>
      </ol>
    )
  }

  public render() {
    const disableEntry = this.props.loading
    const disableSubmission =
      this.state.serverAddress.length === 0 || this.props.loading

    return (
      <Form onSubmit={this.onSubmit}>
        <TextBox
          label="Enterprise server address"
          autoFocus={true}
          disabled={disableEntry}
          onValueChanged={this.onServerAddressChanged}
          placeholder="https://github.example.com"
        />

        {this.renderInstructionForGE(this.state.serverAddress)}

        <TextBox
          label="Application Client Id"
          disabled={disableEntry}
          onValueChanged={this.onclientIdChanged}
          placeholder=""
        />

        <TextBox
          label="Application Client Secret"
          disabled={disableEntry}
          onValueChanged={this.onClientSecretChanged}
          placeholder=""
        />

        {this.props.error ? <Errors>{this.props.error.message}</Errors> : null}

        <div className="actions">
          <Button type="submit" disabled={disableSubmission}>
            {this.props.loading ? <Loading /> : null} Continue
          </Button>
          {this.props.additionalButtons}
        </div>
      </Form>
    )
  }

  private onServerAddressChanged = (serverAddress: string) => {
    this.setState({ serverAddress })
  }

  private onclientIdChanged = (clientId: string) => {
    this.setState({ clientId })
  }

  private onClientSecretChanged = (clientSecret: string) => {
    this.setState({ clientSecret })
  }

  private onSubmit = () => {
    this.props.onSubmit(
      this.state.serverAddress,
      this.state.clientId,
      this.state.clientSecret
    )
  }
}
