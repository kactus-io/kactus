import * as React from 'react'
import { Dispatcher } from '../../lib/dispatcher'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { ButtonGroup } from '../lib/button-group'
import { Button } from '../lib/button'
import { Checkout } from './stripe-checkout'
import { Account } from '../../models/account'
import { ThrottledScheduler } from '../lib/throttled-scheduler'
import { fetchCoupon, IAPICoupon } from '../../lib/api'
import { RetryAction } from '../../lib/retry-actions'
import { shell } from '../../lib/app-shell'
import { CouponInput } from './coupon-input'
import { LinkButton } from '../lib/link-button'
import { CallToAction } from '../lib/call-to-action'
import { PremiumType } from '../../lib/app-state'

interface IPremiumUpsellProps {
  /** A function called when the dialog is dismissed. */
  readonly onDismissed: () => void
  readonly dispatcher: Dispatcher
  readonly user?: Account
  readonly isUnlockingKactusFullAccess: boolean
  readonly kind: PremiumType | 'choice'
  readonly retryAction?: RetryAction
}

interface IPremiumUpsellState {
  /** A function called when the dialog is dismissed. */
  readonly showingCheckout: boolean
  readonly loadingCheckout: boolean
  readonly coupon: string
  readonly couponState: IAPICoupon | 'loading' | null
  readonly choice: PremiumType
}

const EnterpriseCopy = () => (
  <ul>
    <li>Unlimited public repositories</li>
    <li>
      No locked-in commitment: you can always generate the sketch files to
      switch back
    </li>
    <li>
      <strong>Unlimited private repositories</strong>
    </li>
    <li>
      <strong>Support single sign-on and on-premises deployment</strong>
    </li>
    <li>
      <strong>
        Support any git server (BitBucket, Gitlab, self-hosted, etc.)
      </strong>
    </li>
  </ul>
)

const PremiumCopy = () => (
  <ul>
    <li>Unlimited public repositories</li>
    <li>
      No locked-in commitment: you can always generate the sketch files to
      switch back
    </li>
    <li>
      <strong>Unlimited private repositories</strong>
    </li>
  </ul>
)

export class PremiumUpsell extends React.Component<
  IPremiumUpsellProps,
  IPremiumUpsellState
> {
  private scheduler = new ThrottledScheduler(200)

  private requestId = 0

  public constructor(props: IPremiumUpsellProps) {
    super(props)
    this.state = {
      showingCheckout: false,
      loadingCheckout: false,
      choice: this.props.kind !== 'choice' ? this.props.kind : 'premium',
      coupon: '',
      couponState: null,
    }
  }

  public componentWillUpdate(nextProps: IPremiumUpsellProps) {
    if (
      !nextProps.isUnlockingKactusFullAccess &&
      this.props.isUnlockingKactusFullAccess
    ) {
      setTimeout(() => this.props.onDismissed(), 1000)
    }
  }

  public componentWillUnmount() {
    this.scheduler.clear()
  }

  private showCheckout = () => {
    this.setState({
      loadingCheckout: true,
    })
  }

  private finishedLoadingCheckout = () => {
    this.setState({
      showingCheckout: true,
      loadingCheckout: false,
    })
  }

  private onToken = async (token: IToken, args: any) => {
    if (!this.props.user) {
      return
    }
    await this.props.dispatcher.unlockKactus(this.props.user, token.id, {
      metadata: args,
      email: token.email,
      enterprise: this.state.choice === 'enterprise',
      coupon: this.state.coupon !== '' ? this.state.coupon : undefined,
    })

    if (this.props.retryAction) {
      const retryAction = this.props.retryAction
      const dispatcher = this.props.dispatcher
      setTimeout(() => dispatcher.performRetry(retryAction), 100)
    }
  }

  private onCouponChange = (coupon: string) => {
    if (coupon === '') {
      this.scheduler.clear()
      return this.setState({
        coupon,
        couponState: null,
      })
    }

    this.setState({
      coupon,
      couponState: 'loading',
    })

    this.scheduler.queue(async () => {
      this.requestId += 1
      const couponState = await fetchCoupon(coupon, this.requestId)
      if (couponState.requestId !== this.requestId) {
        return
      }
      this.setState({
        couponState,
      })
    })
  }

  private onExternalLink = () => {
    const url = `http://kactus.io/pricing`
    shell.openExternal(url)
  }

  public render() {
    const { loadingCheckout, showingCheckout, couponState, coupon } = this.state

    if (this.props.isUnlockingKactusFullAccess) {
      return (
        <Dialog
          id="premium-upsell"
          title="Unlocking the full potential of Kactus"
          onDismissed={this.props.onDismissed}
          loading={true}
        >
          <DialogContent>Hang on, unlocking your account...</DialogContent>
        </Dialog>
      )
    }

    if (!this.props.user) {
      return (
        <Dialog
          id="premium-upsell"
          title="Full potential of Kactus unlocked!"
          onDismissed={this.props.onDismissed}
        >
          <DialogContent>
            <div>
              <p>
                Hey! This feature is only available in the{' '}
                {this.state.choice === 'enterprise'
                  ? 'enterprise'
                  : 'full access'}{' '}
                version of Kactus.
              </p>
              <p>
                You need to login to Kactus using GitHub before unlocking it.
              </p>
              {this.renderSignIn()}
            </div>
          </DialogContent>

          <DialogFooter>
            <ButtonGroup>
              <Button onClick={this.props.onDismissed}>Not now</Button>
            </ButtonGroup>
          </DialogFooter>
        </Dialog>
      )
    }

    if (
      (this.state.choice === 'premium' && this.props.user.unlockedKactus) ||
      (this.state.choice === 'enterprise' &&
        this.props.user.unlockedEnterpriseKactus)
    ) {
      return (
        <Dialog
          id="premium-upsell"
          title="Full potential of Kactus unlocked!"
          onDismissed={this.props.onDismissed}
        >
          <DialogContent>Done, thank! Enjoy Kactus!</DialogContent>
        </Dialog>
      )
    }

    const copy =
      this.props.kind === 'choice' ? (
        <div className="choices">
          <div
            className={
              'plan' + (this.state.choice === 'premium' ? ' selected' : '')
            }
            onClick={this.selectPremiumPlan}
          >
            <h2>Premium</h2>
            <h3>$4.99</h3>
            <h4>per month</h4>
            <PremiumCopy />
          </div>
          <div
            className={
              'plan' + (this.state.choice === 'enterprise' ? ' selected' : '')
            }
            onClick={this.selectEnterprisePlan}
          >
            <h2>Enterprise</h2>
            <h3>$11.99</h3>
            <h4>per month</h4>
            <EnterpriseCopy />
          </div>
        </div>
      ) : this.state.choice === 'enterprise' ? (
        <EnterpriseCopy />
      ) : (
        <PremiumCopy />
      )

    let price = this.state.choice === 'enterprise' ? 11.99 : 4.99
    if (couponState && couponState !== 'loading') {
      if (couponState.percent_off) {
        price = (price * (100 - couponState.percent_off)) / 100
      } else if (couponState.amount_off) {
        price = Math.max(price - couponState.amount_off, 0)
      }
    }

    return (
      <div>
        {(loadingCheckout || showingCheckout) && (
          <Checkout
            onDismissed={this.props.onDismissed}
            onLoaded={this.finishedLoadingCheckout}
            onToken={this.onToken}
            user={this.props.user}
            enterprise={this.state.choice === 'enterprise'}
            price={price}
          />
        )}
        {!showingCheckout && (
          <Dialog
            id="premium-upsell"
            title="Unlock the full potential of Kactus"
            onSubmit={this.showCheckout}
            onDismissed={this.props.onDismissed}
            loading={loadingCheckout}
          >
            <DialogContent>
              {copy}
              <p>
                More information available{' '}
                <LinkButton onClick={this.onExternalLink}>here</LinkButton>.
              </p>
              {this.props.kind === 'choice' && (
                <CouponInput
                  couponState={couponState}
                  coupon={coupon}
                  onValueChanged={this.onCouponChange}
                />
              )}
            </DialogContent>

            <DialogFooter>
              <ButtonGroup>
                <Button
                  type="submit"
                  disabled={
                    couponState === 'loading' ||
                    (couponState !== null && !!couponState.error)
                  }
                >
                  Unlock (${price.toFixed(2)}/month)
                </Button>
                <Button onClick={this.props.onDismissed}>Not now</Button>
              </ButtonGroup>
            </DialogFooter>
          </Dialog>
        )}
      </div>
    )
  }

  private renderSignIn() {
    const signInTitle = 'Sign In'
    return (
      <div>
        <br />
        <CallToAction
          actionTitle={signInTitle + ' with Personal Account'}
          onAction={this.signInDotCom}
        >
          <div>
            Sign in to your GitHub.com account to access your repositories.
          </div>
        </CallToAction>
        <br />
        <CallToAction
          actionTitle={signInTitle + ' with Enterprise Account'}
          onAction={this.signInEnterprise}
        >
          <div>
            If you have a GitHub Enterprise account at work, sign in to it to
            get access to your enterprise's repositories.
          </div>
        </CallToAction>
      </div>
    )
  }

  private signInDotCom = () => {
    this.props.dispatcher.showDotComSignInDialog(this.props.retryAction)
  }

  private signInEnterprise = () => {
    this.props.dispatcher.showEnterpriseSignInDialog(this.props.retryAction)
  }

  private selectPremiumPlan = () => {
    this.setState({
      choice: 'premium',
    })
  }

  private selectEnterprisePlan = () => {
    this.setState({
      choice: 'enterprise',
    })
  }
}
