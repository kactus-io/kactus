import * as React from 'react'
import { Account } from '../../models/account'

interface IStripeCheckoutProps {
  /** A function called when the dialog is dismissed. */
  readonly onDismissed: () => void
  readonly onLoaded: () => void
  readonly user?: Account
  readonly onToken: (token: IToken) => void
}

interface IStripeCheckoutState {
  readonly open: boolean
  readonly waitingForStripe: boolean
}

let stripeHandler: IStripeCheckout | undefined

export class Checkout extends React.Component<IStripeCheckoutProps, IStripeCheckoutState> {
  public constructor (props: IStripeCheckoutProps) {
    super(props)
    this.state = {
      open: false,
      waitingForStripe: false,
    }
  }

  public componentWillMount () {
    if (stripeHandler) {
      return this.showStripeDialog()
    }
    if (typeof StripeCheckout !== undefined) {
      stripeHandler = StripeCheckout.configure({
        key: __STRIPE_KEY__,
      })
      return this.showStripeDialog()
    }
    this.setState({
      waitingForStripe: true,
    })
  }

  public componentWillUnmount() {
    if (this.state.open && stripeHandler) {
      stripeHandler.close()
    }
  }

  private onClosed = () => {
    this.props.onDismissed()
  }

  private onOpened = () => {
    this.setState({ open: true })
    this.props.onLoaded()
  }

  private showStripeDialog = () => {
    const primaryEmail = this.props.user && this.props.user.emails.find(e => e.primary)
    stripeHandler!.open({
      token: this.props.onToken,
      opened: this.onOpened,
      closed: this.onClosed,
      name: 'Kactus',
      amount: 500,
      email: primaryEmail ? primaryEmail.email : undefined,
      bitcoin: true,
    })
  }

  public render() {
    return null
  }
}
