import * as React from 'react'
import { IKactusConfig } from 'kactus-cli'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { TextBox } from '../lib/text-box'
import { Row } from '../lib/row'
import { Button } from '../lib/button'
import { LinkButton } from '../lib/link-button'
import { Octicon, OcticonSymbol } from '../octicons'

interface IKactusConfigProps {
  readonly config: IKactusConfig
  readonly onKactusChanged: (config: IKactusConfig) => void
  readonly onShowKactusDoc: () => void
}

interface IKactusConfigState {
  readonly page: string
}

/** A view for creating or modifying the repository's kactus config */
export class KactusConfig extends React.Component<
  IKactusConfigProps,
  IKactusConfigState
> {
  public constructor(props: IKactusConfigProps) {
    super(props)
    this.state = {
      page: '',
    }
  }

  public render() {
    const { config } = this.props
    return (
      <DialogContent>
        <p>
          The config for Kactus is kept in a file called kactus.json at the root
          of the repository. Changing the config here will change the file.
          Check out{' '}
          <LinkButton onClick={this.props.onShowKactusDoc}>
            kactus.io
          </LinkButton>{' '}
          for more information about the file format.
        </p>
        <Row>
          <Checkbox
            label="Share the text styles between sketch files"
            value={
              config.shareTextStyles ? CheckboxValue.On : CheckboxValue.Off
            }
            onChange={this.onShareTextStylesChange}
          />
        </Row>
        <Row>
          <Checkbox
            label="Share the layer styles between sketch files"
            value={
              config.shareLayerStyles ? CheckboxValue.On : CheckboxValue.Off
            }
            onChange={this.onShareLayerStylesChange}
          />
        </Row>
        <Row>
          Shared pages across sketch files ({(config.sharedPages || []).length})
        </Row>
        <div style={{ paddingLeft: 20 }}>
          {(config.sharedPages || []).map(page =>
            <Row key={page} className="shared-page">
              <Octicon symbol={OcticonSymbol.primitiveDot} />
              {page}
              <span
                className="remove-icon"
                onClick={this.onRemoveSharedPage(page)}
                title={"Don't share " + page + ' anymore'}
              >
                <Octicon symbol={OcticonSymbol.trashcan} />
              </span>
            </Row>
          )}
          <Row>
            <TextBox
              label="New page to share"
              value={this.state.page}
              onValueChanged={this.onNewPageChanged}
              onKeyDown={this.catchEnterKeyInAddSharedPage}
            />
            <Button onClick={this.catchClickInAddSharedPage}>Add</Button>
          </Row>
        </div>
      </DialogContent>
    )
  }

  private onNewPageChanged = (value: string) => {
    this.setState({
      page: value,
    })
  }

  private catchEnterKeyInAddSharedPage = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.keyCode === 13) {
      event.preventDefault()
      this.onAddSharedPage()
    }
  }

  private catchClickInAddSharedPage = (
    event: React.FormEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    this.onAddSharedPage()
  }

  private onAddSharedPage = () => {
    if (!this.state.page) {
      return
    }
    this.props.onKactusChanged({
      ...this.props.config,
      sharedPages: (this.props.config.sharedPages || [])
        .concat(this.state.page),
    })
    this.setState({
      page: '',
    })
  }

  private onRemoveSharedPage = (page: string) => () => {
    this.props.onKactusChanged({
      ...this.props.config,
      sharedPages: (this.props.config.sharedPages || [])
        .filter(p => p !== page),
    })
  }

  private onShareTextStylesChange = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onKactusChanged({
      ...this.props.config,
      shareTextStyles: event.currentTarget.checked,
    })
  }

  private onShareLayerStylesChange = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onKactusChanged({
      ...this.props.config,
      shareLayerStyles: event.currentTarget.checked,
    })
  }
}
