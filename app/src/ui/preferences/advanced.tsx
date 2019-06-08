import * as React from 'react'
import * as prettyBytes from 'pretty-bytes'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { LinkButton } from '../lib/link-button'
import { Row } from '../../ui/lib/row'
import { Button } from '../lib/button'
import { Select } from '../lib/select'
import { ExternalEditor, parse as parseEditor } from '../../lib/editors'
import { Shell, parse as parseShell } from '../../lib/shells'
import { TextBox } from '../lib/text-box'
import { enableMergeTool } from '../../lib/feature-flag'
import { IMergeTool } from '../../lib/git/config'
import { getKactusCacheSize, clearKactusCache } from '../../lib/kactus'

interface IAdvancedPreferencesProps {
  readonly confirmRepositoryRemoval: boolean
  readonly confirmDiscardChanges: boolean
  readonly confirmForcePush: boolean
  readonly availableEditors: ReadonlyArray<ExternalEditor>
  readonly selectedExternalEditor?: ExternalEditor
  readonly availableShells: ReadonlyArray<Shell>
  readonly selectedShell: Shell
  readonly kactusClearCacheInterval: number
  readonly onConfirmDiscardChangesChanged: (checked: boolean) => void
  readonly onConfirmRepositoryRemovalChanged: (checked: boolean) => void
  readonly onConfirmForcePushChanged: (checked: boolean) => void
  readonly onSelectedEditorChanged: (editor: ExternalEditor) => void
  readonly onSelectedShellChanged: (shell: Shell) => void
  readonly onKactusClearCacheInterval: (seconds: number) => void

  readonly mergeTool: IMergeTool | null
  readonly onMergeToolNameChanged: (name: string) => void
  readonly onMergeToolCommandChanged: (command: string) => void
}

interface IAdvancedPreferencesState {
  readonly selectedExternalEditor?: ExternalEditor
  readonly selectedShell: Shell
  readonly confirmRepositoryRemoval: boolean
  readonly confirmDiscardChanges: boolean
  readonly kactusCacheSize: number | null
  readonly kactusClearCacheInterval: string
  readonly confirmForcePush: boolean
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
      selectedExternalEditor: this.props.selectedExternalEditor,
      selectedShell: this.props.selectedShell,
      kactusCacheSize: null,
      kactusClearCacheInterval: '' + this.props.kactusClearCacheInterval,
    }

    getKactusCacheSize()
      .then(kactusCacheSize => {
        this.setState({
          kactusCacheSize,
        })
      })
      .catch(log.error)
  }

  public async componentWillReceiveProps(nextProps: IAdvancedPreferencesProps) {
    const editors = nextProps.availableEditors
    let selectedExternalEditor = nextProps.selectedExternalEditor
    if (editors.length) {
      const indexOf = selectedExternalEditor
        ? editors.indexOf(selectedExternalEditor)
        : -1
      if (indexOf === -1) {
        selectedExternalEditor = editors[0]
        nextProps.onSelectedEditorChanged(selectedExternalEditor)
      }
    }

    const shells = nextProps.availableShells
    let selectedShell = nextProps.selectedShell
    if (shells.length) {
      const indexOf = shells.indexOf(selectedShell)
      if (indexOf === -1) {
        selectedShell = shells[0]
        nextProps.onSelectedShellChanged(selectedShell)
      }
    }

    this.setState({
      selectedExternalEditor,
      selectedShell,
    })
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

  private onSelectedEditorChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = parseEditor(event.currentTarget.value)
    if (value) {
      this.setState({ selectedExternalEditor: value })
      this.props.onSelectedEditorChanged(value)
    }
  }

  private onSelectedShellChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = parseShell(event.currentTarget.value)
    this.setState({ selectedShell: value })
    this.props.onSelectedShellChanged(value)
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

  private renderExternalEditor() {
    const options = this.props.availableEditors
    const label = 'External Editor'

    if (options.length === 0) {
      // this is emulating the <Select/> component's UI so the styles are
      // consistent for either case.
      //
      // TODO: see whether it makes sense to have a fallback UI
      // which we display when the select list is empty
      return (
        <div className="select-component no-options-found">
          <label>{label}</label>
          <span>
            No editors found.{' '}
            <LinkButton uri="https://atom.io/">Install Atom?</LinkButton>
          </span>
        </div>
      )
    }

    return (
      <Select
        label={label}
        value={this.state.selectedExternalEditor}
        onChange={this.onSelectedEditorChanged}
      >
        {options.map(n => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
    )
  }

  private renderSelectedShell() {
    const options = this.props.availableShells

    return (
      <Select
        label="Shell"
        value={this.state.selectedShell}
        onChange={this.onSelectedShellChanged}
      >
        {options.map(n => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
    )
  }

  private renderMergeTool() {
    if (!enableMergeTool()) {
      return null
    }

    if (enableMergeTool()) {
      return true
    }

    const mergeTool = this.props.mergeTool

    return (
      <div className="brutalism">
        <strong>Merge Tool</strong>

        <Row>
          <TextBox
            placeholder="Name"
            value={mergeTool ? mergeTool.name : ''}
            onValueChanged={this.props.onMergeToolNameChanged}
          />
        </Row>

        <Row>
          <TextBox
            placeholder="Command"
            value={mergeTool && mergeTool.command ? mergeTool.command : ''}
            onValueChanged={this.props.onMergeToolCommandChanged}
          />
        </Row>
      </div>
    )
  }

  public render() {
    return (
      <DialogContent>
        <Row>{this.renderExternalEditor()}</Row>
        <Row>{this.renderSelectedShell()}</Row>
        {this.renderMergeTool()}
        <Row>
          <Checkbox
            label="Show confirmation dialog before removing repositories"
            value={
              this.state.confirmRepositoryRemoval
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onConfirmRepositoryRemovalChanged}
          />
        </Row>
        <Row>
          <Checkbox
            label="Show confirmation dialog before discarding changes"
            value={
              this.state.confirmDiscardChanges
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onConfirmDiscardChangesChanged}
          />
        </Row>
        <Row>
          <Checkbox
            label="Show confirmation dialog before force pushing"
            value={
              this.state.confirmForcePush ? CheckboxValue.On : CheckboxValue.Off
            }
            onChange={this.onConfirmForcePushChanged}
          />
        </Row>
        <h2>Kactus Cache</h2>
        <p>
          Kactus keeps the previews in a cache so that it doesn't have to
          generate them every time.
        </p>
        {this.renderKactusCache()}
      </DialogContent>
    )
  }
}
