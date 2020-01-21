import * as Path from 'path'
import * as Fs from 'fs'

import { getProductName, getVersion } from '../app/package-info'
import { getReleaseBranchName } from './build-platforms'

const productName = getProductName()
const version = getVersion()

const projectRoot = Path.join(__dirname, '..')

const publishChannels = ['production', 'test', 'beta']

export function getDistRoot() {
  return Path.join(projectRoot, 'dist')
}

export function getDistPath() {
  return Path.join(
    getDistRoot(),
    `${getExecutableName()}-${process.platform}-x64`
  )
}

export function getExecutableName() {
  return productName
}

export function getOSXZipName() {
  return `${productName}-macos.zip`
}

export function getOSXZipPath() {
  return Path.join(getDistPath(), '..', getOSXZipName())
}

export function getBundleSizes() {
  // eslint-disable-next-line no-sync
  const rendererStats = Fs.statSync(
    Path.join(projectRoot, 'out', 'renderer.js')
  )
  // eslint-disable-next-line no-sync
  const mainStats = Fs.statSync(Path.join(projectRoot, 'out', 'main.js'))
  return { rendererSize: rendererStats.size, mainSize: mainStats.size }
}

export function isPublishable(): boolean {
  const channelFromBranch = getChannelFromBranch()
  return channelFromBranch !== undefined
    ? publishChannels.includes(channelFromBranch)
    : false
}

export function getChannel() {
  const channelFromBranch = getChannelFromBranch()
  return channelFromBranch !== undefined
    ? channelFromBranch
    : process.env.NODE_ENV || 'development'
}

function getChannelFromBranch(): string | undefined {
  // Branch name format: __release-CHANNEL-DEPLOY_ID
  const pieces = getReleaseBranchName().split('-')
  if (pieces.length < 3 || pieces[0] !== '__release') {
    return
  }
  return pieces[1]
}

export function getReleaseSHA() {
  // Branch name format: __release-CHANNEL-DEPLOY_ID
  const pieces = getReleaseBranchName().split('-')
  if (pieces.length < 3 || pieces[0] !== '__release') {
    return null
  }

  return pieces[2]
}

export function getUpdatesURL() {
  return `https://update.electronjs.org/kactus-io/kactus/darwin/${version}`
}

export function shouldMakeDelta() {
  // Only production and beta channels include deltas. Test releases aren't
  // necessarily sequential so deltas wouldn't make sense.
  const channelsWithDeltas = ['production', 'beta']
  return channelsWithDeltas.indexOf(getChannel()) > -1
}

export function getIconFileName(): string {
  const baseName = 'icon-logo'
  return getChannel() === 'development' ? `${baseName}-yellow` : baseName
}
