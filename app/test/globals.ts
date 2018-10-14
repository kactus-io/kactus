import { use } from 'chai'
use(require('chai-datetime'))

const Dexie = require('dexie')
Dexie.dependencies.indexedDB = require('fake-indexeddb')
Dexie.dependencies.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange')

// shims a bunch of browser specific methods
// like fetch, requestIdleCallback, etc
import 'airbnb-browser-shims/browser-only'

// These constants are defined by Webpack at build time, but since tests aren't
// built with Webpack we need to make sure these exist at runtime.
const g: any = global
g['__DEV__'] = 'false'
g['__RELEASE_CHANNEL__'] = 'development'
g['__UPDATES_URL__'] = ''
g['__SHA__'] = 'test'

g['log'] = {
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
} as IKactusLogger
