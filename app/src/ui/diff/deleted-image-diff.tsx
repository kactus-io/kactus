import * as React from 'react'

import { Image } from '../../models/diff'
import { renderImage } from './render-image'

interface IDeletedImageDiffProps {
  readonly previous: Image
  readonly type?: string
}

/** A component to render when the file has been deleted from the repository */
export class DeletedImageDiff extends React.Component<IDeletedImageDiffProps, void> {

  public render() {
    return <div className='panel image' id='diff'>
      <div className='image-header'>this {this.props.type || 'image'} will be removed</div>
      {renderImage(this.props.previous)}
    </div>
  }
}
