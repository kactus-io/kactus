import * as React from 'react'
import { Octicon, OcticonSymbol } from '../octicons'
import { Banner } from './banner'

type ISuccessfulMergeProps = {
  readonly ourBranch: string
  readonly theirBranch?: string
  readonly onDismissed: () => void
}

export function SuccessfulMerge({
  ourBranch,
  theirBranch,
  onDismissed,
}: ISuccessfulMergeProps) {
  const message =
    theirBranch !== undefined ? (
      <span>
        {'Successfully merged '}
        <strong>{theirBranch}</strong>
        {' into '}
        <strong>{ourBranch}</strong>
      </span>
    ) : (
      <span>
        {'Successfully merged into '}
        <strong>{ourBranch}</strong>
      </span>
    )

  return (
    <Banner id="successful-merge" timeout={5000} onDismissed={onDismissed}>
      <div className="green-circle">
        <Octicon className="check-icon" symbol={OcticonSymbol.check} />
      </div>
      <div className="banner-message">{message}</div>
    </Banner>
  )
}
