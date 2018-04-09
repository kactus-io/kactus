import * as React from 'react'
import { Account } from '../../models/account'

interface IStripeCheckoutProps {
  /** A function called when the dialog is dismissed. */
  readonly onDismissed: () => void
  readonly onLoaded: () => void
  readonly user?: Account
  readonly onToken: (token: IToken) => void
  readonly enterprise: boolean
  readonly price: number
}

interface IStripeCheckoutState {
  readonly open: boolean
  readonly waitingForStripe: boolean
}

let stripeHandler: IStripeCheckout | undefined

export class Checkout extends React.Component<
  IStripeCheckoutProps,
  IStripeCheckoutState
> {
  private _success: boolean = false

  public constructor(props: IStripeCheckoutProps) {
    super(props)
    this.state = {
      open: false,
      waitingForStripe: false,
    }
  }

  public componentWillMount() {
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
    if (!this._success) {
      this.props.onDismissed()
    }
  }

  private onOpened = () => {
    this.setState({ open: true })
    this.props.onLoaded()
  }

  private onToken = (token: IToken) => {
    this._success = true
    this.props.onToken(token)
  }

  private showStripeDialog = () => {
    const enterprise = this.props.enterprise
    const primaryEmail =
      this.props.user && this.props.user.emails.find(e => e.primary)
    stripeHandler!.open({
      token: this.onToken,
      opened: this.onOpened,
      closed: this.onClosed,
      panelLabel: 'Unlock ({{amount}}/month)',
      amount: this.props.price * 100,
      email: !enterprise && primaryEmail ? primaryEmail.email : undefined,
      bitcoin: true,
    })
  }

  public render() {
    return null
  }
}
