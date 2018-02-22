import * as React from 'react'
import { encodePathAsUrl } from '../../lib/path'
import { UiView } from '../ui-view'
import { Button } from '../lib/button'
import { Octicon, OcticonSymbol } from '../octicons'

interface IBlankSlateProps {
  /** A function to call when the user chooses to create a repository. */
  readonly onCreate: () => void

  /** A function to call when the user chooses to clone a repository. */
  readonly onClone: () => void

  /** A function to call when the user chooses to add a local repository. */
  readonly onAdd: () => void
}

const BlankSlateImageUrl = encodePathAsUrl(
  __dirname,
  'static/empty-no-repo.svg'
)

const ImageStyle: React.CSSProperties = {
  backgroundImage: `url(${BlankSlateImageUrl})`,
}

/**
 * The blank slate view. This is shown when the user hasn't added any
 * repositories to the app.
 */
export class BlankSlateView extends React.Component<IBlankSlateProps, {}> {
  public render() {
    return (
      <UiView id="blank-slate">
        <div className="blankslate-image" style={ImageStyle} />

        <div className="content">
          <div className="title">No Repositories Found</div>

          <div className="callouts">
            <div className="callout">
              <Octicon symbol={OcticonSymbol.plus} />
              <div>Create a new project and publish it to GitHub</div>
              <Button onClick={this.props.onCreate}>
                Create New Repository
              </Button>
            </div>

            <div className="callout">
              <Octicon symbol={OcticonSymbol.deviceDesktop} />
              <div>
                Add an existing project on your computer and publish it to
                GitHub
              </div>
              <Button onClick={this.props.onAdd}>Add a Local Repository</Button>
            </div>

            <div className="callout">
              <Octicon symbol={OcticonSymbol.repoClone} />
              <div>Clone an existing project from GitHub to your computer</div>
              <Button onClick={this.props.onClone}>Clone a Repository</Button>
            </div>
          </div>
        </div>

        <p className="footer">
          Alternatively, you can drag and drop a local repository here to add
          it.
        </p>
      </UiView>
    )
  }
}
