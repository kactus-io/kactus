import * as React from 'react'

import { AppFileStatus, mapStatus, iconForStatus } from '../../models/status'
import { PathText } from '../lib/path-text'
import { Octicon } from '../octicons'

interface IChangedSketchPartProps {
  readonly name: string
  readonly id: string
  readonly opened: boolean
  readonly parts: Array<string>
  readonly conflicted: boolean
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
    const listItemPadding = 10 * 2
    const checkboxWidth = 20
    const filePadding = 5
    const partPadding = 20
    const statusWidth = 16

    const availablePathWidth =
      this.props.availableWidth -
      listItemPadding -
      checkboxWidth -
      filePadding -
      statusWidth -
      this.props.parts.length * partPadding

    return (
      <div className="file">
        {this.props.parts.map((p, i) => (
          <Space key={i} />
        ))}
        <Arrow opened={this.props.opened} onClick={this.handleOpenChanged} />

        <label className="path">
          <PathText
            path={this.props.name}
            availableWidth={availablePathWidth}
          />
        </label>

        {this.props.conflicted && (
          <Octicon
            symbol={iconForStatus(AppFileStatus.Conflicted)}
            className={
              'status status-' +
              mapStatus(AppFileStatus.Conflicted).toLowerCase()
            }
            title={'Contains a conflict'}
          />
        )}
      </div>
    )
  }
}
