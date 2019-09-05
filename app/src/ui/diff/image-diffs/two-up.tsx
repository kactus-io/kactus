import * as React from 'react'
import { ImageContainer } from './image-container'
import { ICommonImageDiffProperties } from './modified-image-diff'
import { ISize } from './sizing'

interface ITwoUpProps extends ICommonImageDiffProperties {
  readonly previousImageSize: ISize | null
  readonly currentImageSize: ISize | null
}

export class TwoUp extends React.Component<ITwoUpProps, {}> {
  public render() {
    const zeroSize = { width: 0, height: 0 }
    const previousImageSize = this.props.previousImageSize || zeroSize
    const currentImageSize = this.props.currentImageSize || zeroSize

    return (
      <div className="image-diff-container" ref={this.props.onContainerRef}>
        <div className="image-diff-two-up">
          <div className="image-diff-previous">
            <div className="image-diff-header">Deleted</div>
            <ImageContainer
              image={this.props.previous}
              onElementLoad={this.props.onPreviousImageLoad}
            />

            <div className="image-diff-footer">
              <span className="strong">W:</span> {previousImageSize.width}
              px | <span className="strong">H:</span> {previousImageSize.height}
              px
            </div>
          </div>

          <div className="image-diff-current">
            <div className="image-diff-header">Added</div>
            <ImageContainer
              image={this.props.current}
              onElementLoad={this.props.onCurrentImageLoad}
            />

            <div className="image-diff-footer">
              <span className="strong">W:</span> {currentImageSize.width}
              px | <span className="strong">H:</span> {currentImageSize.height}
              px
            </div>
          </div>
        </div>
      </div>
    )
  }
}
