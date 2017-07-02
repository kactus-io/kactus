import * as React from 'react'
import { TextBox } from '../lib/text-box'
import { IAPICoupon } from '../../lib/api'
import { Octicon, OcticonSymbol } from '../octicons'
import { Loading } from '../lib/loading'

interface ICouponInputProps {
  readonly coupon: string
  readonly couponState: IAPICoupon | 'loading' | null
  readonly onValueChanged: (coupon: string) => void
}

export class CouponInput extends React.Component<
  ICouponInputProps,
  Readonly<{}>
> {

  public render() {
    const { couponState, coupon, onValueChanged } = this.props

    const couponLabel = (
      <span>
        Coupon
        {couponState && (
          <span>
            {' - '}
            {couponState === 'loading'
              ? <Loading />
            : couponState.error
              ? <span><Octicon symbol={OcticonSymbol.circleSlash} /> {couponState.error}</span>
              : <span><Octicon symbol={OcticonSymbol.check} /> {couponState.discount}</span>
            }
          </span>
        )}
      </span>
    )

    return <TextBox label={couponLabel} value={coupon} onValueChanged={onValueChanged} />
  }
}
