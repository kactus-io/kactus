import * as React from 'react'
import { SketchFile } from './sketch-file'
import { List, ClickSource } from '../lib/list'
import { Octicon, OcticonSymbol } from '../octicons'

import { IKactusFile } from '../../lib/kactus'

const RowHeight = 29

interface ISketchFilesListProps {
  readonly files: Array<IKactusFile>
  readonly selectedFileID: string | null
  readonly onFileSelectionChanged: (file: IKactusFile) => void
  readonly onParse: (file: IKactusFile) => void
  readonly onImport: (file: IKactusFile) => void
  readonly onOpen: (file: IKactusFile) => void
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
        file={file}
        key={file.id}
        onImport={this.props.onImport}
        onParse={this.props.onParse}
        onOpen={this.props.onOpen}
        availableWidth={this.props.availableWidth}
      />
    )
  }

  private onFileSelectionChanged = (rows: ReadonlyArray<number>) => {
    const file = this.props.files[rows[0]]
    this.props.onFileSelectionChanged(file)
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
          <label className="changed-files-count">{filesDescription}</label>
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
          selectedRows={[selectedRow]}
          onSelectionChanged={this.onFileSelectionChanged}
          invalidationProps={this.props.files}
          onRowClick={this.props.onRowClick}
        />
      </div>
    )
  }
}
