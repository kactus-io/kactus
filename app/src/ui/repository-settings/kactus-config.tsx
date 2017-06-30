import * as React from 'react'
import { DialogContent } from '../dialog'
import { TextArea } from '../lib/text-area'
import { LinkButton } from '../lib/link-button'

interface IKactusConfigProps {
  readonly config: string
  readonly onKactusChanged: (text: string) => void
  readonly onShowKactusDoc: () => void
}

/** A view for creating or modifying the repository's gitignore file */
export class KactusConfig extends React.Component<
  IKactusConfigProps,
  Readonly<{}>
> {
  public render() {
    return (
      <DialogContent>
        <p>
          The kactus.json file controls which the options used by Kactus. Check
          out{' '}
          <LinkButton onClick={this.props.onShowKactusDoc}>
            kactus.io
          </LinkButton>{' '}
          for more information about the file format.
        </p>
        <TextArea
          placeholder="Kactus config"
          value={this.props.config || '{}'}
          onChange={this.onChange}
          rows={6}
        />
      </DialogContent>
    )
  }

  private onChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
    const text = event.currentTarget.value
    this.props.onKactusChanged(text)
  }
}
