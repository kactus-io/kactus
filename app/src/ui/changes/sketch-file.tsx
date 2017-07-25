import * as React from 'react'

import { PathText } from '../lib/path-text'
import { showContextualMenu, IMenuItem } from '../main-process-proxy'
import { IKactusFile } from 'kactus-cli'

interface ISketchFileProps {
  readonly file: IKactusFile
  readonly onImport: (path: string) => void
  readonly onParse: (path: string) => void
  readonly onOpen: (file: IKactusFile) => void
  readonly availableWidth: number
}

/** a changed file in the working directory for a given repository */
export class SketchFile extends React.Component<
  ISketchFileProps,
  Readonly<{}>
> {
  public render() {
    const listItemPadding = 10 * 2
    const checkboxWidth = 20
    const statusWidth = 16
    const filePadding = 5

    const availablePathWidth =
      this.props.availableWidth -
      listItemPadding -
      checkboxWidth -
      filePadding -
      statusWidth

    return (
      <div className="file" onContextMenu={this.onContextMenu}>
        <label className="path">
          <PathText
            path={this.props.file.id}
            availableWidth={availablePathWidth}
          />
        </label>
      </div>
    )
  }

  private onContextMenu = (event: React.MouseEvent<any>) => {
    event.preventDefault()

    const items: IMenuItem[] = [
      {
        label: __DARWIN__ ? 'Export Sketch To JSON…' : 'Export to JSON…',
        action: () => this.props.onParse(this.props.file.path),
        enabled: this.props.file.imported,
      },
      {
        label: __DARWIN__
          ? 'Regenerate Sketch File From JSON…'
          : 'Regenerate Sketch File From JSON…',
        action: () => this.props.onImport(this.props.file.path),
        enabled: this.props.file.parsed,
      },
      { type: 'separator' },
      {
        label: 'Open',
        action: () => this.props.onOpen(this.props.file),
      },
    ]

    showContextualMenu(items)
  }
}
