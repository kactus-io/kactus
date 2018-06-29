import { Menu, ipcMain, shell, app } from 'electron'
import { ensureItemIds } from './ensure-item-ids'
import { MenuEvent } from './menu-event'
import { getLogDirectoryPath } from '../../lib/logging/get-log-path'
import { ensureDir } from 'fs-extra'

import { log } from '../log'
import { openDirectorySafe } from '../shell'

const defaultEditorLabel = 'Open in External Editor'
const defaultShellLabel = 'Open in Terminal'
const defaultPullRequestLabel = 'Create Pull Request'

export function buildDefaultMenu(
  editorLabel: string = defaultEditorLabel,
  shellLabel: string = defaultShellLabel,
  pullRequestLabel: string = defaultPullRequestLabel
): Electron.Menu {
  const template = new Array<Electron.MenuItemConstructorOptions>()
  const separator: Electron.MenuItemConstructorOptions = { type: 'separator' }

  template.push({
    label: 'Kactus',
    submenu: [
      {
        label: 'About Kactus',
        click: emit('show-about'),
        id: 'about',
      },
      separator,
      {
        label: 'Preferences…',
        id: 'preferences',
        accelerator: 'CmdOrCtrl+,',
        click: emit('show-preferences'),
      },
      separator,
      {
        label: 'Install Command Line Tool…',
        id: 'install-cli',
        click: emit('install-cli'),
      },
      separator,
      {
        role: 'services',
        submenu: [],
      },
      separator,
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      separator,
      { role: 'quit' },
    ],
  })

  const fileMenu: Electron.MenuItemConstructorOptions = {
    label: 'File',
    submenu: [
      {
        label: 'New Repository…',
        id: 'new-repository',
        click: emit('create-repository'),
        accelerator: 'CmdOrCtrl+N',
      },
      {
        label: 'New Sketch File…',
        id: 'create-sketch-file',
        click: emit('create-sketch-file'),
      },
      separator,
      {
        label: 'Add Local Repository…',
        id: 'add-local-repository',
        accelerator: 'CmdOrCtrl+O',
        click: emit('add-local-repository'),
      },
      {
        label: 'Clone Repository…',
        id: 'clone-repository',
        accelerator: 'CmdOrCtrl+Shift+O',
        click: emit('clone-repository'),
      },
    ],
  }

  template.push(fileMenu)

  template.push({
    label: 'Edit',
    submenu: [
      { role: 'undo', label: 'Undo' },
      { role: 'redo', label: 'Redo' },
      separator,
      { role: 'cut', label: 'Cut' },
      { role: 'copy', label: 'Copy' },
      { role: 'paste', label: 'Paste' },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        click: emit('select-all'),
      },
    ],
  })

  template.push({
    label: 'View',
    submenu: [
      {
        label: 'Show Changes',
        id: 'show-changes',
        accelerator: 'CmdOrCtrl+1',
        click: emit('show-changes'),
      },
      {
        label: 'Show History',
        id: 'show-history',
        accelerator: 'CmdOrCtrl+2',
        click: emit('show-history'),
      },
      {
        label: 'Show Repository List',
        id: 'show-repository-list',
        accelerator: 'CmdOrCtrl+T',
        click: emit('choose-repository'),
      },
      {
        label: 'Show Branches List',
        id: 'show-branches-list',
        accelerator: 'CmdOrCtrl+B',
        click: emit('show-branches'),
      },
      separator,
      {
        label: 'Toggle Full Screen',
        role: 'togglefullscreen',
      },
      separator,
      {
        label: 'Open Sketch',
        id: 'open-sketch',
        accelerator: 'Ctrl+K',
        click: emit('open-sketch'),
      },
      separator,
      {
        label: 'Reset Zoom',
        accelerator: 'CmdOrCtrl+0',
        click: zoom(ZoomDirection.Reset),
      },
      {
        label: 'Zoom In',
        accelerator: 'CmdOrCtrl+=',
        click: zoom(ZoomDirection.In),
      },
      {
        label: 'Zoom Out',
        accelerator: 'CmdOrCtrl+-',
        click: zoom(ZoomDirection.Out),
      },
      separator,
      {
        label: '&Reload',
        id: 'reload-window',
        // Ctrl+Alt is interpreted as AltGr on international keyboards and this
        // can clash with other shortcuts. We should always use Ctrl+Shift for
        // chorded shortcuts, but this menu item is not a user-facing feature
        // so we are going to keep this one around and save Ctrl+Shift+R for
        // a different shortcut in the future...
        accelerator: 'CmdOrCtrl+Alt+R',
        click(item: any, focusedWindow: Electron.BrowserWindow) {
          if (focusedWindow) {
            focusedWindow.reload()
          }
        },
        visible: __RELEASE_CHANNEL__ === 'development',
      },
      {
        id: 'show-devtools',
        label: 'Toggle Developer Tools',
        accelerator: 'Alt+Command+I',
        click(item: any, focusedWindow: Electron.BrowserWindow) {
          if (focusedWindow) {
            focusedWindow.webContents.toggleDevTools()
          }
        },
      },
    ],
  })

  template.push({
    label: 'Repository',
    id: 'repository',
    submenu: [
      {
        id: 'push',
        label: 'Push',
        accelerator: 'CmdOrCtrl+P',
        click: emit('push'),
      },
      {
        id: 'pull',
        label: 'Pull',
        accelerator: 'CmdOrCtrl+Shift+P',
        click: emit('pull'),
      },
      {
        label: 'Remove',
        id: 'remove-repository',
        click: emit('remove-repository'),
      },
      separator,
      {
        id: 'view-repository-on-github',
        label: 'View on GitHub',
        accelerator: 'CmdOrCtrl+Shift+G',
        click: emit('view-repository-on-github'),
      },
      {
        label: shellLabel,
        id: 'open-in-shell',
        accelerator: 'Ctrl+`',
        click: emit('open-in-shell'),
      },
      {
        label: 'Show in Finder',
        id: 'open-working-directory',
        accelerator: 'CmdOrCtrl+Shift+F',
        click: emit('open-working-directory'),
      },
      {
        label: editorLabel,
        id: 'open-external-editor',
        accelerator: 'CmdOrCtrl+Shift+A',
        click: emit('open-external-editor'),
      },
      separator,
      {
        label: 'Repository Settings…',
        id: 'show-repository-settings',
        click: emit('show-repository-settings'),
      },
      {
        label: 'Kactus Settings…',
        id: 'show-kactus-settings',
        click: emit('show-kactus-settings'),
      },
    ],
  })

  template.push({
    label: 'Branch',
    id: 'branch',
    submenu: [
      {
        label: 'New Branch…',
        id: 'create-branch',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: emit('create-branch'),
      },
      {
        label: 'Rename…',
        id: 'rename-branch',
        click: emit('rename-branch'),
      },
      {
        label: 'Delete…',
        id: 'delete-branch',
        click: emit('delete-branch'),
      },
      separator,
      {
        label: 'Update From Default Branch',
        id: 'update-branch',
        accelerator: 'CmdOrCtrl+Shift+U',
        click: emit('update-branch'),
      },
      {
        label: 'Compare to Branch',
        id: 'compare-to-branch',
        accelerator: 'CmdOrCtrl+Shift+B',
        click: emit('compare-to-branch'),
      },
      {
        label: 'Merge Into Current Branch…',
        id: 'merge-branch',
        accelerator: 'CmdOrCtrl+Shift+M',
        click: emit('merge-branch'),
      },
      separator,
      {
        label: 'Compare on GitHub',
        id: 'compare-on-github',
        accelerator: 'CmdOrCtrl+Shift+C',
        click: emit('compare-on-github'),
      },
      {
        label: pullRequestLabel,
        id: 'create-pull-request',
        accelerator: 'CmdOrCtrl+R',
        click: emit('open-pull-request'),
      },
    ],
  })
  template.push({
    role: 'window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      { role: 'close' },
      separator,
      { role: 'front' },
    ],
  })

  const submitIssueItem: Electron.MenuItemConstructorOptions = {
    label: 'Report Issue…',
    click() {
      shell.openExternal(
        'https://github.com/kactus-io/kactus/issues/new/choose'
      )
    },
  }

  const contactSupportItem: Electron.MenuItemConstructorOptions = {
    label: 'Contact Kactus Support…',
    click() {
      shell.openExternal(
        `https://kactus.io/contact?from_kactus_app=1&app_version=${app.getVersion()}`
      )
    },
  }

  const showUserGuides: Electron.MenuItemConstructorOptions = {
    label: 'Show User Guides',
    click() {
      shell.openExternal('https://kactus.io/help/')
    },
  }

  const showLogsLabel = 'Show Logs in Finder'

  const showLogsItem: Electron.MenuItemConstructorOptions = {
    label: showLogsLabel,
    click() {
      const logPath = getLogDirectoryPath()
      ensureDir(logPath)
        .then(() => {
          openDirectorySafe(logPath)
        })
        .catch(err => {
          log('error', err.message)
        })
    },
  }

  const helpItems = [
    submitIssueItem,
    contactSupportItem,
    showUserGuides,
    showLogsItem,
  ]

  if (__DEV__) {
    helpItems.push(
      separator,
      {
        label: 'Crash main process…',
        click() {
          throw new Error('Boomtown!')
        },
      },
      {
        label: 'Crash renderer process…',
        click: emit('boomtown'),
      }
    )
  }

  template.push({
    role: 'help',
    submenu: helpItems,
  })

  ensureItemIds(template)

  return Menu.buildFromTemplate(template)
}

type ClickHandler = (
  menuItem: Electron.MenuItem,
  browserWindow: Electron.BrowserWindow,
  event: Electron.Event
) => void

/**
 * Utility function returning a Click event handler which, when invoked, emits
 * the provided menu event over IPC.
 */
function emit(name: MenuEvent): ClickHandler {
  return (menuItem, window) => {
    if (window) {
      window.webContents.send('menu-event', { name })
    } else {
      ipcMain.emit('menu-event', { name })
    }
  }
}

enum ZoomDirection {
  Reset,
  In,
  Out,
}

/** The zoom steps that we support, these factors must sorted */
const ZoomInFactors = [1, 1.1, 1.25, 1.5, 1.75, 2]
const ZoomOutFactors = ZoomInFactors.slice().reverse()

/**
 * Returns the element in the array that's closest to the value parameter. Note
 * that this function will throw if passed an empty array.
 */
function findClosestValue(arr: Array<number>, value: number) {
  return arr.reduce((previous, current) => {
    return Math.abs(current - value) < Math.abs(previous - value)
      ? current
      : previous
  })
}

/**
 * Figure out the next zoom level for the given direction and alert the renderer
 * about a change in zoom factor if necessary.
 */
function zoom(direction: ZoomDirection): ClickHandler {
  return (menuItem, window) => {
    if (!window) {
      return
    }

    const { webContents } = window

    if (direction === ZoomDirection.Reset) {
      webContents.setZoomFactor(1)
      webContents.send('zoom-factor-changed', 1)
    } else {
      webContents.getZoomFactor(rawZoom => {
        const zoomFactors =
          direction === ZoomDirection.In ? ZoomInFactors : ZoomOutFactors

        // So the values that we get from getZoomFactor are floating point
        // precision numbers from chromium that don't always round nicely so
        // we'll have to do a little trick to figure out which of our supported
        // zoom factors the value is referring to.
        const currentZoom = findClosestValue(zoomFactors, rawZoom)

        const nextZoomLevel = zoomFactors.find(
          f =>
            direction === ZoomDirection.In ? f > currentZoom : f < currentZoom
        )

        // If we couldn't find a zoom level (likely due to manual manipulation
        // of the zoom factor in devtools) we'll just snap to the closest valid
        // factor we've got.
        const newZoom =
          nextZoomLevel === undefined ? currentZoom : nextZoomLevel

        webContents.setZoomFactor(newZoom)
        webContents.send('zoom-factor-changed', newZoom)
      })
    }
  }
}
