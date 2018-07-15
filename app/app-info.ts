import * as fs from 'fs'
import * as Path from 'path'

import { getSHA } from './git-info'
import { getUpdatesURL, getReleaseChannel } from '../script/dist-info'

const projectRoot = Path.dirname(__dirname)

const devClientId = 'e2192ac9bf572ac04bfb'
const devClientSecret = 'c9b11bb47ee91ef08545a5355658b37a100d46e1'
const devStripeKey = 'pk_test_wqDaZ2Vc1Vlja0RflUevsa9K'

const channel = getReleaseChannel()

export function getCLICommands() {
  return (
    // eslint-disable-next-line no-sync
    fs
      .readdirSync(Path.resolve(projectRoot, 'app', 'src', 'cli', 'commands'))
      .filter(name => name.endsWith('.ts'))
      .map(name => name.replace(/\.ts$/, ''))
  )
}

const s = JSON.stringify

export function getReplacements() {
  return {
    __OAUTH_CLIENT_ID__: JSON.stringify(
      process.env.KACTUS_OAUTH_CLIENT_ID || devClientId
    ),
    __OAUTH_SECRET__: JSON.stringify(
      process.env.KACTUS_OAUTH_CLIENT_SECRET || devClientSecret
    ),
    __STRIPE_KEY__: JSON.stringify(process.env.STRIPE_KEY || devStripeKey),
    __DEV__: channel === 'development',
    __RELEASE_CHANNEL__: s(channel),
    __UPDATES_URL__: s(getUpdatesURL()),
    __SHA__: s(getSHA()),
    __CLI_COMMANDS__: s(getCLICommands()),
    'process.platform': s(process.platform),
    'process.env.NODE_ENV': s(process.env.NODE_ENV || 'development'),
    'process.env.TEST_ENV': s(process.env.TEST_ENV),
  }
}
