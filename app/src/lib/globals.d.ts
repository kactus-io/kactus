/** Is the app running in dev mode? */
declare const __DEV__: boolean

/** The OAuth client id the app should use */
declare const __OAUTH_CLIENT_ID__: string | undefined

/** The OAuth secret the app should use. */
declare const __OAUTH_SECRET__: string | undefined

/** The stripe key the app should use */
declare const __STRIPE_KEY__: string | undefined

/** Is the app being built to run on Darwin? */
declare const __DARWIN__: boolean

/** Is the app being built to run on Win32? */
declare const __WIN32__: boolean

/**
 * The commit id of the repository HEAD at build time.
 * Represented as a 40 character SHA-1 hexadecimal digest string.
 */
declare const __SHA__: string

/** The environment for which the release was created. */
declare const __RELEASE_ENV__: 'production' | 'beta' | 'test' | 'development'

/**
 * The currently executing process kind, this is specific to desktop
 * and identifies the processes that we have.
 */
declare const __PROCESS_KIND__: 'main' | 'ui' | 'shared' | 'crash' | 'askpass'

/**
 * Request an idle callback. See https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
 * for more information.
 */
declare function requestIdleCallback(fn: () => void, options?: { timeout: number }): number

declare interface IDesktopLogger {
  /**
   * Writes a log message at the 'error' level.
   *
   * The error will be persisted to disk as long as the disk transport is
   * configured to pass along log messages at this level. For more details
   * about the on-disk transport, see log.ts in the main process.
   *
   * If used from a renderer the log message will also be appended to the
   * devtools console.
   *
   * @param message The text to write to the log file
   * @param error   An optional error instance that will be formatted to
   *                include the stack trace (if one is available) and
   *                then appended to the log message.
   */
  error(message: string, error?: Error): void

  /**
   * Writes a log message at the 'warn' level.
   *
   * The error will be persisted to disk as long as the disk transport is
   * configured to pass along log messages at this level. For more details
   * about the on-disk transport, see log.ts in the main process.
   *
   * If used from a renderer the log message will also be appended to the
   * devtools console.
   *
   * @param message The text to write to the log file
   * @param error   An optional error instance that will be formatted to
   *                include the stack trace (if one is available) and
   *                then appended to the log message.
   */
  warn(message: string, error?: Error): void

  /**
   * Writes a log message at the 'info' level.
   *
   * The error will be persisted to disk as long as the disk transport is
   * configured to pass along log messages at this level. For more details
   * about the on-disk transport, see log.ts in the main process.
   *
   * If used from a renderer the log message will also be appended to the
   * devtools console.
   *
   * @param message The text to write to the log file
   * @param error   An optional error instance that will be formatted to
   *                include the stack trace (if one is available) and
   *                then appended to the log message.
   */
  info(message: string, error?: Error): void

  /**
   * Writes a log message at the 'debug' level.
   *
   * The error will be persisted to disk as long as the disk transport is
   * configured to pass along log messages at this level. For more details
   * about the on-disk transport, see log.ts in the main process.
   *
   * If used from a renderer the log message will also be appended to the
   * devtools console.
   *
   * @param message The text to write to the log file
   * @param error   An optional error instance that will be formatted to
   *                include the stack trace (if one is available) and
   *                then appended to the log message.
   */
  debug(message: string, error?: Error): void
}

declare const log: IDesktopLogger
// these changes should be pushed into the Electron declarations

declare namespace NodeJS {
  // tslint:disable-next-line:interface-name
  interface Process extends EventEmitter {
    once(event: 'uncaughtException', listener: (error: Error) => void): this
    on(event: 'uncaughtException', listener: (error: Error) => void): this
    removeListener(event: 'exit', listener: Function): this
    once(event: 'exit', listener: Function): this
  }
}

declare namespace Electron {
  // tslint:disable-next-line:interface-name
  interface MenuItem {
    readonly accelerator?: Electron.Accelerator
    readonly submenu?: Electron.Menu
    readonly role?: string
    readonly type: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio'
  }

  // tslint:disable-next-line:interface-name
  interface RequestOptions {
    readonly method: string
    readonly url: string
    readonly headers: any
  }

  type AppleActionOnDoubleClickPref = 'Maximize' | 'Minimize' | 'None'

  // tslint:disable-next-line:interface-name
  interface SystemPreferences {
    getUserDefault(key: 'AppleActionOnDoubleClick', type: 'string'): AppleActionOnDoubleClickPref
  }

}

interface ICard {
  id: string
  object: string
  address_city: string | null
  address_country: string | null
  address_line1: string | null
  address_line1_check: string | null
  address_line2: string | null
  address_state: string | null
  address_zip: string | null
  address_zip_check: string | null
  brand: string
  country: string
  cvc_check: string
  dynamic_last4: string | null
  exp_month: number
  exp_year: number
  funding: string
  last4: string
  metadata: {}
  name: string
  tokenization_method: string | null
}

declare interface IToken {
  id: string
  object: string
  card: ICard
  client_ip: string
  created: number
  email: string
  livemode: boolean
  type: string
  used: boolean
}

declare interface IStripeCheckout {
  open(props: {
    token: (token: IToken) => void,
    opened: () => void,
    closed: () => void,
    name: string,
    amount: number,
    email?: string,
    bitcoin: boolean,
  }): void
  close(): void
}

interface IStripeCheckoutToConfigure {
  configure(params: {key?: string}): IStripeCheckout
}

declare const StripeCheckout: IStripeCheckoutToConfigure
