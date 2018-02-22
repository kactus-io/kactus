import {
  ExternalEditor,
  ExternalEditorError,
  getAvailableEditors,
} from './utils'
import { IFoundEditor } from './found-editor'

let editorCache: ReadonlyArray<IFoundEditor<ExternalEditor>> | null = null

/**
 * Resolve a list of installed editors on the user's machine, using the known
 * install identifiers that each OS supports.
 */
export async function getCachedAvailableEditors(): Promise<
  ReadonlyArray<IFoundEditor<ExternalEditor>>
> {
  if (editorCache && editorCache.length > 0) {
    return editorCache
  }

  editorCache = await getAvailableEditors()
  return editorCache
}

/**
 * Find an editor installed on the machine using the friendly name, or the
 * first valid editor if `null` is provided.
 *
 * Will throw an error if no editors are found, or if the editor name cannot
 * be found (i.e. it has been removed).
 */
export async function findEditorOrDefault(
  name: string | null
): Promise<IFoundEditor<ExternalEditor>> {
  const editors = await getCachedAvailableEditors()
  if (editors.length === 0) {
    throw new ExternalEditorError(
      'No suitable editors installed for Kactus to launch. Install Atom for your platform and try again and restart Kactus to try again.',
      { suggestAtom: true }
    )
  }

  if (name) {
    const match = editors.find(p => p.editor === name) || null
    if (!match) {
      const menuItemName = 'Preferences'
      const message = `The editor '${name}' could not be found. Please open ${menuItemName} and choose an available editor.`

      throw new ExternalEditorError(message, { openPreferences: true })
    }

    return match
  }

  return editors[0]
}
