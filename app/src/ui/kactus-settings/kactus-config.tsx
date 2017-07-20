import * as React from 'react'
import { IKactusConfig } from 'kactus-cli'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Row } from '../../ui/lib/row'
import { LinkButton } from '../lib/link-button'

interface IKactusConfigProps {
  readonly config: IKactusConfig
  readonly onKactusChanged: (config: IKactusConfig) => void
  readonly onShowKactusDoc: () => void
}

/** A view for creating or modifying the repository's kactus config */
export class KactusConfig extends React.Component<
  IKactusConfigProps,
  Readonly<{}>
> {
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
        {/* <TextArea
          placeholder="Kactus config"
          value={this.props.config || '{}'}
          onChange={this.onChange}
          rows={6}
        /> */}
      </DialogContent>
    )
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
