import '../lib/logging/main/install'

import * as Fs from 'fs'
import { app, Menu, ipcMain, BrowserWindow, shell } from 'electron'

import { MenuLabelsEvent } from '../models/menu-labels'

import { AppWindow } from './app-window'
import { buildDefaultMenu, MenuEvent, getAllMenuItems } from './menu'
import { shellNeedsPatching, updateEnvironmentForProcess } from '../lib/shell'
import { parseAppURL } from '../lib/parse-app-url'
import { fatalError } from '../lib/fatal-error'

import { IMenuItemState } from '../lib/menu-update'
import { LogLevel } from '../lib/logging/log-level'
import { log as writeLog } from './log'
import { reportError } from './exception-reporting'
import {
  enableSourceMaps,
  withSourceMappedStack,
} from '../lib/source-map-support'
import { symlinkSketchPlugin } from '../lib/symlink-sketch-plugin'
import { showUncaughtException } from './show-uncaught-exception'
import { IMenuItem } from '../lib/menu-item'
import { buildContextMenu } from './menu/build-context-menu'

enableSourceMaps()
symlinkSketchPlugin()

let mainWindow: AppWindow | null = null

type OnDidLoadFn = (window: AppWindow) => void
/** See the `onDidLoad` function. */
let onDidLoadFns: Array<OnDidLoadFn> | null = []

function handleUncaughtException(error: Error) {
  // If we haven't got a window we'll assume it's because
  // we've just launched and haven't created it yet.
  // It could also be because we're encountering an unhandled
  // exception on shutdown but that's less likely and since
  // this only affects the presentation of the crash dialog
  // it's a safe assumption to make.
  const isLaunchError = mainWindow === null

  if (mainWindow) {
    mainWindow.destroy()
    mainWindow = null
  }

  showUncaughtException(isLaunchError, error)
}

function getExtraErrorContext(): Record<string, string> {
  return {
    time: new Date().toString(),
  }
}

const possibleProtocols = new Set(['x-github-client'])
if (__DEV__) {
  possibleProtocols.add('x-github-desktop-dev-auth')
} else {
  possibleProtocols.add('x-github-desktop-auth')
}
// Also support Desktop Classic's protocols.
possibleProtocols.add('github-mac')

process.on('uncaughtException', (error: Error) => {
  error = withSourceMappedStack(error)
  reportError(error, getExtraErrorContext())
  handleUncaughtException(error)
})

function handleAppURL(url: string) {
  log.info('Processing protocol url')
  const action = parseAppURL(url)
  onDidLoad(window => {
    // This manual focus call _shouldn't_ be necessary, but is for Chrome on
    // macOS. See https://github.com/desktop/desktop/issues/973.
    window.focus()
    window.sendURLAction(action)
  })
}

let isDuplicateInstance = false

const gotSingleInstanceLock = app.requestSingleInstanceLock()
isDuplicateInstance = !gotSingleInstanceLock

app.on('second-instance', (event, args, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }

    if (!mainWindow.isVisible()) {
      mainWindow.show()
    }

    mainWindow.focus()

    if (!mainWindow.isVisible()) {
      mainWindow.show()
    }

    mainWindow.focus()
  }

  handlePossibleProtocolLauncherArgs(args)
})

if (isDuplicateInstance) {
  app.quit()
}

if (shellNeedsPatching(process)) {
  updateEnvironmentForProcess()
}

app.on('will-finish-launching', () => {
  // macOS only
  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleAppURL(url)
  })
})

app.on('open-file', async (event, path) => {
  event.preventDefault()

  log.info(`[main] a path to ${path} was triggered`)

  Fs.stat(path, (err, stats) => {
    if (err) {
      log.error(`Unable to open path '${path}' in Desktop`, err)
      return
    }

    if (stats.isFile()) {
      log.warn(
        `A file at ${path} was dropped onto Desktop, but it can only handle folders. Ignoring this action.`
      )
      return
    }

    handleAppURL(`x-github-client://openLocalRepo/${encodeURIComponent(path)}`)
  })
})

/**
 * Attempt to detect and handle any protocol handler arguments passed
 * either via the command line directly to the current process or through
 * IPC from a duplicate instance (see makeSingleInstance)
 *
 * @param args Essentially process.argv, i.e. the first element is the exec
 *             path
 */
function handlePossibleProtocolLauncherArgs(args: ReadonlyArray<string>) {
  log.info(`Received possible protocol arguments: ${args.length}`)

  if (args.length > 1) {
    handleAppURL(args[1])
  }
}

if (process.env.KACTUS_DISABLE_HARDWARE_ACCELERATION) {
  log.info(
    `KACTUS_DISABLE_HARDWARE_ACCELERATION environment variable set, disabling hardware acceleration`
  )
  app.disableHardwareAcceleration()
}

app.on('ready', () => {
  if (isDuplicateInstance) {
    return
  }

  possibleProtocols.forEach(protocol =>
    app.setAsDefaultProtocolClient(protocol)
  )

  createWindow()

  Menu.setApplicationMenu(
    buildDefaultMenu({
      selectedShell: null,
      selectedExternalEditor: null,
      askForConfirmationOnRepositoryRemoval: false,
      askForConfirmationOnForcePush: false,
    })
  )

  ipcMain.on(
    'update-preferred-app-menu-item-labels',
    (event: Electron.IpcMessageEvent, labels: MenuLabelsEvent) => {
      // The current application menu is mutable and we frequently
      // change whether particular items are enabled or not through
      // the update-menu-state IPC event. This menu that we're creating
      // now will have all the items enabled so we need to merge the
      // current state with the new in order to not get a temporary
      // race conditions where menu items which shouldn't be enabled
      // are.
      const newMenu = buildDefaultMenu(labels)

      const currentMenu = Menu.getApplicationMenu()

      // This shouldn't happen but whenever one says that it does
      // so here's the escape hatch when we can't merge the current
      // menu with the new one; we just use the new one.
      if (currentMenu === null) {
        // https://github.com/electron/electron/issues/2717
        Menu.setApplicationMenu(newMenu)

        if (mainWindow !== null) {
          mainWindow.sendAppMenu()
        }

        return
      }

      // It's possible that after rebuilding the menu we'll end up
      // with the exact same structural menu as we had before so we
      // keep track of whether anything has actually changed in order
      // to avoid updating the global menu and telling the renderer
      // about it.
      let menuHasChanged = false

      for (const newItem of getAllMenuItems(newMenu)) {
        // Our menu items always have ids and Electron.MenuItem takes on whatever
        // properties was defined on the MenuItemOptions template used to create it
        // but doesn't surface those in the type declaration.
        const id = (newItem as any).id

        if (!id) {
          continue
        }

        const currentItem = currentMenu.getMenuItemById(id)

        // Unfortunately the type information for getMenuItemById
        // doesn't specify if it'll return null or undefined when
        // the item doesn't exist so we'll do a falsy check here.
        if (!currentItem) {
          menuHasChanged = true
        } else {
          if (currentItem.label !== newItem.label) {
            menuHasChanged = true
          }

          // Copy the enabled property from the existing menu
          // item since it'll be the most recent reflection of
          // what the renderer wants.
          if (currentItem.enabled !== newItem.enabled) {
            newItem.enabled = currentItem.enabled
            menuHasChanged = true
          }
        }
      }

      if (menuHasChanged && mainWindow) {
        // https://github.com/electron/electron/issues/2717
        Menu.setApplicationMenu(newMenu)
        mainWindow.sendAppMenu()
      }
    }
  )

  type MenuEvenArg = { name: MenuEvent }
  ipcMain.on('menu-event', (event: Electron.IpcMessageEvent, args: any[]) => {
    const { name }: MenuEvenArg = event as any
    if (mainWindow) {
      mainWindow.sendMenuEvent(name)
    }
  })

  /**
   * An event sent by the renderer asking that the menu item with the given id
   * is executed (ie clicked).
   */
  ipcMain.on(
    'execute-menu-item',
    (event: Electron.IpcMessageEvent, { id }: { id: string }) => {
      const currentMenu = Menu.getApplicationMenu()

      if (currentMenu === null) {
        return
      }

      const menuItem = currentMenu.getMenuItemById(id)
      if (menuItem) {
        const window = BrowserWindow.fromWebContents(event.sender)
        const fakeEvent = { preventDefault: () => {}, sender: event.sender }
        menuItem.click(fakeEvent, window, event.sender)
      }
    }
  )

  ipcMain.on(
    'update-menu-state',
    (
      event: Electron.IpcMessageEvent,
      items: Array<{ id: string; state: IMenuItemState }>
    ) => {
      let sendMenuChangedEvent = false

      const currentMenu = Menu.getApplicationMenu()

      if (currentMenu === null) {
        log.debug(`unable to get current menu, bailing out...`)
        return
      }

      for (const item of items) {
        const { id, state } = item

        const menuItem = currentMenu.getMenuItemById(id)

        if (menuItem) {
          // Only send the updated app menu when the state actually changes
          // or we might end up introducing a never ending loop between
          // the renderer and the main process
          if (
            state.enabled !== undefined &&
            menuItem.enabled !== state.enabled
          ) {
            menuItem.enabled = state.enabled
            sendMenuChangedEvent = true
          }
        } else {
          fatalError(`Unknown menu id: ${id}`)
        }
      }

      if (sendMenuChangedEvent && mainWindow) {
        Menu.setApplicationMenu(currentMenu)
        mainWindow.sendAppMenu()
      }
    }
  )

  ipcMain.on(
    'show-contextual-menu',
    (event: Electron.IpcMessageEvent, items: ReadonlyArray<IMenuItem>) => {
      const menu = buildContextMenu(items, ix =>
        event.sender.send('contextual-menu-action', ix)
      )

      const window = BrowserWindow.fromWebContents(event.sender)
      menu.popup({ window })
    }
  )

  /**
   * An event sent by the renderer asking for a copy of the current
   * application menu.
   */
  ipcMain.on('get-app-menu', () => {
    if (mainWindow) {
      mainWindow.sendAppMenu()
    }
  })

  type ShowCertificateTrustDialogArg = {
    certificate: Electron.Certificate
    message: string
  }
  ipcMain.on(
    'show-certificate-trust-dialog',
    (
      event: Electron.IpcMessageEvent,
      { certificate, message }: ShowCertificateTrustDialogArg
    ) => {
      onDidLoad(window => {
        window.showCertificateTrustDialog(certificate, message)
      })
    }
  )

  ipcMain.on(
    'log',
    (event: Electron.IpcMessageEvent, level: LogLevel, message: string) => {
      writeLog(level, message)
    }
  )

  ipcMain.on(
    'uncaught-exception',
    (event: Electron.IpcMessageEvent, error: Error) => {
      handleUncaughtException(error)
    }
  )

  ipcMain.on(
    'send-error-report',
    (
      event: Electron.IpcMessageEvent,
      { error, extra }: { error: Error; extra: { [key: string]: string } }
    ) => {
      reportError(error, {
        ...getExtraErrorContext(),
        ...extra,
      })
    }
  )

  type OpenExternalArg = { path: string }
  ipcMain.on(
    'open-external',
    (event: Electron.IpcMessageEvent, { path }: OpenExternalArg) => {
      const pathLowerCase = path.toLowerCase()
      if (
        pathLowerCase.startsWith('http://') ||
        pathLowerCase.startsWith('https://')
      ) {
        log.info(`opening in browser: ${path}`)
      }

      const result = shell.openExternal(path)
      event.sender.send('open-external-result', { result })
    }
  )

  ipcMain.on(
    'show-item-in-folder',
    (event: Electron.IpcMessageEvent, { path }: OpenExternalArg) => {
      shell.showItemInFolder(path)
    }
  )
})

app.on('activate', () => {
  onDidLoad(window => {
    window.show()
  })
})

app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    // Prevent links or window.open from opening new window
    event.preventDefault()
    log.warn(`Prevented new window to: ${url}`)
  })
})

app.on(
  'certificate-error',
  (event, webContents, url, error, certificate, callback) => {
    callback(false)

    onDidLoad(window => {
      window.sendCertificateError(certificate, error, url)
    })
  }
)

function createWindow() {
  const window = new AppWindow()

  if (__DEV__) {
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS,
      REACT_PERF,
    } = require('electron-devtools-installer')

    require('electron-debug')({ showDevTools: true })

    const ChromeLens = {
      id: 'idikgljglpfilbhaboonnpnnincjhjkd',
      electron: '>=1.2.1',
    }

    const extensions = [REACT_DEVELOPER_TOOLS, REACT_PERF, ChromeLens]

    for (const extension of extensions) {
      try {
        installExtension(extension)
      } catch (e) {}
    }
  }

  window.onClose(() => {
    mainWindow = null
  })

  window.onDidLoad(() => {
    window.show()

    const fns = onDidLoadFns!
    onDidLoadFns = null
    for (const fn of fns) {
      fn(window)
    }
  })

  window.load()

  mainWindow = window
}

/**
 * Register a function to be called once the window has been loaded. If the
 * window has already been loaded, the function will be called immediately.
 */
function onDidLoad(fn: OnDidLoadFn) {
  if (onDidLoadFns) {
    onDidLoadFns.push(fn)
  } else {
    if (mainWindow) {
      fn(mainWindow)
    }
  }
}
