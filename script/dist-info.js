'use strict'

const path = require('path')
const fs = require('fs')
const os = require('os')

const packageInfo = require('../app/package-info')
const productName = packageInfo.getProductName()
const version = packageInfo.getVersion()

const projectRoot = path.join(__dirname, '..')

function getDistRoot() {
  return path.join(projectRoot, 'dist')
}

function getDistPath() {
  return path.join(
    getDistRoot(),
    `${getExecutableName()}-${process.platform}-${os.arch()}`
  )
}

function getExecutableName() {
  return productName
}

function getOSXZipName() {
  return `${productName}-macos.zip`
}

function getOSXZipPath() {
  return path.join(getDistPath(), '..', getOSXZipName())
}

function getBundleSizes() {
  const rendererStats = fs.statSync(
    path.join(projectRoot, 'out', 'renderer.js')
  )
  const mainStats = fs.statSync(path.join(projectRoot, 'out', 'main.js'))
  return { rendererSize: rendererStats.size, mainSize: mainStats.size }
}

function getReleaseBranchName() {
  const branchName = process.env.TRAVIS_BRANCH || process.env.CIRCLE_BRANCH

  return branchName || ''
}

function getReleaseChannel() {
  // Branch name format: __release-CHANNEL-DEPLOY_ID
  const pieces = getReleaseBranchName().split('-')
  if (pieces.length < 3 || pieces[0] !== '__release') {
    return process.env.NODE_ENV || 'development'
  }

  return pieces[1]
}

function getReleaseSHA() {
  // Branch name format: __release-CHANNEL-DEPLOY_ID
  const pieces = getReleaseBranchName().split('-')
  if (pieces.length < 3 || pieces[0] !== '__release') {
    return null
  }

  return pieces[2]
}

function getUpdatesURL() {
  return `https://update.electronjs.org/kactus-io/kactus/darwin/${version}`
}

function shouldMakeDelta() {
  // Only production and beta channels include deltas. Test releases aren't
  // necessarily sequential so deltas wouldn't make sense.
  const channelsWithDeltas = ['production', 'beta']
  return channelsWithDeltas.indexOf(getReleaseChannel()) > -1
}

function getCLICommands() {
  return fs
    .readdirSync(path.resolve(projectRoot, 'app', 'src', 'cli', 'commands'))
    .filter(name => name.endsWith('.ts'))
    .map(name => name.replace(/\.ts$/, ''))
}

/**
 * Attempt to dereference the given ref without requiring a Git environment
 * to be present. Note that this method will not be able to dereference packed
 * refs but should suffice for simple refs like 'HEAD'.
 *
 * Will throw an error for unborn HEAD.
 *
 * @param {string} gitDir The path to the Git repository's .git directory
 * @param {string} ref    A qualified git ref such as 'HEAD' or 'refs/heads/master'
 */
function revParse(gitDir, ref) {
  const refPath = path.join(gitDir, ref)
  const refContents = fs.readFileSync(refPath)
  const refRe = /^([a-f0-9]{40})|(?:ref: (refs\/.*))$/m
  const refMatch = refRe.exec(refContents)

  if (!refMatch) {
    throw new Error(
      `Could not de-reference HEAD to SHA, invalid ref in ${refPath}: ${refContents}`
    )
  }

  return refMatch[1] || revParse(gitDir, refMatch[2])
}

function getSHA() {
  // CircleCI does some funny stuff where HEAD points to an packed ref, but
  // luckily it gives us the SHA we want in the environment.
  const circleSHA = process.env.TRAVIS_COMMIT || process.env.CIRCLE_SHA1
  if (circleSHA) {
    return circleSHA
  }

  return revParse(path.resolve(__dirname, '../.git'), 'HEAD')
}

module.exports = {
  getDistRoot,
  getDistPath,
  getOSXZipName,
  getOSXZipPath,
  getBundleSizes,
  getReleaseChannel,
  getReleaseSHA,
  getUpdatesURL,
  shouldMakeDelta,
  getReleaseBranchName,
  getExecutableName,
}
