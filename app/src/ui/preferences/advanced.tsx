import * as React from 'react'
import * as prettyBytes from 'pretty-bytes'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Row } from '../../ui/lib/row'
import { Button } from '../lib/button'
import { Select } from '../lib/select'
import { UncommittedChangesStrategyKind } from '../../models/uncommitted-changes-strategy'
import { getKactusCacheSize, clearKactusCache } from '../../lib/kactus'

interface IAdvancedPreferencesProps {
  readonly confirmRepositoryRemoval: boolean
  readonly confirmDiscardChanges: boolean
  readonly confirmForcePush: boolean
  readonly uncommittedChangesStrategyKind: UncommittedChangesStrategyKind
  readonly onConfirmDiscardChangesChanged: (checked: boolean) => void
  readonly onConfirmRepositoryRemovalChanged: (checked: boolean) => void
  readonly onConfirmForcePushChanged: (checked: boolean) => void
  readonly onUncommittedChangesStrategyKindChanged: (
    value: UncommittedChangesStrategyKind
  ) => void
  readonly kactusClearCacheInterval: number
  readonly onKactusClearCacheInterval: (seconds: number) => void
}

interface IAdvancedPreferencesState {
  readonly confirmRepositoryRemoval: boolean
  readonly confirmDiscardChanges: boolean
  readonly kactusCacheSize: number | null
  readonly kactusClearCacheInterval: string
  readonly confirmForcePush: boolean
  readonly uncommittedChangesStrategyKind: UncommittedChangesStrategyKind
}

export class Advanced extends React.Component<
  IAdvancedPreferencesProps,
  IAdvancedPreferencesState
> {
  public constructor(props: IAdvancedPreferencesProps) {
    super(props)

    this.state = {
      confirmRepositoryRemoval: this.props.confirmRepositoryRemoval,
      confirmDiscardChanges: this.props.confirmDiscardChanges,
      confirmForcePush: this.props.confirmForcePush,
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

  private onConfirmDiscardChangesChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmDiscardChanges: value })
    this.props.onConfirmDiscardChangesChanged(value)
  }

  private onConfirmForcePushChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmForcePush: value })
    this.props.onConfirmForcePushChanged(value)
  }

  private onConfirmRepositoryRemovalChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmRepositoryRemoval: value })
    this.props.onConfirmRepositoryRemovalChanged(value)
  }

  private onUncommittedChangesStrategyKindChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.value as UncommittedChangesStrategyKind

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
            {this.state.kactusCacheSize
              ? prettyBytes(this.state.kactusCacheSize)
              : 'loading...'}
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
          <div className="radio-component">
            <input
              type="radio"
              id={UncommittedChangesStrategyKind.AskForConfirmation}
              value={UncommittedChangesStrategyKind.AskForConfirmation}
              checked={
                this.state.uncommittedChangesStrategyKind ===
                UncommittedChangesStrategyKind.AskForConfirmation
              }
              onChange={this.onUncommittedChangesStrategyKindChanged}
            />
            <label htmlFor={UncommittedChangesStrategyKind.AskForConfirmation}>
              Ask me where I want the changes to go
            </label>
          </div>
          <div className="radio-component">
            <input
              type="radio"
              id={UncommittedChangesStrategyKind.MoveToNewBranch}
              value={UncommittedChangesStrategyKind.MoveToNewBranch}
              checked={
                this.state.uncommittedChangesStrategyKind ===
                UncommittedChangesStrategyKind.MoveToNewBranch
              }
              onChange={this.onUncommittedChangesStrategyKindChanged}
            />
            <label htmlFor={UncommittedChangesStrategyKind.MoveToNewBranch}>
              Always bring my changes to my new branch
            </label>
          </div>
          <div className="radio-component">
            <input
              type="radio"
              id={UncommittedChangesStrategyKind.StashOnCurrentBranch}
              value={UncommittedChangesStrategyKind.StashOnCurrentBranch}
              checked={
                this.state.uncommittedChangesStrategyKind ===
                UncommittedChangesStrategyKind.StashOnCurrentBranch
              }
              onChange={this.onUncommittedChangesStrategyKindChanged}
            />
            <label
              htmlFor={UncommittedChangesStrategyKind.StashOnCurrentBranch}
            >
              Always stash and leave my changes on the current branch
            </label>
          </div>
        </div>
        <div className="advanced-section">
          <h2>Show a confirmation dialog before...</h2>
          <Checkbox
            label="Removing repositories"
            value={
              this.state.confirmRepositoryRemoval
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onConfirmRepositoryRemovalChanged}
          />
          <Checkbox
            label="Discarding changes"
            value={
              this.state.confirmDiscardChanges
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onConfirmDiscardChangesChanged}
          />
          <Checkbox
            label="Force pushing"
            value={
              this.state.confirmForcePush ? CheckboxValue.On : CheckboxValue.Off
            }
            onChange={this.onConfirmForcePushChanged}
          />
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
