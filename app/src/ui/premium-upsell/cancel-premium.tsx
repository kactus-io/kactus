import * as React from 'react'
import { Dispatcher } from '../dispatcher'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Row } from '../../ui/lib/row'
import { ButtonGroup } from '../lib/button-group'
import { Button } from '../lib/button'
import { Account } from '../../models/account'

interface ICancelPremiumProps {
  /** A function called when the dialog is dismissed. */
  readonly onDismissed: () => void
  readonly dispatcher: Dispatcher
  readonly user: Account
  readonly isCancellingKactusFullAccess: boolean
}

export class CancelPremium extends React.Component<
  ICancelPremiumProps,
  { refund: boolean }
> {
  public constructor(props: ICancelPremiumProps) {
    super(props)
    this.state = {
      refund: false,
    }
  }
  public componentWillUpdate(nextProps: ICancelPremiumProps) {
    if (
      !nextProps.isCancellingKactusFullAccess &&
      this.props.isCancellingKactusFullAccess
    ) {
      setTimeout(() => this.props.onDismissed(), 1500)
    }
  }

  private onCancelSubscription = () => {
    this.props.dispatcher.cancelKactusSubscription(this.props.user, {
      refund: this.state.refund,
    })
  }

  public render() {
    if (this.props.isCancellingKactusFullAccess) {
      return (
        <Dialog
          id="cancel-premium"
          title="Cancelling your subscription"
          onDismissed={this.props.onDismissed}
          loading={true}
        >
          <DialogContent>
            Hang on, cancelling your subscription...
          </DialogContent>
        </Dialog>
      )
    }

    if (
      !this.props.user.unlockedKactus &&
      !this.props.user.unlockedEnterpriseKactus
    ) {
      return (
        <Dialog
          id="cancel-premium"
          title="Subscription cancelled"
          onDismissed={this.props.onDismissed}
        >
          <DialogContent>
            Done, your subscription is cancelled. Hope we can still be friends
            😊
          </DialogContent>
        </Dialog>
      )
    }

    return (
      <Dialog
        id="premium-upsell"
        title="Unlock the full potential of Kactus"
        onSubmit={this.onCancelSubscription}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <Row>
            I'm sorry to see you go. If you have 2 minutes, I would really
            appreciate some feedback about what I can improve. Hope we can still
            be friend 😊
          </Row>
          <Row>
            <Checkbox
              label="I want to cancel immediately and a refund for the rest of the period (as opposed to cancel at the end of the period)"
              value={this.state.refund ? CheckboxValue.On : CheckboxValue.Off}
              onChange={this.onRefundChanged}
            />
          </Row>
        </DialogContent>

        <DialogFooter>
          <ButtonGroup>
            <Button type="submit" className="button-danger">
              Yes, cancel my subscription
            </Button>
            <Button onClick={this.props.onDismissed}>Not now</Button>
          </ButtonGroup>
        </DialogFooter>
      </Dialog>
    )
  }

  private onRefundChanged = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked

    this.setState({ refund: value })
  }
}
