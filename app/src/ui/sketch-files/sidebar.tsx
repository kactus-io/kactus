import * as React from 'react'

import { SketchFilesList } from './sketch-files-list'
import { IKactusState } from '../../lib/app-state'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../../lib/dispatcher'

interface ISketchFilesSidebarProps {
  readonly repository: Repository
  readonly kactus: IKactusState
  readonly dispatcher: Dispatcher
  readonly availableWidth: number
}

export class SketchFilesSidebar extends React.Component<ISketchFilesSidebarProps, void> {
  private onFileSelectionChanged = (row: number) => {
    const file = this.props.kactus.files[row]
    this.props.dispatcher.changeSketchFileSelection(this.props.repository, file)
  }

  private onParse = (path: string) => {
    this.props.dispatcher.parseSketchFile(this.props.repository, path)
  }

  private onImport = (path: string) => {
    this.props.dispatcher.importSketchFile(this.props.repository, path)
  }

  private onIgnore = (path: string) => {
    this.props.dispatcher.ignoreSketchFile(this.props.repository, path)
  }

  public render() {
    const kactus = this.props.kactus
    const selectedFileID = kactus.selectedFileID

    return (
      <div id='changes-sidebar-contents' style={{ flexBasis: 150, flexGrow: 0 }}>
        <SketchFilesList
          files={kactus.files}
          selectedFileID={selectedFileID}
          onFileSelectionChanged={this.onFileSelectionChanged}
          onParse={this.onParse}
          onImport={this.onImport}
          availableWidth={this.props.availableWidth}
          onIgnore={this.onIgnore}
        />
      </div>
    )
  }
}
