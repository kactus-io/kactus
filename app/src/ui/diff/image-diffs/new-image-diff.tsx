import * as React from 'react'

import { ImageDiffType } from '../../../lib/app-state'
import { Image, DiffHunk } from '../../../models/diff'
import { DiffImage } from './diff-image'
import { TabBar, TabBarType } from '../../tab-bar'
import { ITextDiffUtilsProps, TextDiff } from '../text-diff'

interface INewImageDiffProps extends ITextDiffUtilsProps {
  readonly current: Image
  readonly text?: string
  readonly hunks?: ReadonlyArray<DiffHunk>

  readonly diffType: ImageDiffType
  readonly onChangeDiffType: (type: ImageDiffType) => void
}

/** A component to render when a new image has been added to the repository */
export class NewImageDiff extends React.Component<INewImageDiffProps, {}> {
  private onChangeDiffType = (index: number) => {
    this.props.onChangeDiffType(
      index === 1 ? ImageDiffType.Text : ImageDiffType.TwoUp
    )
  }

  public render() {
    return (
      <div className="panel image" id="diff">
        {this.props.diffType === ImageDiffType.Text &&
        this.props.text &&
        this.props.hunks ? (
          <TextDiff
            repository={this.props.repository}
            readOnly={this.props.readOnly}
            file={this.props.file}
            text={this.props.text}
            hunks={this.props.hunks}
            onIncludeChanged={this.props.onIncludeChanged}
          />
        ) : (
          <div className="new-image-diff">
            <div className="image-diff-current">
              <div className="image-diff-header">Added</div>
              <DiffImage image={this.props.current} />
            </div>
          </div>
        )}
        {this.props.text ? (
          <TabBar
            selectedIndex={this.props.diffType === ImageDiffType.Text ? 1 : 0}
            onTabClicked={this.onChangeDiffType}
            type={TabBarType.Switch}
          >
            <span>Visual</span>
            <span>Text</span>
          </TabBar>
        ) : null}
      </div>
    )
  }
}
