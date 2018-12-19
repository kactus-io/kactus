import * as React from 'react'

import { AppFileStatus } from '../../models/status'
import { AppFileStatusKind } from '../../models/status'
import { PathText } from '../lib/path-text'
import { Octicon, iconForStatus } from '../octicons'
import { mapStatus } from '../../lib/status'

interface IChangedSketchPartProps {
  readonly name: string
  readonly id: string
  readonly opened: boolean
  readonly parts: Array<string>
  readonly status?: AppFileStatus
  readonly onOpenChanged: (id: string, opened: boolean) => void

  readonly availableWidth: number
}

const Space = () => <span style={{ marginLeft: 20 }} />

const Arrow = ({
  opened,
  onClick,
}: {
  opened: boolean
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void
}) => {
  return (
    <span
      style={{
        paddingRight: 10,
      }}
      onClick={onClick}
    >
      {opened ? '▼' : '▶︎'}
    </span>
  )
}

/** a changed file in the working directory for a given repository */
export class ChangedSketchPart extends React.Component<
  IChangedSketchPartProps,
  {}
> {
  private handleOpenChanged = (event: React.MouseEvent<HTMLDivElement>) => {
    this.props.onOpenChanged(this.props.id, !this.props.opened)
  }

  public render() {
    const { availableWidth, parts, opened, status, name } = this.props
    const listItemPadding = 10 * 2
    const checkboxWidth = 20
    const filePadding = 5
    const partPadding = 20
    const statusWidth = 16

    const availablePathWidth =
      availableWidth -
      listItemPadding -
      checkboxWidth -
      filePadding -
      statusWidth -
      parts.length * partPadding

    return (
      <div className="file">
        {parts.map((p, i) => (
          <Space key={i} />
        ))}
        <Arrow opened={opened} onClick={this.handleOpenChanged} />

        <label className="path">
          <PathText path={name} availableWidth={availablePathWidth} />
        </label>

        {status && status.kind === AppFileStatusKind.Conflicted && (
          <Octicon
            symbol={iconForStatus(status)}
            className={'status status-' + mapStatus(status).toLowerCase()}
            title={'Contains a conflict'}
          />
        )}
      </div>
    )
  }
}
