import * as React from 'react'
import { PathLabel } from '../lib/path-label'
import { AppFileStatus } from '../../models/status'
import { IDiff, DiffType } from '../../models/diff'
import { Octicon, OcticonSymbol, iconForStatus } from '../octicons'
import { mapStatus } from '../../lib/status'

interface IChangedFileDetailsProps {
  readonly path: string
  readonly status: AppFileStatus
  readonly diff: IDiff
}

const TypeMap = [
  'Document',
  'Page',
  'Artboard',
  'Layer',
  'Shape Group',
  'Group',
  'Symbol',
  'Bitmap',
  'Style',
]

/** Displays information about a file */
export class ChangedFileDetails extends React.Component<
  IChangedFileDetailsProps,
  {}
> {
  public render() {
    const status = this.props.status
    const fileStatus = mapStatus(status)

    const diff = this.props.diff
    let type: string | undefined
    if (diff.kind === DiffType.Sketch) {
      type = TypeMap[diff.type]
    }

    return (
      <div className="header">
        <PathLabel
          type={type}
          path={this.props.path}
          status={this.props.status}
        />
        {this.renderDecorator()}

        <Octicon
          symbol={iconForStatus(status)}
          className={'status status-' + fileStatus.toLowerCase()}
          title={fileStatus}
        />
      </div>
    )
  }

  private renderDecorator() {
    const diff = this.props.diff
    if (diff.kind === DiffType.Text && diff.lineEndingsChange) {
      const message = `Warning: line endings will be changed from '${
        diff.lineEndingsChange.from
      }' to '${diff.lineEndingsChange.to}'.`
      return (
        <Octicon
          symbol={OcticonSymbol.alert}
          className={'line-endings'}
          title={message}
        />
      )
    } else {
      return null
    }
  }
}
