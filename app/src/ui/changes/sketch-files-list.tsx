import * as React from 'react'
import { SketchFile } from './sketch-file'
import { List, ClickSource } from '../list'
import { Octicon, OcticonSymbol } from '../octicons'

import { IKactusFile } from 'kactus-cli'

const RowHeight = 29

interface ISketchFilesListProps {
  readonly files: Array<IKactusFile>
  readonly selectedFileID: string | null
  readonly onFileSelectionChanged: (row: number) => void
  readonly onParse: (path: string) => void
  readonly onImport: (path: string) => void
  readonly onOpen: (path: string) => void
  readonly onCreateSketchFile: () => void

  readonly availableWidth: number

  /**
   * Click event handler passed directly to the onRowClick prop of List, see
   * List Props for documentation.
   */
  readonly onRowClick?: (row: number, source: ClickSource) => void
}

export class SketchFilesList extends React.Component<
  ISketchFilesListProps,
  Readonly<{}>
> {
  private renderRow = (row: number): JSX.Element => {
    const file = this.props.files[row]

    return (
      <SketchFile
        path={file.path}
        id={file.id}
        parsed={file.parsed}
        imported={file.imported}
        key={file.id}
        onImport={this.props.onImport}
        onParse={this.props.onParse}
        onOpen={this.props.onOpen}
        availableWidth={this.props.availableWidth}
      />
    )
  }

  public render() {
    const fileList = this.props.files
    const selectedRow = fileList.findIndex(
      file => file.id === this.props.selectedFileID
    )
    const fileCount = fileList.length
    const filesPlural = fileCount === 1 ? 'file' : 'files'
    const filesDescription = `${fileCount} sketch ${filesPlural}`

    return (
      <div className="changes-list-container file-list">
        <div className="header">
          <label className="changed-files-count">
            {filesDescription}
          </label>
          <Octicon
            symbol={OcticonSymbol.plus}
            className="sketch-file-action active"
            onClick={this.props.onCreateSketchFile}
            title="Create a new sketch file"
          />
        </div>

        <List
          id="changes-list"
          rowCount={this.props.files.length}
          rowHeight={RowHeight}
          rowRenderer={this.renderRow}
          selectedRow={selectedRow}
          onSelectionChanged={this.props.onFileSelectionChanged}
          invalidationProps={this.props.files}
          onRowClick={this.props.onRowClick}
        />
      </div>
    )
  }
}
