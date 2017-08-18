import * as React from 'react'

import { PathText } from '../lib/path-text'

interface IChangedSketchPartProps {
  readonly name: string
  readonly id: string
  readonly opened: boolean
  readonly parts: Array<string>
  readonly onOpenChanged: (id: string, opened: boolean) => void

  readonly availableWidth: number
}

const Space = () => <span style={{ marginLeft: 20 }} />

const Arrow = ({ opened }: { opened: boolean }) => {
  return (
    <span
      style={{
        paddingRight: 10,
      }}
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

    const availablePathWidth =
      this.props.availableWidth -
      listItemPadding -
      checkboxWidth -
      filePadding -
      this.props.parts.length * partPadding

    return (
      <div className="file" onClick={this.handleOpenChanged}>
        {this.props.parts.map(p => <Space />)}
        <Arrow opened={this.props.opened} />

        <PathText path={this.props.name} availableWidth={availablePathWidth} />
      </div>
    )
  }
}
