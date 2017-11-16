import * as React from 'react'
import { ModifiedImageDiff } from './modified-image-diff'
import { NewImageDiff } from './new-image-diff'
import { DeletedImageDiff } from './deleted-image-diff'

import { ImageDiffType } from '../../../lib/app-state'
import { Image, DiffHunk } from '../../../models/diff'
import { ITextDiffUtilsProps } from '../text-diff'

/** The props for the Diff component. */
interface IDiffProps extends ITextDiffUtilsProps {
  /** The diff that should be rendered */
  readonly previous?: Image
  readonly current?: Image
  readonly text?: string
  readonly hunks?: ReadonlyArray<DiffHunk>

  /** called when changing the type of image diff to display */
  readonly onChangeImageDiffType: (type: ImageDiffType) => void

  /** The type of image diff to display. */
  readonly imageDiffType: ImageDiffType
}

/** A component which renders a diff for a file. */
export class ImageDiff extends React.Component<IDiffProps, {}> {
  public render() {
    const { current, previous } = this.props
    if (current && previous) {
      return (
        <ModifiedImageDiff
          onChangeDiffType={this.props.onChangeImageDiffType}
          diffType={this.props.imageDiffType}
          current={current}
          previous={previous}
          text={this.props.text}
          hunks={this.props.hunks}
          repository={this.props.repository}
          file={this.props.file}
          readOnly={this.props.readOnly}
          onIncludeChanged={this.props.onIncludeChanged}
        />
      )
    }

    if (current) {
      return (
        <NewImageDiff
          onChangeDiffType={this.props.onChangeImageDiffType}
          diffType={this.props.imageDiffType}
          current={current}
          text={this.props.text}
          hunks={this.props.hunks}
          repository={this.props.repository}
          file={this.props.file}
          readOnly={this.props.readOnly}
          onIncludeChanged={this.props.onIncludeChanged}
        />
      )
    }

    if (previous) {
      return (
        <DeletedImageDiff
          onChangeDiffType={this.props.onChangeImageDiffType}
          diffType={this.props.imageDiffType}
          previous={previous}
          text={this.props.text}
          hunks={this.props.hunks}
          repository={this.props.repository}
          file={this.props.file}
          readOnly={this.props.readOnly}
          onIncludeChanged={this.props.onIncludeChanged}
        />
      )
    }

    return null
  }
}
