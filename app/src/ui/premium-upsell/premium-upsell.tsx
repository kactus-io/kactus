import * as React from 'react'
import { Dispatcher } from '../../lib/dispatcher'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { ButtonGroup } from '../lib/button-group'
import { Button } from '../lib/button'
import { Checkout } from './stripe-checkout'
import { Account } from '../../models/account'

interface IPremiumUpsellProps {
  /** A function called when the dialog is dismissed. */
  readonly onDismissed: () => void
  readonly dispatcher: Dispatcher
  readonly user?: Account
}

interface IPremiumUpsellState {
  /** A function called when the dialog is dismissed. */
  readonly showingCheckout: boolean
  readonly loadingCheckout: boolean
}

export class PremiumUpsell extends React.Component<IPremiumUpsellProps, IPremiumUpsellState> {
  public constructor(props: IPremiumUpsellProps) {
    super(props)
    this.state = {
      showingCheckout: false,
      loadingCheckout: false,
    }
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

  private onToken = (token: IToken) => {
    // this.props.dispatcher.unlockKactus(token.id, token.email)
  }

  public render() {
    const { loadingCheckout, showingCheckout } = this.state
    return (
      <div>
        {(loadingCheckout || showingCheckout) &&
          <Checkout
            onDismissed={this.props.onDismissed}
            onLoaded={this.finishedLoadingCheckout}
            onToken={this.onToken}
            user={this.props.user}
          />}
        {!showingCheckout &&
          <Dialog
            id='premium-upsell'
            title='Unlock the full potential of Kactus'
            onSubmit={this.showCheckout}
            onDismissed={this.props.onDismissed}
            loading={loadingCheckout}
          >
            <DialogContent>
              Convince me here
            </DialogContent>

            <DialogFooter>
              <ButtonGroup>
                <Button type='submit'>Unlock Kactus</Button>
                <Button onClick={this.props.onDismissed}>Not now</Button>
              </ButtonGroup>
            </DialogFooter>
          </Dialog>}
      </div>
    )
  }
}
