import * as React from 'react'
import prettyBytes from 'pretty-bytes'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Row } from '../../ui/lib/row'
import { Button } from '../lib/button'
import { Select } from '../lib/select'
import { UncommittedChangesStrategyKind } from '../../models/uncommitted-changes-strategy'
import { RadioButton } from '../lib/radio-button'
import { getKactusCacheSize, clearKactusCache } from '../../lib/kactus'
import { Loading } from '../lib/loading'

interface IAdvancedPreferencesProps {
  readonly kactusClearCacheInterval: number
  readonly onKactusClearCacheInterval: (seconds: number) => void
  readonly uncommittedChangesStrategyKind: UncommittedChangesStrategyKind
  readonly repositoryIndicatorsEnabled: boolean
  readonly onUncommittedChangesStrategyKindChanged: (
    value: UncommittedChangesStrategyKind
  ) => void
  readonly onRepositoryIndicatorsEnabledChanged: (enabled: boolean) => void
}

interface IAdvancedPreferencesState {
  readonly kactusCacheSize: number | null
  readonly kactusClearCacheInterval: string
  readonly uncommittedChangesStrategyKind: UncommittedChangesStrategyKind
}

export class Advanced extends React.Component<
  IAdvancedPreferencesProps,
  IAdvancedPreferencesState
> {
  public constructor(props: IAdvancedPreferencesProps) {
    super(props)

    this.state = {
      kactusCacheSize: null,
      kactusClearCacheInterval: '' + this.props.kactusClearCacheInterval,
      uncommittedChangesStrategyKind: this.props.uncommittedChangesStrategyKind,
    }

    getKactusCacheSize()
      .then(kactusCacheSize => {
        this.setState({
          kactusCacheSize,
        })
      })
      .catch(log.error)
  }

  private onUncommittedChangesStrategyKindChanged = (
    value: UncommittedChangesStrategyKind
  ) => {
    this.setState({ uncommittedChangesStrategyKind: value })
    this.props.onUncommittedChangesStrategyKindChanged(value)
  }

  private onKactusClearCacheIntervalChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = parseInt(event.currentTarget.value, 10)
    this.setState({ kactusClearCacheInterval: '' + value })
    this.props.onKactusClearCacheInterval(value)
  }

  private onRepositoryIndicatorsEnabledChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onRepositoryIndicatorsEnabledChanged(event.currentTarget.checked)
  }

  private onClearKactusCache = () => {
    this.setState({ kactusCacheSize: null })
    clearKactusCache().then(() =>
      getKactusCacheSize()
        .then(kactusCacheSize => {
          this.setState({
            kactusCacheSize,
          })
        })
        .catch(log.error)
    )
  }

  private renderKactusCache() {
    const options = [1, 3, 7, 16, 30, 360]

    return (
      <>
        <Row>
          <Select
            label="Automatically clear the Kactus cache older than"
            value={this.state.kactusClearCacheInterval}
            onChange={this.onKactusClearCacheIntervalChanged}
          >
            {options.map(n => (
              <option key={n} value={'' + n * 3600 * 24}>
                {n} {n > 1 ? 'days' : 'day'}
              </option>
            ))}
          </Select>
        </Row>
        <Row>
          <span className="label-for-button">
            Size of the cache:{' '}
            {this.state.kactusCacheSize ? (
              prettyBytes(this.state.kactusCacheSize)
            ) : (
              <Loading />
            )}
          </span>
          <Button onClick={this.onClearKactusCache}>Clear cache now</Button>
        </Row>
      </>
    )
  }

  public render() {
    return (
      <DialogContent>
        <div className="advanced-section">
          <h2>If I have changes and I switch branches...</h2>

          <RadioButton
            value={UncommittedChangesStrategyKind.AskForConfirmation}
            checked={
              this.state.uncommittedChangesStrategyKind ===
              UncommittedChangesStrategyKind.AskForConfirmation
            }
            label="Ask me where I want the changes to go"
            onSelected={this.onUncommittedChangesStrategyKindChanged}
          />

          <RadioButton
            value={UncommittedChangesStrategyKind.MoveToNewBranch}
            checked={
              this.state.uncommittedChangesStrategyKind ===
              UncommittedChangesStrategyKind.MoveToNewBranch
            }
            label="Always bring my changes to my new branch"
            onSelected={this.onUncommittedChangesStrategyKindChanged}
          />

          <RadioButton
            value={UncommittedChangesStrategyKind.StashOnCurrentBranch}
            checked={
              this.state.uncommittedChangesStrategyKind ===
              UncommittedChangesStrategyKind.StashOnCurrentBranch
            }
            label="Always stash and leave my changes on the current branch"
            onSelected={this.onUncommittedChangesStrategyKindChanged}
          />
        </div>
        <div className="advanced-section">
          <h2>Background updates</h2>
          <Checkbox
            label="Periodically fetch and refresh status of all repositories"
            value={
              this.props.repositoryIndicatorsEnabled
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onRepositoryIndicatorsEnabledChanged}
          />
          <p className="git-settings-description">
            Allows the display of up-to-date status indicators in the repository
            list. Disabling this may improve performance with many repositories.
          </p>
        </div>

        <div className="advanced-section">
          <h2>Kactus Cache</h2>
          <p>
            Kactus keeps the previews in a cache so that it doesn't have to
            generate them every time.
          </p>
          {this.renderKactusCache()}
        </div>
      </DialogContent>
    )
  }
}
